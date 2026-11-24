"""Servidor da área de trabalho. A vitrine tem um pacote de publicação próprio."""

import argparse
import base64
import binascii
import getpass
import hashlib
import hmac
import json
import math
import os
import re
import secrets
import sqlite3
from contextlib import closing
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from .catalog import AXES, SCOPES, SOURCES

HERE = Path(__file__).resolve().parent
MAX_BODY = 256 * 1024
MAX_ROWS = 1000
IDENTITY_FIELDS = ("indicator", "unit", "period", "source", "reference", "method")
FIELDS = {*IDENTITY_FIELDS, "value"}
TEXT_PATTERN = re.compile(r"[\wÀ-ÿ .,%()²³/·+–-]+")
ASSETS = {
    "/": ("workspace.html", "text/html; charset=utf-8"),
    "/workspace.css": ("workspace.css", "text/css; charset=utf-8"),
    "/workspace.js": ("workspace.js", "text/javascript; charset=utf-8"),
}


def password_digest(password, salt):
    return hashlib.scrypt(password, salt=salt, n=2**15, r=8, p=1, maxmem=64 * 1024**2)


def load_scopes(path):
    scopes = {city: (name, axis, entries.copy()) for city, (name, axis, entries) in SCOPES.items()}
    if path is not None:
        for city, entries in json.loads(path.read_text(encoding="utf-8")).items():
            if city not in scopes:
                raise ValueError("Município inválido na definição de recorte.")
            _, axis, current_scopes = scopes[city]
            _, kinds = AXES[axis]
            for scope, entry in entries.items():
                name, kind = entry["name"], entry["kind"]
                if (scope in current_scopes or kind not in kinds
                        or not re.fullmatch(r"[a-z0-9-]{1,80}", scope)
                        or not isinstance(name, str) or not 1 <= len(name.strip()) <= 120):
                    raise ValueError("Definição de recorte inválida.")
                current_scopes[scope] = (name.strip(), kind)
    return scopes


def load_accounts(path, catalog=SCOPES):
    accounts = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(accounts, dict) or not accounts:
        raise ValueError("Configure ao menos uma conta.")
    for username, account in accounts.items():
        if not re.fullmatch(r"[a-zA-Z0-9._-]{1,64}", username):
            raise ValueError("Usuário inválido.")
        salt, digest = (bytes.fromhex(account[key]) for key in ("salt", "digest"))
        if len(salt) != 16 or len(digest) != 64 or not account["grants"]:
            raise ValueError("Credencial ou permissões inválidas.")
        for city, scopes in account["grants"].items():
            if city not in catalog or not isinstance(scopes, dict) or not scopes:
                raise ValueError("Município ou permissões inválidas.")
            for scope, role in scopes.items():
                if scope not in catalog[city][2] or role not in {"read", "write"}:
                    raise ValueError("Recorte ou papel inválido.")
        account.update(salt=salt, digest=digest)
    return accounts


def validate_row(row):
    if not isinstance(row, dict) or row.keys() != FIELDS:
        raise ValueError("Campos inválidos para uma observação agregada.")
    if not isinstance(row["source"], str) or row["source"] not in SOURCES:
        raise ValueError("Fonte fora do catálogo.")
    period = row["period"]
    if not isinstance(period, str) or not re.fullmatch(r"(?:19|20)\d{2}(?:-(?:0[1-9]|1[0-2]))?", period, re.ASCII):
        raise ValueError("Use AAAA ou AAAA-MM para a competência.")
    value = row["value"]
    if type(value) not in {int, float} or not -1e15 <= value <= 1e15 or not math.isfinite(value):
        raise ValueError("Valor numérico inválido.")
    for key, limit in {"indicator": 120, "unit": 32, "method": 400}.items():
        value = row[key]
        if not isinstance(value, str) or not 1 <= len(value) <= limit or not value.strip() or not TEXT_PATTERN.fullmatch(value):
            raise ValueError(f"Campo inválido: {key}.")
    reference = row["reference"]
    if not isinstance(reference, str) or len(reference) > 300:
        raise ValueError("Referência inválida.")
    url = urlsplit(reference)
    if (url.scheme != "https" or not url.hostname or not (url.hostname == "gov.br" or url.hostname.endswith(".gov.br"))
            or url.username is not None or url.password is not None or url.port not in {None, 443}
            or chr(92) in reference
            or any(char.isspace() or ord(char) < 32 for char in reference)):
        raise ValueError("Informe uma referência HTTPS em domínio gov.br.")
    return row


def connect(path):
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    return db


class ObservationConflict(Exception):
    """Valor diferente para uma evidência com a mesma identidade."""


def json_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("O JSON contém um campo repetido.")
        result[key] = value
    return result


def store_observations(path, scope, username, rows):
    columns = ("city", "scope", *IDENTITY_FIELDS)
    conditions = " AND ".join(f"{column} = ?" for column in columns)
    fields = ", ".join((*columns, "value", "imported_by"))
    added = 0
    with closing(connect(path)) as db, db:
        # Serializa a conferência da identidade e a gravação do lote.
        db.execute("BEGIN IMMEDIATE")
        for position, row in enumerate(rows, start=1):
            identity = (*scope, *(row[field] for field in IDENTITY_FIELDS))
            prior = db.execute(f"SELECT value FROM observations WHERE {conditions}", identity).fetchone()
            if prior is not None:
                if prior["value"] != row["value"]:
                    raise ObservationConflict(position)
                continue
            db.execute(
                f"INSERT INTO observations ({fields}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (*identity, row["value"], username),
            )
            added += 1
    return added


class Workspace(HTTPServer):
    def __init__(self, address, accounts, db_path, catalog=SCOPES):
        self.accounts = accounts
        self.catalog = catalog
        self.db_path = db_path
        with closing(connect(db_path)) as db:
            db.execute("""
                CREATE TABLE IF NOT EXISTS observations (
                    city TEXT NOT NULL, scope TEXT NOT NULL, indicator TEXT NOT NULL,
                    unit TEXT NOT NULL, period TEXT NOT NULL, source TEXT NOT NULL,
                    reference TEXT NOT NULL, method TEXT NOT NULL, value REAL NOT NULL,
                    imported_by TEXT NOT NULL, imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(city, scope, indicator, unit, period, source, reference, method)
                )
            """)
        super().__init__(address, Handler)

    def get_request(self):
        sock, address = super().get_request()
        sock.settimeout(10)
        return sock, address


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Consultas, URLs e credenciais podem conter informações restritas.
        pass

    def send_payload(self, status, payload, content_type="application/json", headers=None):
        if content_type == "application/json":
            payload = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store, private")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(payload)

    def authenticate(self):
        scheme, _, token = self.headers.get("Authorization", "").partition(" ")
        if scheme.lower() == "basic" and len(token) <= 1024:
            try:
                username, password = base64.b64decode(token, validate=True).decode().split(":", 1)
            except (ValueError, binascii.Error):
                username, password = "", ""
            account = self.server.accounts.get(username)
            digest = password_digest(password.encode(), account["salt"] if account else bytes(16))
            if hmac.compare_digest(digest, account["digest"] if account else bytes(64)) and account:
                return account, username
        self.send_payload(401, {"error": "Autenticação necessária."},
                          headers={"WWW-Authenticate": 'Basic realm="AuditorES", charset="UTF-8"'})
        return None, None

    def selected_scope(self, query, account, write=False):
        city, scope = (query.get(key, [""])[0] for key in ("city", "scope"))
        role = account["grants"].get(city, {}).get(scope)
        if not role or (write and role != "write"):
            self.send_payload(403, {"error": "Sem permissões para este recorte."})
            return None
        return city, scope

    def do_GET(self):
        account, _ = self.authenticate()
        if account is None:
            return
        url = urlsplit(self.path)
        if url.path in ASSETS:
            file, content_type = ASSETS[url.path]
            self.send_payload(200, (HERE / file).read_bytes(), content_type)
        elif url.path == "/api/catalog":
            cities = {}
            for city, (name, axis_id, scopes) in self.server.catalog.items():
                axis, kinds = AXES[axis_id]
                grants = account["grants"].get(city, {})
                entries = {}
                for scope, role in grants.items():
                    label, kind = scopes[scope]
                    entries[scope] = {"name": f"{label} · {kind}", "label": label, "kind": kind, "role": role}
                cities[city] = {"name": name, "axis": axis, "axisId": axis_id, "kinds": kinds, "scopes": entries}
            self.send_payload(200, {"cities": cities, "sources": SOURCES})
        elif url.path in {"/api/observations", "/api/export"}:
            query = parse_qs(url.query)
            scope = self.selected_scope(query, account)
            if scope is None:
                return
            conditions = ["city = ?", "scope = ?"]
            args = list(scope)
            for field in ("period", "source"):
                if field in query:
                    conditions.append("substr(period, 1, 4) = ?" if field == "period" else "source = ?")
                    args.append(query[field][0])
            try:
                with closing(connect(self.server.db_path)) as db:
                    rows = db.execute(
                        "SELECT indicator, value, unit, period, source, reference, method FROM observations "
                        f"WHERE {' AND '.join(conditions)} ORDER BY period, indicator, source, reference, unit, method", args
                    ).fetchall()
            except sqlite3.Error:
                self.send_payload(503, {"error": "Consulta indisponível. Tente novamente."})
                return
            headers = {"Content-Disposition": f'attachment; filename="{scope[0]}-{scope[1]}.json"'} if url.path.endswith("/export") else None
            self.send_payload(200, [dict(row) for row in rows], headers=headers)
        else:
            self.send_payload(404, {"error": "Página indisponível."})

    def do_POST(self):
        account, username = self.authenticate()
        if account is None:
            return
        url = urlsplit(self.path)
        if url.path != "/api/import":
            self.send_payload(404, {"error": "Página indisponível."})
            return
        scope = self.selected_scope(parse_qs(url.query), account, write=True)
        if scope is None:
            return
        if self.headers.get("X-AuditorES-Import") != "1" or self.headers.get_content_type() != "application/json":
            self.send_payload(415, {"error": "Importação aceita apenas JSON enviado pela área de trabalho."})
            return
        try:
            lengths = self.headers.get_all("Content-Length", [])
            if len(lengths) != 1 or not lengths[0].isascii() or not lengths[0].isdigit() or self.headers.get("Transfer-Encoding"):
                raise ValueError("Tamanho de arquivo inválido.")
            size = int(lengths[0])
            if not 0 < size <= MAX_BODY:
                self.send_payload(413, {"error": "Arquivo excede o limite de 256 KiB ou está vazio."})
                return
            payload = self.rfile.read(size)
            if len(payload) != size:
                raise ValueError("O arquivo chegou incompleto.")
            rows = json.loads(payload.decode("utf-8-sig"), object_pairs_hook=json_object)
            if not isinstance(rows, list) or not 1 <= len(rows) <= MAX_ROWS:
                raise ValueError("Importe de 1 a 1.000 observações agregadas.")
            for position, row in enumerate(rows, start=1):
                try:
                    validate_row(row)
                except ValueError as exc:
                    raise ValueError(f"Registro {position}. {exc}") from None
        except (json.JSONDecodeError, UnicodeError, TimeoutError, RecursionError):
            self.send_payload(400, {"error": "Arquivo JSON inválido ou incompleto."})
            return
        except ValueError as exc:
            self.send_payload(400, {"error": str(exc)})
            return
        try:
            added = store_observations(self.server.db_path, scope, username, rows)
        except ObservationConflict as exc:
            self.send_payload(409, {"error": (
                f"Registro {exc.args[0]}. Já existe uma observação com a mesma referência e um valor diferente. "
                "Confira o documento de origem. Nenhuma alteração deste lote foi aplicada."
            )})
            return
        except sqlite3.Error:
            self.send_payload(503, {"error": "Importação indisponível. Tente novamente."})
            return
        self.send_payload(200, {"added": added, "duplicates": len(rows) - added})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hash-password", action="store_true")
    parser.add_argument("--accounts", type=Path)
    parser.add_argument("--db", type=Path)
    parser.add_argument("--scopes", type=Path)
    parser.add_argument("--port", default=8080, type=int)
    args = parser.parse_args()
    if args.hash_password:
        password = getpass.getpass("Senha (mínimo 16 caracteres): ")
        if len(password) < 16:
            parser.error("Senha curta.")
        salt = secrets.token_bytes(16)
        print(json.dumps({"salt": salt.hex(), "digest": password_digest(password.encode(), salt).hex()}))
        return
    if not args.accounts or not args.db:
        parser.error("Informe --accounts e --db.")
    os.umask(0o077)
    catalog = load_scopes(args.scopes)
    with Workspace(("127.0.0.1", args.port), load_accounts(args.accounts, catalog), args.db, catalog) as server:
        print(f"AuditorES em http://127.0.0.1:{args.port}")
        server.serve_forever()


if __name__ == "__main__":
    main()
