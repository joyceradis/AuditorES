# Auditoria técnica e design system

| Área | Achado na versão inicial | Tratamento nesta entrega |
| --- | --- | --- |
| Engenharia | A vitrine não carregava o painel legado. O JS e o CSS órfãos continuavam na raiz pública | Remoção dos arquivos órfãos do estado corrente e testes pela API HTTP real. O histórico Git foi preservado |
| Segurança | A versão inicial tinha apenas uma vitrine estática. O build de Pages usava a raiz do repositório | Servidor com autenticação por conta, scrypt, autorização por recorte em leitura, importação e exportação, lista explícita de rotas e respostas privadas sem cache. Pages recebe apenas a vitrine |
| Dados | A demonstração legada associava valores fictícios a contratos. Dados, acesso e apresentação não tinham fronteira operacional | Catálogo por município, escopo validado no servidor, SQLite com origem por observação e importação transacional |
| UI | A estrutura municipal era textual e o gráfico da vitrine era ilustrativo | A vitrine abre os eixos e recortes por município. A área de trabalho tem filtros, evidência consultável e séries com escala comum por fonte, método, unidade e granularidade |
| Acessibilidade | O menu móvel não identificava o elemento controlado, faltava salto para o conteúdo e alguns textos secundários tinham baixo contraste | A vitrine usa navegação visível, salto para o conteúdo e controles de expansão nativos. A área de trabalho usa controles nativos rotulados, foco visível, estados textuais e tabela equivalente ao gráfico |

## Sistema visual

A vitrine apresenta o projeto. A área de trabalho prioriza o contexto e a evidência. O cabeçalho usa grafite `#101721`, o fundo usa papel `#F6F4EE` e os painéis usam marfim `#FFFEFA`. Âmbar `#E8A45F` marca a identidade. Azul `#155C9E` identifica foco. O texto principal usa `#152230` e o secundário `#4D6070`. A interface usa DM Sans quando disponível no navegador, com fallback para fontes do sistema. As medidas da área de trabalho usam números tabulares.

A composição usa módulos responsivos de filtros, leitura e evidência. A hierarquia começa pelo município e explicita o eixo antes de mostrar observações. A série apresenta competência e valor em texto. A tabela mantém unidade, período, referência e método juntos. Estados de carregamento, ausência de dados e falha são anunciados por região de status. A meta de acessibilidade é WCAG 2.2 AA. A entrega cobre inspeção de semântica e controles, com conformidade integral ainda a aferir.

## Riscos operacionais

- Configure HTTPS e limites de requisição no ambiente privado antes de acesso remoto. O servidor de referência usa HTTP Basic por conta e roda em loopback. Ele depende do proxy para políticas de tráfego e proteção contra tentativas repetidas.
- Controle o acesso ao arquivo de contas, banco e backups. Permissões por recorte são aplicadas às rotas de trabalho. Arquivos exportados passam ao controle da equipe responsável.
- A importação valida estrutura, instituição, período e referência HTTPS. A aprovação do conteúdo agregado, a distinção entre fonte publicadora e fonte primária e a revisão de reidentificação são atividades humanas.
- Em 21/11/2026 a busca no Drive consultou apenas metadados nas duas contas disponíveis para os termos AuditorES, Victor Hugo e Marechal Floriano, sem correspondências. Uma busca posterior por nome e formato identificou três arquivos Excel de monitoramento de Victor Hugo. Seus títulos, identificadores e endereços permanecem no Drive. A leitura em memória de xl/workbook.xml e do índice dos arquivos encontrou sete abas visíveis e cinco tabelas estruturadas em cada uma das duas primeiras versões e uma aba visível sem tabela estruturada na terceira. Nenhuma célula foi consultada.

## Revisão da organização do repositório e da vitrine

| Ponto auditado | Evidência e encaminhamento |
| --- | --- |
| Entrada pública | O ATLAS ficava dentro do cartão municipal. Agora tem acesso pelo cabeçalho, pela abertura e pelo cartão de Marechal Floriano. |
| Rotas municipais | Os endereços antigos continuam válidos. O índice municipal e as rotas de Vitória, Serra e Colatina encaminham ao mesmo catálogo. O ATLAS mantém sua página de consulta. |
| Organização interna do ATLAS | As seções passaram a ter links que funcionam com acesso direto e histórico do navegador. Foram conferidos o recorte, o denominador e as páginas impressas dos indicadores nos planos municipais. |
| Entrada no GitHub | O README apresenta o projeto, as três entradas e o mapa do código. A operação e a publicação têm documentação própria. |
| Publicação | O GitHub Pages está configurado para publicar a raiz de `main` com Jekyll. O workflow manual alternativo foi removido. Os testes verificam as páginas públicas, os links locais e a correspondência entre a lista do pacote local e as exclusões do repositório. |
| Segurança e governança | A API aplica autenticação e autorização por município, recorte e papel. O Pages entrega apenas páginas públicas. A inspeção de nomes de arquivos no histórico não encontrou planilhas, bancos SQLite nem arquivos com nome de credencial. A configuração do GitHub indicava ausência de regras ativas em `main`. |
| Manutenção | O PR #2 continha versões anteriores do protótipo de auditoria e do ATLAS, em caminhos já substituídos na arquitetura atual. A branch histórica permite consultar essa evolução. |

A área de trabalho autenticada continua documentada para ambiente próprio. A validação do MDS permanece registrada como pendente em [Fontes oficiais](fontes.md). A conformidade integral de acessibilidade e um inventário de segredos em todo o conteúdo histórico não fizeram parte desta verificação.
