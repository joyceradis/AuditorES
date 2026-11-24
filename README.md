# AuditorES

Governança de dados em saúde pública no Espírito Santo. O AuditorES reúne indicadores, fontes e acompanhamento documental de contratos assistenciais.

- [Catálogo dos 78 municípios](https://joyceradis.github.io/AuditorES/municipios/) com uma estrutura comum de consulta.
- [Dados e fontes de Marechal Floriano](https://joyceradis.github.io/AuditorES/municipios/marechal-floriano/) com busca, fichas de evidência e links para documentos originais.
- [Indicadores municipais](https://joyceradis.github.io/AuditorES/municipios/marechal-floriano/?scope=municipio#indicadores) e [indicadores da ESF Victor Hugo](https://joyceradis.github.io/AuditorES/municipios/marechal-floriano/?scope=victor-hugo#indicadores), com exportação conforme filtros selecionados.
- [Pessoa idosa, CMDI e AMDI](https://joyceradis.github.io/AuditorES/municipios/marechal-floriano/#pessoa-idosa), com o resultado municipal, a meta estadual e o que ainda requer evidência.
- [Área de trabalho autenticada](docs/operacao.md#área-de-trabalho) para operar localmente ou em infraestrutura própria.

## O que está publicado

Todas as páginas municipais têm visão geral, Atenção Primária (APS), contratos e organizações sociais (OS), e fontes e limites. Quando uma seção ainda aguarda dados revisados, a página informa que está em construção e oferece as referências disponíveis.

Marechal Floriano tem 37 fichas em recortes municipais, da ESF Victor Hugo e de contexto. Vitória tem [o roteiro de conferência do PA São Pedro](https://joyceradis.github.io/AuditorES/municipios/vitoria/#contratos), com a execução contratual pendente de documentação.

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
