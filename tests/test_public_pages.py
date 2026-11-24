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

PUBLIC_ASSETS = {"assets/public.css", "assets/atlas.css"}


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.targets = []
        self.ids = set()

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag in {"a", "link"} and attrs.get("href"):
            self.targets.append(attrs["href"])
        if tag == "meta" and attrs.get("http-equiv") == "refresh":
            self.targets.append(attrs["content"].split("url=", 1)[1])


class PublicationTest(unittest.TestCase):
    def test_only_reviewed_files_enter_publication(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "site"
            subprocess.run(["bash", "scripts/build-pages.sh", str(output)], cwd=ROOT, check=True)
            actual = {file.relative_to(output).as_posix() for file in output.rglob("*") if file.is_file()}
            self.assertEqual(actual, PUBLIC_PAGES | PUBLIC_ASSETS)

        # GitHub Pages publica pela branch main. A prévia por lista explícita
        # precisa corresponder aos arquivos visíveis na publicação por Jekyll.
        config = (ROOT / "_config.yml").read_text(encoding="utf-8")
        excluded = re.findall(r"^  - ([\w./-]+)$", config, flags=re.MULTILINE)
        files = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode().split("\0")
        visible = {
            file for file in files if file and not file.startswith((".", "_")) and not any(
                file == entry or (entry.endswith("/") and file.startswith(entry)) for entry in excluded
            )
        }
        self.assertEqual(visible, PUBLIC_PAGES | PUBLIC_ASSETS)

    def test_no_automatic_redirect_loop_in_catalog(self):
        for page in ("municipios/index.html", "municipios/vitoria/index.html"):
            html = (ROOT / page).read_text(encoding="utf-8").lower()
            self.assertNotIn('http-equiv="refresh"', html)

    def test_scope_links_and_matching_exports(self):
        home = (ROOT / "index.html").read_text(encoding="utf-8")
        atlas = (ROOT / "municipios/marechal-floriano/index.html").read_text(encoding="utf-8")
        self.assertIn("?scope=municipio#indicadores", home)
        self.assertIn("?scope=victor-hugo#indicadores", home)
        self.assertIn("function selectedRows()", atlas)
        self.assertIn("data: selectedRows()", atlas)
        self.assertIn("const rows = selectedRows().map", atlas)
        self.assertIn("População estimada',19159", atlas)
        script = atlas.split("<script>", 1)[1].split("</script>", 1)[0]
        with tempfile.TemporaryDirectory() as temp:
            script_file = Path(temp) / "atlas.js"
            script_file.write_text(script, encoding="utf-8")
            subprocess.run(["node", "--check", str(script_file)], check=True)

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
