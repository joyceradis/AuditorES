# Auditar Espírito Santo

[Dashboard estadual](https://joyceradis.github.io/AuditorES/) para secretarias de saúde, fiscalização contratual e controle interno. A matriz apresenta os 78 municípios em ordem alfabética, com busca por nome ou código IBGE e filtros por disponibilidade documental.

Cada município dispõe de indicadores, metas da PAS, roteiro de conferência de contratos e OS e referências públicas. A área de trabalho autenticada oferece análise territorial e contratual com permissões por município e recorte.

## Atualizar o painel

O acervo em `site/acervo/<IBGE>.json` alimenta o dashboard, o catálogo e a página municipal. Os campos e o fluxo de publicação estão no [manual de operação](docs/operacao.md). Os números pertencem ao município, ao recorte e ao período documentados em cada ficha.

## Código e documentação

| Caminho | Conteúdo |
| --- | --- |
| [index.html](index.html) e [site/](site/) | Página inicial, modelo municipal, cadastro do IBGE e dados de publicação por município |
| [auditor/](auditor/) | Servidor Python, SQLite e interface da área autenticada |
| [docs/fontes.md](docs/fontes.md) | Fontes oficiais, recortes, competências e pendências |
| [docs/operacao.md](docs/operacao.md) | Prévia local, configuração de contas, testes e publicação |
| [docs/auditoria.md](docs/auditoria.md) e [SECURITY.md](SECURITY.md) | Auditoria técnica, design e segurança |

## Autoria

Projeto idealizado e desenvolvido por **Dra. Joyce Radis**, médica com atuação assistencial e em medicina pericial, como estudo aplicado de produto, auditoria em saúde e sistemas de apoio à decisão.

## Licença

Consulte o arquivo [LICENSE](LICENSE).
