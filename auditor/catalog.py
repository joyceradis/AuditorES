"""Catálogo de recortes de trabalho e instituições de referência."""

import json
from pathlib import Path

AXES = {
    "auditoria-os": ("Auditoria de OS", ("Unidade", "Contrato")),
    "inteligencia-territorial": ("Inteligência territorial", ("Território", "Unidade")),
}

_cities = json.loads((Path(__file__).resolve().parents[1] / "site" / "municipios.json").read_text(encoding="utf-8"))
SCOPES = {city["slug"]: (city["nome"], "inteligencia-territorial", {}) for city in _cities["municipios"]}
SCOPES["vitoria"] = ("Vitória", "auditoria-os", {"pa-sao-pedro": ("PA São Pedro", "Unidade")})
SCOPES["marechal-floriano"][2].update({
    "municipio": ("Município", "Território"), "victor-hugo": ("ESF Victor Hugo", "Unidade")
})
for city in ("serra", "colatina"):
    name, _, scopes = SCOPES[city]
    SCOPES[city] = name, "auditoria-os", scopes

SOURCES = {
    "IBGE": "IBGE",
    "INCAPER": "Incaper",
    "SEMUS": "Secretaria Municipal de Saúde",
    "MDS": "Ministério do Desenvolvimento e Assistência Social",
    "CNES": "Cadastro Nacional de Estabelecimentos de Saúde",
    "DATASUS": "DATASUS",
    "INSS": "Instituto Nacional do Seguro Social",
}
