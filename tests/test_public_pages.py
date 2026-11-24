import re
import subprocess
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://example.org/AuditorES/"
PUBLIC_PAGES = {
    "index.html",
    "municipios/index.html",
    "municipios/vitoria/index.html",
    "municipios/serra/index.html",
    "municipios/colatina/index.html",
    "municipios/marechal-floriano/index.html",
}

PUBLIC_ASSETS = {
    "assets/public.css", "assets/home.css", "assets/home.mjs", "assets/atlas.css", "assets/atlas-data.mjs", "assets/atlas.mjs",
    "assets/atlas-query.mjs", "assets/atlas-series.mjs",
}


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.targets = []
        self.ids = set()

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get("id"):
            if attrs["id"] in self.ids:
                raise AssertionError(f"ID repetido: {attrs['id']}")
            self.ids.add(attrs["id"])
        if tag in {"a", "link"} and attrs.get("href"):
            self.targets.append(attrs["href"])
        if tag == "script" and attrs.get("src"):
            self.targets.append(attrs["src"])
        if tag == "form" and attrs.get("action"):
            self.targets.append(attrs["action"])
        if tag == "meta" and attrs.get("http-equiv") == "refresh":
            self.targets.append(attrs["content"].split("url=", 1)[1])


class PublicationTest(unittest.TestCase):
    def test_only_reviewed_files_enter_publication(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "site"
            subprocess.run(["bash", "scripts/build-pages.sh", str(output)], cwd=ROOT, check=True)
            actual = {file.relative_to(output).as_posix() for file in output.rglob("*") if file.is_file()}
            self.assertEqual(actual, PUBLIC_PAGES | PUBLIC_ASSETS)

        # A configuração Jekyll fica como proteção se a publicação voltar ao modo legado.
        config = (ROOT / "_config.yml").read_text(encoding="utf-8")
        excluded = re.findall(r"^  - ([\w./-]+)$", config, flags=re.MULTILINE)
        files = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode().split("\0")
        visible = {
            file for file in files if file and not file.startswith((".", "_")) and not any(
                file == entry or (entry.endswith("/") and file.startswith(entry)) for entry in excluded
            )
        }
        self.assertEqual(visible, PUBLIC_PAGES | PUBLIC_ASSETS)

    def test_publication_refuses_a_nonempty_output(self):
        with tempfile.TemporaryDirectory() as temp:
            (Path(temp) / "existing.txt").write_text("Arquivo de outro processo.", encoding="utf-8")
            result = subprocess.run(["bash", "scripts/build-pages.sh", temp], cwd=ROOT, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual([file.name for file in Path(temp).iterdir()], ["existing.txt"])

    def test_public_routes_open_their_own_pages(self):
        for page in PUBLIC_PAGES:
            html = (ROOT / page).read_text(encoding="utf-8").lower()
            with self.subTest(page=page):
                self.assertNotIn('http-equiv="refresh"', html)
                self.assertEqual(html.count("<h1"), 1)

    def test_home_links_to_separate_territorial_scopes(self):
        home = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("?scope=municipio#indicadores", home)
        self.assertIn("?scope=victor-hugo#indicadores", home)

    def test_links_stay_within_the_public_package(self):
        pages = {}
        for file in PUBLIC_PAGES:
            parser = Links()
            parser.feed((ROOT / file).read_text(encoding="utf-8"))
            pages[file] = parser

        for file, parser in pages.items():
            page_url = urljoin(SITE, file)
            for href in parser.targets:
                url = urlsplit(urljoin(page_url, href))
                if url.netloc != urlsplit(SITE).netloc:
                    continue
                with self.subTest(file=file, href=href):
                    self.assertTrue(url.path.startswith("/AuditorES/"))
                    path = url.path.removeprefix("/AuditorES/")
                    if not path or path.endswith("/"):
                        path += "index.html"
                    self.assertIn(path, PUBLIC_PAGES | PUBLIC_ASSETS)
                    if path in pages and url.fragment:
                        self.assertIn(url.fragment, pages[path].ids)


if __name__ == "__main__":
    unittest.main()
