# Operação do AuditorES

## Prévia da vitrine

Vitrine pública, a partir da raiz do repositório:

```bash
bash scripts/build-pages.sh /tmp/auditores-vitrine
python3 -m http.server --bind 127.0.0.1 --directory /tmp/auditores-vitrine 8000
```

Use um diretório de saída novo. O script empacota as páginas públicas, incluindo o ATLAS de consulta. O GitHub Pages publica a partir de `main` e usa as exclusões em `_config.yml`. O script gera a prévia local com a lista explícita de arquivos públicos. A importação de observações fica na área de trabalho autenticada.

## Área de trabalho

Requer Python 3.10+ e SQLite 3.24+.

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

## Publicação

Após integrar um PR na `main`, acompanhe o workflow **pages-build-deployment** no GitHub. Confirme o commit publicado, a página inicial e a rota do ATLAS. Confira que `auditor/workspace.html` retorna 404 no Pages. A configuração em uso é `main` na raiz, com exclusão de servidor, dados de trabalho, scripts, testes e documentação.
