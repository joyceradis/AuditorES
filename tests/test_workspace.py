import base64
import json
import tempfile
import threading
import unittest
from http.client import HTTPConnection
from pathlib import Path

from auditor.server import Workspace, load_accounts, password_digest


ROW = {
    "indicator": "Indicador sintético", "value": 11, "unit": "total",
    "period": "2022", "source": "IBGE", "reference": "https://ibge.gov.br/",
    "method": "Somatório de dados sintéticos",
}
VITORIA = "?city=vitoria&scope=pa-sao-pedro"
MF = "?city=marechal-floriano&scope=victor-hugo"


class WorkspaceTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        path = Path(directory.name)
        salt = bytes.fromhex("f0" * 16)
        credential = {"salt": salt.hex(), "digest": password_digest(b"mock-secret", salt).hex()}
        accounts = {
            "writer": {**credential, "grants": {"vitoria": {"pa-sao-pedro": "write"}}},
            "reader": {**credential, "grants": {"vitoria": {"pa-sao-pedro": "read"}}},
            "other": {**credential, "grants": {"marechal-floriano": {"victor-hugo": "read"}}},
        }
        (path / "accounts.json").write_text(json.dumps(accounts))
        self.server = Workspace(("127.0.0.1", 0), load_accounts(path / "accounts.json"), path / "data.sqlite3")
        worker = threading.Thread(target=self.server.serve_forever)
        worker.start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(worker.join)
        self.addCleanup(self.server.shutdown)

    def request(self, path, user=None, data=None, import_header=True):
        conn = HTTPConnection(*self.server.server_address)
        try:
            headers = {}
            if user:
                token = base64.b64encode(f"{user}:mock-secret".encode()).decode()
                headers["Authorization"] = "Basic " + token
            if data is not None:
                headers["Content-Type"] = "application/json"
                if import_header:
                    headers["X-AuditorES-Import"] = "1"
            conn.request("POST" if data is not None else "GET", path,
                         json.dumps(data) if data is not None else None, headers)
            response = conn.getresponse()
            body = response.read()
            return response.status, response.headers, body
        finally:
            conn.close()

    def test_all_workspace_resources_require_authentication(self):
        for path in ("/", "/workspace.js", "/api/catalog", "/api/observations" + VITORIA):
            status, headers, _ = self.request(path)
            self.assertEqual(status, 401)
            self.assertIn("no-store", headers["Cache-Control"])
        self.assertEqual(self.request("/", "unknown")[0], 401)
        self.assertEqual(self.request("/", "reader")[0], 200)
        self.assertEqual(self.request("/local-data/data.sqlite3", "reader")[0], 404)

    def test_read_write_and_export_are_scoped(self):
        self.assertEqual(self.request("/api/import" + VITORIA, "reader", [ROW])[0], 403)
        self.assertEqual(self.request("/api/import" + VITORIA, "writer", [ROW], False)[0], 415)
        self.assertEqual(self.request("/api/import" + VITORIA, "writer", [ROW])[0], 200)
        for endpoint in ("/api/observations", "/api/export"):
            self.assertEqual(self.request(endpoint + VITORIA, "other")[0], 403)
            self.assertEqual(self.request(endpoint + MF, "reader")[0], 403)
        status, headers, body = self.request("/api/export" + VITORIA + "&period=2022&source=IBGE", "reader")
        self.assertEqual(status, 200)
        self.assertIn("attachment", headers["Content-Disposition"])
        self.assertEqual(json.loads(body), [ROW])
        self.assertEqual(json.loads(self.request("/api/export" + VITORIA + "&period=2023", "reader")[2]), [])
        catalog = json.loads(self.request("/api/catalog", "other")[2])["cities"]
        self.assertEqual(catalog["marechal-floriano"]["axis"], "Inteligência territorial")
        self.assertEqual(catalog["marechal-floriano"]["axisId"], "inteligencia-territorial")
        self.assertEqual(catalog["marechal-floriano"]["kinds"], ["Território", "Unidade"])
        self.assertEqual(catalog["marechal-floriano"]["scopes"], {
            "victor-hugo": {
                "name": "ESF Victor Hugo · Unidade", "label": "ESF Victor Hugo",
                "kind": "Unidade", "role": "read",
            }
        })
        self.assertEqual(catalog["vitoria"]["axisId"], "auditoria-os")
        self.assertEqual(catalog["vitoria"]["kinds"], ["Unidade", "Contrato"])
        self.assertEqual(catalog["vitoria"]["scopes"], {})

    def test_conflict_rolls_back_batch_without_overwriting(self):
        target = "/api/import" + VITORIA
        self.assertEqual(self.request(target, "writer", [ROW])[0], 200)
        extra = {**ROW, "period": "2023"}
        different_value = {**ROW, "value": 12}
        status, _, body = self.request(target, "writer", [extra, different_value])
        self.assertEqual(status, 409)
        self.assertIn("Registro 2", json.loads(body)["error"])
        self.assertEqual(json.loads(self.request("/api/observations" + VITORIA, "reader")[2]), [ROW])

    def test_import_is_atomic_and_repeatable(self):
        path = "/api/import" + VITORIA
        for row in ({**ROW, "cpf": "campo proibido"}, {**ROW, "reference": "javascript:alert(1)"},
                    {**ROW, "period": "2026-13"}, {**ROW, "value": float("nan")}):
            self.assertEqual(self.request(path, "writer", [ROW, row])[0], 400)
        self.assertEqual(json.loads(self.request("/api/observations" + VITORIA, "reader")[2]), [])
        self.assertEqual(json.loads(self.request(path, "writer", [ROW, ROW])[2]), {"added": 1, "duplicates": 1})
        self.assertEqual(json.loads(self.request(path, "writer", [ROW])[2]), {"added": 0, "duplicates": 1})


if __name__ == "__main__":
    unittest.main()
