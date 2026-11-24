# Validação de fontes oficiais

Consulta em 21/11/2026. As medidas abaixo são agregados públicos. Os resultados municipais pertencem ao recorte municipal de Marechal Floriano. Os registros de Victor Hugo trazem a escala de equipe ou unidade conforme a fonte.

| Fonte | Indicador ou registro | Período | Escopo e reprodução | Referência |
| --- | --- | --- | --- | --- |
| IBGE | **17.641 pessoas residentes** | 2022 | Censo Demográfico, SIDRA tabela 4714, variável 93, nível municipal N6, código 3203346. Leitura direta da observação em pessoas | [Consulta SIDRA](https://apisidra.ibge.gov.br/values/t/4714/n6/3203346/v/93/p/2022) |
| IBGE | **19.159 pessoas (estimativa populacional)** | 2026 | Estimativa municipal publicada pelo IBGE em Cidades e Estados. Série distinta do Censo de 2022; não utilizar como se fosse observação censitária | [IBGE Marechal Floriano](https://www.ibge.gov.br/cidades-e-estados/es/marechal-floriano.html) |
| Incaper | **626 estabelecimentos de agricultura familiar**, de um total de **916 estabelecimentos** | 2017 | PROATER Marechal Floriano, tabela 5. Leitura dos totais familiar (626) e não familiar (290), cuja soma é 916. O PROATER reproduz o Censo Agropecuário do IBGE. A unidade de análise é estabelecimento agropecuário | [PROATER](https://incaper.es.gov.br/Media/proater/municipios/Marechal_Floriano.pdf) |
| SEMUS | **4 agentes comunitários de saúde** na equipe ESF Victor Hugo | 2021 | Plano Municipal de Saúde 2022–2025, tabela 23, linha ESF Victor Hugo, coluna de agentes comunitários de saúde. A competência vem da tabela, e a medida descreve a composição histórica da equipe | [Plano Municipal de Saúde](https://www.marechalfloriano.es.gov.br/downloads/arquivos-saude/instrumentos-gestao/PMS-2022-2025-resumo-DIGISUS.pdf) |
| CNES | **2675145**, identificador da UBS Governador Mun Henrique Krohling, em Victor Hugo | Consulta em 2026 | Conferência da ficha pelo código de estabelecimento e pelo município 320334. Trata-se de um identificador cadastral, com competência histórica e quantitativos de equipes a apurar nas respectivas bases | [Ficha CNES](https://cnes2.datasus.gov.br/Mod_Conjunto.asp?VCo_Unidade=3203342675145) |
| DATASUS | **142 óbitos por residência** | 2022 | SIM, Mortalidade Geral 2022. Filtrar CODMUNRES 320334, TIPOBITO 2 (óbito não fetal) e ano 2022 em DTOBITO. Todas as causas, total bruto | [CSV do SIM no Portal de Dados Abertos do SUS](https://dadosabertos.saude.gov.br/dataset/sim/resource/9ade641a-1f25-40d9-b55b-cff7096eb5b4) |
| INSS / Ministério da Previdência Social | **3.810 benefícios do RGPS emitidos**, dos quais **2.145 rurais** | Dezembro de 2025 | Planilha por clientela, aba Emitidos_2025, código 3203346, colunas G (total) e I (rural). A fonte usa município do órgão pagador e conta créditos para pagamento. A nota da planilha registra consulta ao INSS em 22/05/2026 | [Planilha oficial por clientela](https://www.gov.br/previdencia/pt-br/assuntos/previdencia-social/arquivos/ben_municipios_clientela_2025.xlsx) |
| MDS | Famílias beneficiárias do Bolsa Família, em verificação | Dezembro de 2025 | Consulta à MI Social por competência 202512, município 320334 e campo qtd_familias_beneficiarias_bolsa_familia_i redirecionou para a página de avisos do MDS sem retornar a observação. O valor permanece pendente | [API MI Social](https://aplicacoes.mds.gov.br/sagi/servicos/misocial) · [Ferramentas da SAGICAD](https://www.gov.br/mds/pt-br/orgaos/SAGICAD/dados-e-ferramentas-informacionais/dados-e-ferramentas-do-cadastro-unico/) |

Os recortes de residência, órgão pagador, estabelecimento e equipe têm abrangências distintas. A população do Censo de 2022 e os benefícios emitidos em dezembro de 2025 aparecem como observações independentes. Nenhuma medida foi atribuída a contratos de Serra ou Colatina.

## Arquivos de importação

Use os [agregados municipais](dados-publicos/marechal-floriano-municipio.json) no recorte Município e os [agregados da equipe](dados-publicos/marechal-floriano-victor-hugo.json) no recorte ESF Victor Hugo. O código CNES é mantido na documentação como referência cadastral. A área de trabalho inicia com banco vazio e recebe estes conjuntos por importação autorizada.

## Trilha dos indicadores do ATLAS

A tabela do painel registra o recorte, a competência e a referência de cada observação. Estas conferências usam a numeração impressa dos planos municipais.

| Fonte | Escopo e competência | Conferência |
| --- | --- | --- |
| SEMUS, PMS 2026–2029, tabela 14, p. 38 | ESF Victor Hugo, 30/04/2025 | Leitura direta dos **1.780 cadastros individuais** na linha da equipe. |
| SEMUS, PMS 2022–2025, tabela 45, p. 55 | ESF Victor Hugo, agosto de 2021 | A coluna Victor Hugo tem **480 famílias classificadas** pelo método Coelho-Savassi. Os estratos médio (20) e máximo (16) totalizam 36, ou **7,5% das famílias classificadas**. |
| SEMUS, PMS 2026–2029, tabelas 38–39, p. 67–68 | Marechal Floriano, 2024 | Contagens do cadastro individual do e-SUS APS. As condições autodeclaradas são registradas com o nome usado na fonte. |
| SEMUS, PMS 2026–2029, tabela 41, p. 69 | Rede municipal de ESF, 2024 | **626 avaliações de hemoglobina glicada para 1.606 solicitações**, aproximadamente 38,98%. |
| SEMUS, PMS 2026–2029, tabela 50, p. 76–77 | Atenção especializada municipal, 2024 | Leitura da coluna 2024 para cardiologia (18,63%), cirurgia geral (23,26%) e cirurgia vascular (29,03%). |
| SEMUS, PMS 2026–2029, tabela 56, p. 84–85 | Marechal Floriano, 2020 a 2024 | Leitura da linha de acidentes de trabalho no e-SUS VS, com **3, 6, 19, 240 e 313 notificações**, nessa ordem. LER/DORT e intoxicações usam suas linhas próprias. |

[Plano Municipal de Saúde 2026–2029](https://www.marechalfloriano.es.gov.br/wp-content/uploads/2026/05/PMS-2026-2029-versao-final.pdf) · [Plano Municipal de Saúde 2022–2025](https://www.marechalfloriano.es.gov.br/downloads/arquivos-saude/instrumentos-gestao/PMS-2022-2025-resumo-DIGISUS.pdf)

## Recortes navegáveis e exportação

O ATLAS tem links diretos para [indicadores municipais](https://joyceradis.github.io/AuditorES/municipios/marechal-floriano/?scope=municipio#indicadores) e [indicadores da ESF Victor Hugo](https://joyceradis.github.io/AuditorES/municipios/marechal-floriano/?scope=victor-hugo#indicadores). O filtro inicial aplica-se à tabela e aos arquivos CSV/JSON exportados; a visão geral oferece contextualização com escopos explicitamente identificados. A estimativa IBGE de 2026 e a população censitária de 2022 são indicadores diferentes.

## Pessoa idosa, CMDI e Fundo Municipal do Idoso

Conferência em 23/11/2026. A tabela de AMDI do [Boletim Estadual da APS 2025, p. 22](https://atencaoprimaria.es.gov.br/Media/AtencaoPrimaria/LinhasDeCuidados/BOLETIM%20APS%202025%20-%20validado%20%2017%20de%20abril%202026.pdf#page=22) registra **37** avaliações para Marechal Floriano, com referência de **2.879** residentes com 60 anos ou mais (Censo 2022). O resultado de **1,29%** é municipal. A **meta de 20%** é estadual. A produção do SISAB foi extraída em 11/02/2026. A tabela agrega registros e não identifica pessoas distintas nem discrimina a produção da equipe de Victor Hugo.

| Ato | Referência | Evidência |
| --- | --- | --- |
| Lei nº 2.937/2026 | [SAPL da Câmara Municipal](https://sapl.marechalfloriano.es.leg.br/norma/2982) | Disciplina o CMDI e institui o Fundo Municipal do Idoso. |
| Decreto Normativo nº 446/2026 | [DOM/ES, edição 3.124, p. 148](https://ioes.dio.es.gov.br/portal/edicoes/download/11618#page=148) | Regulamenta o Fundo e sua gestão. |
| Resolução CMDI nº 031/2026 | [DOM/ES, edição 3.132, p. 200](https://ioes.dio.es.gov.br/portal/edicoes/download/11656#page=200) | Aprova o calendário ordinário de reuniões para 2027. |

A execução financeira requer documentos próprios, como plano de aplicação, saldo, repasses, aprovações de projetos e prestação de contas.
