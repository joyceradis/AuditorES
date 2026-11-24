import re
import subprocess
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

from scripts.build_municipios import indicators_panel, load_catalog
from scripts.contratos_publicos import render_contratos

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://example.org/AuditorES/"
PUBLIC_ASSETS = {
    "assets/public.css", "assets/home.css", "assets/home.mjs", "assets/atlas.css",
    "assets/atlas-data.mjs", "assets/atlas.mjs", "assets/atlas-query.mjs",
    "assets/atlas-series.mjs", "assets/inter-latin.woff2", "assets/inter-OFL.txt",
    "assets/municipios.css", "assets/municipio-nav.mjs", "assets/municipios-catalogo.mjs", "assets/contratos.css",
}
CITIES, _, _ = load_catalog()
CITY_PAGES = {f'municipios/{city["slug"]}/index.html' for city in CITIES}
PUBLIC_PAGES = CITY_PAGES | {"index.html", "municipios/index.html"}


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.targets = []
        self.ids = set()
        self.headings = 0
        self.municipal_nav = []
        self.has_redirect = False

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get("id"):
            if attrs["id"] in self.ids:
                raise AssertionError(f"ID repetido: {attrs['id']}")
            self.ids.add(attrs["id"])
        if tag == "a" and attrs.get("data-tab") and attrs.get("href"):
            self.municipal_nav.append(attrs["href"])
        if tag == "h1":
            self.headings += 1
        if tag in {"a", "link"} and attrs.get("href"):
            self.targets.append(attrs["href"])
        if tag == "script" and attrs.get("src"):
            self.targets.append(attrs["src"])
        if tag == "form" and attrs.get("action"):
            self.targets.append(attrs["action"])
        if tag == "meta" and attrs.get("http-equiv") == "refresh":
            self.has_redirect = True


class PublicationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        temp = tempfile.TemporaryDirectory()
        cls.addClassCleanup(temp.cleanup)
        cls.output = Path(temp.name) / "site"
        subprocess.run(["bash", "scripts/build-pages.sh", str(cls.output)], cwd=ROOT, check=True)
        cls.pages = {}
        for file in PUBLIC_PAGES:
            parser = Links()
            parser.feed((cls.output / file).read_text(encoding="utf-8"))
            cls.pages[file] = parser

    def test_only_reviewed_files_enter_publication(self):
        actual = {file.relative_to(self.output).as_posix() for file in self.output.rglob("*") if file.is_file()}
        self.assertEqual(actual, PUBLIC_PAGES | PUBLIC_ASSETS)

        # Mesmo se alguém substituir a origem do Pages, fontes de build e dados privados ficam fora.
        config = (ROOT / "_config.yml").read_text(encoding="utf-8")
        excluded = re.findall(r"^  - ([\w./-]+)$", config, flags=re.MULTILINE)
        files = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode().split("\0")
        visible = {
            file for file in files if file and not file.startswith((".", "_")) and not any(
                file == entry or (entry.endswith("/") and file.startswith(entry)) for entry in excluded
            )
        }
        self.assertEqual(visible, {"index.html"} | PUBLIC_ASSETS)

    def test_publication_refuses_a_nonempty_output(self):
        with tempfile.TemporaryDirectory() as temp:
            existing = Path(temp) / "existing.txt"
            existing.write_text("Arquivo de outro processo.", encoding="utf-8")
            result = subprocess.run(["bash", "scripts/build-pages.sh", temp], cwd=ROOT, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(list(Path(temp).iterdir()), [existing])

    def test_all_78_municipalities_have_the_shared_sections(self):
        self.assertEqual(len(CITY_PAGES), 78)
        catalog = self.pages["municipios/index.html"]
        for city in CITIES:
            slug = city["slug"]
            with self.subTest(city=slug):
                page = self.pages[f"municipios/{slug}/index.html"]
                self.assertIn(slug + "/", catalog.targets)
                self.assertEqual(
                    page.municipal_nav[:4],
                    ["#visao-geral", "#indicadores", "#contratos", "#fontes"],
                )
                self.assertTrue({"visao-geral", "indicadores", "aps", "contratos", "fontes", "documentos"} <= page.ids)

    def test_public_routes_open_their_own_pages(self):
        for file, page in self.pages.items():
            with self.subTest(page=file):
                self.assertFalse(page.has_redirect)
                self.assertEqual(page.headings, 1)

    def test_home_and_existing_deep_links(self):
        home = self.pages["index.html"]
        for scope in ("municipio", "victor-hugo"):
            self.assertIn(f"municipios/marechal-floriano/?scope={scope}#indicadores", home.targets)
        vitoria = self.pages["municipios/vitoria/index.html"]
        self.assertTrue({"pa", "plataforma", "impacto", "status", "documentos"} <= vitoria.ids)
        marechal = self.pages["municipios/marechal-floriano/index.html"]
        self.assertTrue({"pessoa-idosa", "direitos", "metodologia"} <= marechal.ids)

    def test_links_stay_within_the_public_package(self):
        for file, page in self.pages.items():
            page_url = urljoin(SITE, file)
            for href in page.targets:
                url = urlsplit(urljoin(page_url, href))
                if url.netloc != urlsplit(SITE).netloc:
                    continue
                with self.subTest(file=file, href=href):
                    self.assertTrue(url.path.startswith("/AuditorES/"))
                    path = url.path.removeprefix("/AuditorES/")
                    if not path or path.endswith("/"):
                        path += "index.html"
                    self.assertIn(path, PUBLIC_PAGES | PUBLIC_ASSETS)
                    if path in self.pages and url.fragment:
                        self.assertIn(url.fragment, self.pages[path].ids)

    def test_missing_and_documented_zero_have_different_renderings(self):
        source = {"titulo": "Documento de teste", "url": "https://example.org/documento"}
        indicator = {"indicador": "Indicador", "valor": 0, "unidade": "atendimentos", "recorte": "Equipe",
                     "competencia": "2025", "fonte": source, "metodo": "Contagem documentada."}
        self.assertNotIn("<table", indicators_panel([]))
        self.assertIn(">0 atendimentos<", indicators_panel([indicator]))
        with self.assertRaises(ValueError):
            indicators_panel([{**indicator, "valor": None}])
        contract = {"obrigacao": "Obrigações", "previsto": 0, "comprovado": 0,
                    "situacao": "Conferido", "fonte": source}
        city = {"nome": "Município de teste", "slug": "teste"}
        self.assertNotIn("<table", render_contratos(city))
        self.assertIn("<td>0</td>", render_contratos(city, {"registros": [contract]}))
        with self.assertRaises(ValueError):
            render_contratos(city, {"registros": [{**contract, "comprovado": None}]})
        with self.assertRaises(ValueError):
            render_contratos(city, {"registros": [{**contract, "fonte": {**source, "url": "/sem-origem"}}]})

    def test_only_marechal_loads_the_specific_historical_dataset(self):
        for city in CITIES:
            if city["slug"] == "marechal-floriano":
                continue
            targets = self.pages[f'municipios/{city["slug"]}/index.html'].targets
            self.assertFalse(any("assets/atlas.mjs" in href for href in targets))


if __name__ == "__main__":
    unittest.main()
