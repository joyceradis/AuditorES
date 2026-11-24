# Auditoria do AuditorES · 23/11/2026

Revisão da vitrine pública, do ATLAS de Marechal Floriano, dos arquivos de referência, da área de trabalho autenticada e da publicação. Os resultados descrevem o funcionamento do repositório e as evidências que ele apresenta.

| Área | Achado | Correção |
| --- | --- | --- |
| Entrada pública | Os atalhos abriam páginas de apresentação antes de levar a uma consulta. Serra e Colatina redirecionavam da própria rota para a página inicial. | Busca de indicadores na entrada. Páginas municipais próprias com o estágio da análise, o escopo e as referências para consulta. Os endereços e âncoras anteriores continuam acessíveis. |
| ATLAS | A página guardava dados, comportamento e conteúdo juntos. A leitura dependia da tabela e de buscas manuais dentro dos documentos de origem. | Base estruturada e funções de filtro testáveis. Fichas com URL própria, competência, medida, nota de leitura e referência. Links de PDF abrem na página do dado quando a paginação foi conferida. |
| Cobertura das fontes | Quatro observações dos arquivos de trabalho não apareciam no explorador público. | Inclusão dos quatro agregados conferidos: agentes de saúde da ESF, óbitos por residência e dois totais de créditos do RGPS. A vitrine reúne 37 fichas. |
| Governança da pessoa idosa | A resolução e a lei sustentavam atos de governança. A execução financeira ainda dependia de documentação. | O painel explicita os atos conferidos, os documentos de execução pendentes e o limite geográfico da AMDI. O resultado municipal e a meta estadual têm fichas próprias. |
| Área de trabalho | Busca indisponível, filtros sem endereço compartilhável e exportação consultada novamente. A importação classificava valores divergentes como duplicatas. | Busca e filtros persistem no endereço. A exportação reproduz a seleção exibida. A importação mostra destino e quantidade, aceita repetições idênticas e rejeita atomicamente lotes com divergência de valor. Os dados existentes permanecem consultáveis no mesmo formato. |
| Publicação | O modo legado publicava a raiz e dependia de exclusões. Os testes rodavam em um fluxo separado da publicação. | O fluxo de publicação depende da suíte, monta um pacote com lista explícita e exige destino vazio. A etapa de deploy recebe apenas esse pacote. O arquivo de exclusões foi mantido para compatibilidade com o modo legado. |

## Como conferir

- A suíte Python verifica acesso por conta e recorte, importação idempotente, rollback em conflito e composição do pacote público.
- A suíte Node verifica identidade das fichas, filtros, coerência entre agregados públicos e arquivos de trabalho e separação entre resultado e meta.
- O fluxo de navegador foi exercitado com a vitrine em desktop e celular e com a área autenticada em uma base sintética. Os testes de acessibilidade verificam regras automatizáveis e não abrangem uma avaliação manual completa com tecnologias assistivas.
- As fontes e as formas de reprodução estão em [Fontes e limitações](fontes.md).

## Pendências de dados e operação

- A produção, o denominador e o resultado de AMDI da ESF Victor Hugo precisam de uma extração da equipe. O resultado municipal, a referência censitária e a meta estadual já estão documentados.
- A quantidade de famílias no Bolsa Família em dezembro de 2025 continua pendente. Saldo, repasses, projetos e prestação de contas do FMI precisam de documentos próprios.
- Vitória, Serra e Colatina têm páginas de escopo e fontes de partida. A matriz contratual e a execução dos serviços requerem conferência de instrumentos, aditivos, obrigações e evidências por unidade.
- A área autenticada requer hospedagem própria, revisão humana dos agregados, controle de contas e proteção do banco. Os passos de operação ficam em [Operação](operacao.md).

A [auditoria anterior](https://github.com/joyceradis/AuditorES/blob/1bbcaa0757fd4c78b4785522b6b31435441678ad/docs/auditoria.md) registra a evolução do protótipo e as verificações anteriores do histórico.
