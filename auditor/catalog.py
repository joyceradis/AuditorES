"""Catálogo de recortes de trabalho e instituições de referência."""

SCOPES = {
    "vitoria": ("Vitória", "Auditoria de OS", {"pa-sao-pedro": "PA São Pedro · Unidade"}),
    "serra": ("Serra", "Auditoria de OS", {}),
    "colatina": ("Colatina", "Auditoria de OS", {}),
    "marechal-floriano": (
        "Marechal Floriano", "Inteligência territorial",
        {"municipio": "Município · Território", "victor-hugo": "ESF Victor Hugo · Unidade"}
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
