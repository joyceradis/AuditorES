# AuditorES

**Auditoria técnico-documental e inteligência operacional para contratos assistenciais em saúde pública.**

> **English:** Audit and decision-support MVP built around structured evidence, traceability and operational healthcare workflows.

[**Abrir demonstração**](https://joyceradis.github.io/AuditorES/)

## Arquitetura

A vitrine pública apresenta o escopo do projeto. A área de trabalho usa Município → Eixo de análise → Unidade, Contrato ou Território. Vitória, Serra e Colatina pertencem ao eixo de auditoria de OS. Marechal Floriano pertence ao eixo de inteligência territorial, com recortes municipal e ESF Victor Hugo. O catálogo inicial de Serra e Colatina aguarda documentação.

A área de trabalho mantém observações agregadas por recorte, indicador, unidade de medida, competência, instituição, referência e método. A interface oferece filtro por ano e fonte, série com granularidade mensal ou anual, tabela de evidências e exportação JSON do filtro. O SQLite registra autor e horário da importação. Cada importação é atômica e reapresentar as mesmas chaves mantém o registro original.

- [Auditoria técnica e design system](docs/auditoria.md)
- [Validação de fontes oficiais](docs/fontes.md)

## Execução local

Vitrine pública, a partir da raiz do repositório:

```bash
python3 -m http.server --bind 127.0.0.1 --directory /tmp/auditores-vitrine 8000
```

Antes de iniciar, crie `/tmp/auditores-vitrine` e copie somente `index.html` para esse diretório. O workflow do GitHub Pages empacota esse mesmo arquivo.

Área de trabalho, com Python 3.10+ e SQLite 3.24+:

1. Execute `python3 -m auditor.server --hash-password` para cada usuário. Guarde a configuração em um diretório privado fora da raiz publicada e do Git.
2. Crie `accounts.private.json` com uma entrada por usuário. Use os valores gerados em `salt` e `digest` e informe os recortes concedidos. O papel `read` permite consulta e exportação. O papel `write` também permite importação.
3. Execute `python3 -m auditor.server --accounts /caminho/privado/accounts.private.json --db /caminho/privado/auditores.sqlite3` e abra `http://127.0.0.1:8080`.

```json
{
  "analista": {
    "salt": "<salt gerado>",
    "digest": "<digest gerado>",
    "grants": {"marechal-floriano": {"municipio": "write", "victor-hugo": "read"}}
  }
}
```

Vitória usa inicialmente o recorte `pa-sao-pedro`. Para cadastrar novos recortes documentados, passe `--scopes /caminho/privado/recortes.private.json`. O arquivo mapeia cada município a objetos indexados pelo identificador estável de recorte e com campos `name` e `kind`. Na auditoria, `kind` aceita `Unidade` ou `Contrato`. Em Marechal Floriano, aceita `Unidade` ou `Território`. A concessão de acesso continua explícita no arquivo de contas. Reinicie o serviço ao alterar concessões ou credenciais.

Para acesso remoto, hospede a aplicação em ambiente privado com proxy HTTPS, limite de requisições e timeout. O processo deve permanecer em loopback e o diretório de dados deve ter acesso restrito e backups protegidos. Use perfis individuais de navegador, pois o navegador pode manter credenciais HTTP Basic durante a sessão. Rotacione senhas por conta. A vitrine pode ser publicada de forma independente.

## Formato de intercâmbio

Use uma lista JSON de até 1.000 observações e 256 KiB, com os campos `indicator`, `value` (número), `unit`, `period` (AAAA ou AAAA-MM), `source`, `reference` (URL HTTPS oficial pública) e `method`. Na importação, confira o município e o recorte selecionados. A exportação mantém o mesmo formato e inclui os identificadores no nome do arquivo. Use somente agregados revisados quanto ao risco de reidentificação, incluindo os campos de texto e as referências. A validação de esquema restringe os campos, e a revisão do conteúdo cabe a quem autoriza a importação.

## Testes

```bash
python3 -m unittest discover -s tests -v
node --check auditor/workspace.js
```

## Autoria

Projeto idealizado e desenvolvido por **Dra. Joyce Radis**, médica com atuação assistencial e em medicina pericial, como estudo aplicado de produto, auditoria em saúde e sistemas de apoio à decisão.

## Licença

Consulte o arquivo [LICENSE](LICENSE).
