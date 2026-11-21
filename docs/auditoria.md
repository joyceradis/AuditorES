# Auditoria técnica e design system

| Área | Achado na versão inicial | Tratamento nesta entrega |
| --- | --- | --- |
| Engenharia | A vitrine não carregava o painel legado. O JS e o CSS órfãos continuavam na raiz pública | Remoção dos arquivos órfãos do estado corrente e testes pela API HTTP real. O histórico Git foi preservado |
| Segurança | A versão inicial tinha apenas uma vitrine estática. O build de Pages usava a raiz do repositório | Servidor com autenticação por conta, scrypt, autorização por recorte em leitura, importação e exportação, lista explícita de rotas e respostas privadas sem cache. Pages recebe apenas a vitrine |
| Dados | A demonstração legada associava valores fictícios a contratos. Dados, acesso e apresentação não tinham fronteira operacional | Catálogo por município, escopo validado no servidor, SQLite com origem por observação e importação transacional |
| UI | A estrutura municipal era textual e o gráfico da vitrine era ilustrativo | A área de trabalho tem filtros operacionais, evidência consultável e série temporal com escala comum por fonte, método, unidade e granularidade |
| Acessibilidade | O menu móvel não identificava o elemento controlado, faltava salto para o conteúdo e alguns textos secundários tinham baixo contraste| Adicionados salto e vínculo do menu. A área de trabalho usa controles nativos rotulados, foco visível, estados textuais e tabela equivalente ao gráfico |

## Sistema visual

A vitrine apresenta o projeto. A área de trabalho prioriza o contexto e a evidência. O cabeçalho usa grafite `#101721`, o fundo usa papel `#F6F4EE` e os painéis usam marfim `#FFFEFA`. Âmbar `#E8A45F` marca a identidade. Azul `#155C9E` identifica foco. O texto principal usa `#152230` e o secundário `#4D6070`. A proposta tipográfica combina Manrope para títulos institucionais, DM Sans para interface e números tabulares para medidas, com fontes do sistema como fallback. Na área privada, as fontes remotas são dispensadas.

A composição usa módulos responsivos de filtros, leitura e evidência. A hierarquia começa pelo município e explicita o eixo antes de mostrar observações. A série apresenta competência e valor em texto. A tabela mantém unidade, período, referência e método juntos. Estados de carregamento, ausência de dados e falha são anunciados por região de status. A meta de acessibilidade é WCAG 2.2 AA. A entrega cobre inspeção de semântica e controles, com conformidade integral ainda a aferir.

## Riscos operacionais

- Configure HTTPS e limites de requisição no ambiente privado antes de acesso remoto. O servidor de referência usa HTTP Basic por conta e roda em loopback. Ele depende do proxy para políticas de tráfego e proteção contra tentativas repetidas.
- Controle o acesso ao arquivo de contas, banco e backups. Permissões por recorte são aplicadas às rotas de trabalho. Arquivos exportados passam ao controle da equipe responsável.
- A importação valida estrutura, instituição, período e referência HTTPS. A aprovação do conteúdo agregado, a distinção entre fonte publicadora e fonte primária e a revisão de reidentificação são atividades humanas.
- Em 21/11/2026 a busca no Drive consultou apenas metadados nas duas contas disponíveis para os termos AuditorES, Victor Hugo e Marechal Floriano, sem correspondências. Uma busca posterior por nome e formato identificou três arquivos Excel de monitoramento de Victor Hugo. Seus títulos, identificadores e endereços permanecem no Drive. A leitura em memória de xl/workbook.xml e do índice dos arquivos encontrou sete abas visíveis e cinco tabelas estruturadas em cada uma das duas primeiras versões e uma aba visível sem tabela estruturada na terceira. Nenhuma célula foi consultada.
