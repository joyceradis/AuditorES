"""Catálogo de recortes de trabalho e instituições de referência."""

AXES = {
    "auditoria-os": ("Auditoria de OS", ("Unidade", "Contrato")),
    "inteligencia-territorial": ("Inteligência territorial", ("Território", "Unidade")),
}

SCOPES = {
    "vitoria": ("Vitória", "auditoria-os", {"pa-sao-pedro": ("PA São Pedro", "Unidade")}),
    "serra": ("Serra", "auditoria-os", {}),
    "colatina": ("Colatina", "auditoria-os", {}),
    "marechal-floriano": (
        "Marechal Floriano", "inteligencia-territorial",
        {"municipio": ("Município", "Território"), "victor-hugo": ("ESF Victor Hugo", "Unidade")}
    ),
}

SOURCES = {
    "IBGE": "IBGE",
    "INCAPER": "Incaper",
    "SEMUS": "Secretaria Municipal de Saúde",
    "MDS": "Ministério do Desenvolvimento e Assistência Social",
    "CNES": "Cadastro Nacional de Estabelecimentos de Saúde",
    "DATASUS": "DATASUS",
    "INSS": "Instituto Nacional do Seguro Social",
}
