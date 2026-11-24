#!/usr/bin/env python3
"""Gera as rotas municipais e o catálogo a partir de um único modelo."""

import json
import math
import re
import sys
import unicodedata
from html import escape
from pathlib import Path
from string import Template
from urllib.parse import urlsplit

from scripts.contratos_publicos import render_contratos

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
SOURCE_MARKER = "<!-- fontes-comuns -->"
COMMON_SOURCES = (
    ("Boletim Estadual da Atenção Primária 2025", "Referência para cobertura de APS, equipes e avaliação da pessoa idosa no Espírito Santo.",
     "https://atencaoprimaria.es.gov.br/Media/AtencaoPrimaria/LinhasDeCuidados/BOLETIM%20APS%202025%20-%20validado%20%2017%20de%20abril%202026.pdf"),
    ("Publicações da Atenção Primária do Espírito Santo", "Boletins da SESA/ES.", "https://atencaoprimaria.es.gov.br/Publicacoes"),
    ("Cadastro Nacional de Estabelecimentos de Saúde", "Consulta de estabelecimentos por município.", "https://cnes.datasus.gov.br/"),
    ("Portal Nacional de Contratações Públicas", "Pesquisa de editais, atas e contratos.", "https://www.gov.br/pncp/pt-br"),
)

EXTRA_NAV = """<a data-tab="idosos" href="#pessoa-idosa">Pessoa idosa</a>
    <a data-tab="direitos" href="#direitos">Direitos e condutas</a>
    <a data-tab="metodo" href="#metodologia">Metodologia local</a>"""


def text(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Esperado texto preenchido, recebido: {value!r}")
    return escape(value.strip())


def https(value):
    if not isinstance(value, str):
        raise ValueError("A referência precisa ser uma URL HTTPS.")
    url = urlsplit(value)
    if url.scheme != "https" or not url.hostname or url.username or url.password or any(c.isspace() or c == "\\" for c in value):
        raise ValueError(f"URL inválida ou sem HTTPS: {value!r}")
    return escape(value)


def normalize(value):
    return "".join(char for char in unicodedata.normalize("NFD", value.lower()) if unicodedata.category(char) != "Mn")


def part(name):
    return (SITE / name).read_text(encoding="utf-8")


def load_catalog():
    catalog = json.loads(part("municipios.json"))
    cities = catalog["municipios"]
    studies = json.loads(part("estudos.json"))
    slugs = {city["slug"] for city in cities}
    ids = {city["id"] for city in cities}
    if len(cities) != 78 or len(slugs) != 78 or len(ids) != 78:
        raise ValueError("O catálogo do Espírito Santo deve ter 78 municípios distintos.")
    if not all(type(city["id"]) is int and str(city["id"]).startswith("32")
               and re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", city["slug"])
               and city["nome"].strip() for city in cities):
        raise ValueError("Código, nome ou rota municipal inválidos.")
    if not set(studies).issubset(slugs):
        raise ValueError("Há um estudo sem município correspondente no catálogo.")
    for slug, config in studies.items():
        if config.get("aps") and (slug != "marechal-floriano" or config["aps"] != "marechal"):
            raise ValueError(f"Extensão de APS desconhecida em {slug}. Registros comuns usam 'indicadores'.")
        if config.get("aps") and config.get("indicadores"):
            raise ValueError(f"As fichas de {slug} são mantidas na base de dados da extensão.")
    return sorted(cities, key=lambda city: normalize(city["nome"])), studies, catalog["fonte"]


def overview(has_aps, has_study):
    aps = "Indicadores com período, recorte e documento de origem." if has_aps else "Aguardando a revisão dos indicadores locais."
    contracts = "Etapa da revisão documental e fontes para consulta." if has_study else "Aguardando o levantamento dos documentos locais."
    return f"""<section class="screen" id="screen-overview" aria-labelledby="visao-geral">
      <h2 id="visao-geral">Visão geral</h2>
      <div class="municipal-choices">
        <a class="card" href="#indicadores"><h3>Atenção Primária (APS)</h3><p>{aps}</p></a>
        <a class="card" href="#contratos"><h3>Contratos e OS</h3><p>{contracts}</p></a>
        <a class="card" href="#fontes"><h3>Fontes e limites</h3><p>Bases oficiais para consulta e regras de publicação.</p></a>
      </div>
    </section>"""


def indicators_panel(records):
    base = """<section class="screen" id="screen-dados" aria-labelledby="indicadores">
      <span id="aps" aria-hidden="true"></span>
      <h2 id="indicadores">Atenção Primária (APS)</h2>"""
    if not records:
        return base + """<div class="card municipal-pending">
          <h3>Ops, esta seção ainda está em construção</h3>
          <p>Ainda não publicamos indicadores de atenção primária revisados para este município.</p>
          <a href="#fontes">Consultar as fontes disponíveis</a>
        </div>
      </section>"""

    rows = []
    for record in records:
        value = record["valor"]
        if type(value) not in (int, float) or not math.isfinite(value):
            raise ValueError("Um indicador publicado precisa de valor numérico finito. Ausência de dado fica fora da tabela.")
        amount = escape(str(value).replace(".", ","))
        unit = text(record["unidade"])
        detail = text(record["metodo"])
        source = record["fonte"]
        rows.append(
            f'<tr><th scope="row">{text(record["indicador"])}</th><td>{amount} {unit}</td>'
            f'<td>{text(record["recorte"])}</td><td>{text(record["competencia"])}</td>'
            f'<td><a href="{https(source["url"])}">{text(source["titulo"])}</a><br>{detail}</td></tr>'
        )
    return base + """<div class="tableWrap" tabindex="0" role="region" aria-label="Indicadores de APS">
      <table><thead><tr><th scope="col">Indicador</th><th scope="col">Valor</th>
      <th scope="col">Recorte</th><th scope="col">Competência</th><th scope="col">Fonte e método</th>
      </tr></thead><tbody>""" + "".join(rows) + "</tbody></table></div></section>"


def source_item(title, url, description=""):
    note = f"<p>{text(description)}</p>" if description else ""
    return f'<li><a href="{https(url)}">{text(title)} <span aria-hidden="true">↗</span></a>{note}</li>'


def common_sources(config, include_local):
    local = config.get("contratos", {}).get("fonte")
    local_section = source_item(local["titulo"], local["url"], "Referência para consultar os documentos do município.") if include_local and local else ""
    items = "".join(source_item(title, url, description) for title, description, url in COMMON_SOURCES)
    return f"""<section class="municipal-sources" aria-labelledby="documentos">
      <h3 id="documentos">Onde consultar</h3>
      <p>Estes portais ajudam a localizar registros. O link para uma base não confirma um indicador, contrato ou vínculo com OS.</p>
      <ul role="list">{local_section}{items}</ul>
    </section>"""


def render_city(city, config, template):
    rich = config.get("aps") == "marechal"
    records = config.get("indicadores", [])
    contracts = config.get("contratos", {})
    values = {
        "nome": text(city["nome"]),
        "resumo": "",
        "impressao": "",
        "temas": "",
        "visao_geral": overview(bool(records), bool(contracts)),
        "aps": indicators_panel(records),
        "contratos": render_contratos(city, contracts),
        "fontes": '<section class="screen" id="screen-fontes" aria-labelledby="fontes">'
                  '<h2 id="fontes">Fontes e limites</h2>' + common_sources(config, include_local=True) + '</section>',
        "extras": "",
        "fichas": "",
        "aplicacao": """<script type="module">
          import { initMunicipalNavigation } from '../../assets/municipio-nav.mjs';
          initMunicipalNavigation();
        </script>""",
    }
    if rich:
        sources = part("marechal/fontes.html")
        if sources.count(SOURCE_MARKER) != 1:
            raise ValueError("O painel de fontes de Marechal precisa de um ponto de inclusão para as referências comuns.")
        values.update(
            resumo=part("marechal/intro.html"),
            impressao='<button type="button" class="btn print-action" id="printReport">Imprimir relatório</button>',
            temas=EXTRA_NAV,
            visao_geral=part("marechal/overview.html"),
            aps=part("marechal/aps.html"),
            fontes=sources.replace(SOURCE_MARKER, common_sources(config, include_local=True)),
            extras=part("marechal/extras.html"),
            fichas=part("marechal/fichas.html"),
            aplicacao='<script type="module" src="../../assets/atlas.mjs?v=20261124"></script>',
        )
    return template.substitute(values)


def render_catalog(cities, studies, origin, template):
    rows = []
    for city in cities:
        configuration = studies.get(city["slug"], {})
        contracts = configuration.get("contratos", {})
        status = "Em construção"
        if configuration.get("aps") or configuration.get("indicadores"):
            status = "Indicadores publicados"
        elif contracts.get("registros"):
            status = "Registros contratuais publicados"
        elif contracts:
            status = "Estudo de contratos em preparação"
        rows.append(
            f'<li data-municipality="{text(normalize(city["nome"]))}">'
            f'<a href="{city["slug"]}/"><strong>{text(city["nome"])}</strong><span>{status}</span>'
            '<span class="municipal-index-arrow" aria-hidden="true">→</span></a></li>'
        )
    return template.substitute(total=len(cities), municipios="\n      ".join(rows), fonte=https(origin))


def build(destination):
    cities, studies, origin = load_catalog()
    place = Template(part("municipio.html"))
    listing = Template(part("municipios.html"))
    pages = {"index.html": render_catalog(cities, studies, origin, listing)}
    for city in cities:
        pages[f'{city["slug"]}/index.html'] = render_city(city, studies.get(city["slug"], {}), place)
    for name, content in pages.items():
        path = destination / "municipios" / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


if __name__ == "__main__":
    build(Path(sys.argv[1]))
