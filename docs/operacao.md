# Operação do Auditar Espírito Santo

## Prévia da vitrine

Vitrine pública, a partir da raiz do repositório:

```bash
bash scripts/build-pages.sh /tmp/auditores-vitrine
python3 -m http.server --bind 127.0.0.1 --directory /tmp/auditores-vitrine 8000
```

Use um diretório de saída vazio. O script gera o catálogo e as 78 rotas municipais, inclui a página inicial e copia os arquivos estáticos autorizados. O GitHub Pages recebe o mesmo pacote, criado pelo GitHub Actions a partir de `main` depois dos testes. A importação de observações fica na área de trabalho autenticada.

## Atualização das páginas municipais

O cadastro do IBGE em `site/municipios.json` define os 78 endereços. Cada carga pública fica em `site/acervo/<código IBGE>.json`. O campo numérico `ibge` precisa coincidir com o nome do arquivo. O build valida as referências e atualiza a página municipal, o catálogo e a matriz estadual na mesma publicação.

| Módulo | Campos do registro | Conferência |
| --- | --- | --- |
| `indicadores` | indicador, valor, unidade, recorte, competência, método e fonte | O período e a população de referência acompanham cada valor. O acervo 3203346 traz exemplos completos com identidade estável, categoria, tipo e qualidade. |
| `metas` | indicador, unidade, recorte, ano_base, base, competencia, meta, realizado e fonte | A fonte documenta o plano. Use `null` para execução sem apuração. Um resultado publicado exige `fonte_execucao` própria. |
| `contratos.registros` | entidade, instrumento, unidade, competencia, obrigacao, previsto, comprovado, situacao, fonte_instrumento e fonte | Registre a entidade signatária e a obrigação por competência. O instrumento e a evidência de execução têm referências próprias. O campo opcional `vinculo` descreve a natureza documentada da relação. |

As fontes têm `titulo` e `url` HTTPS. Use somente dados agregados e referências destinadas à publicação. A revisão de planilhas de trabalho acontece antes da carga. A publicação acompanha as alterações dos arquivos versionados em `main`.

Para iniciar a análise de outra OS, cadastre a unidade local em `contratos.unidade`, a referência de consulta em `contratos.fonte` e a pendência documental. A mesma matriz atende instrumentos e entidades diferentes no município. Para iniciar análise territorial, registre os indicadores da localidade e suas respectivas fontes. Sem carga local, a página oferece o roteiro e informa a pendência. O dossiê histórico de Marechal mantém seus gráficos e fichas a partir do mesmo arquivo municipal.

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

A área de trabalho oferece os eixos Auditoria de OS e Inteligência territorial nos 78 municípios. O recorte `pa-sao-pedro` identifica a unidade de Vitória. Para cadastrar novos recortes documentados, passe `--scopes /caminho/privado/recortes.private.json`. O arquivo mapeia cada município a objetos indexados pelo identificador estável de recorte e com campos `name` e `kind`. A auditoria aceita `Unidade` e `Contrato`. O eixo territorial aceita `Unidade` e `Território`. A concessão de acesso continua explícita no arquivo de contas. Reinicie o serviço ao alterar concessões ou credenciais.

Para acesso remoto, hospede a aplicação em ambiente privado com proxy HTTPS, limite de requisições e timeout. O processo deve permanecer em loopback e o diretório de dados deve ter acesso restrito e backups protegidos. Use perfis individuais de navegador, pois o navegador pode manter credenciais HTTP Basic durante a sessão. Rotacione senhas por conta. A vitrine pode ser publicada de forma independente.

## Formato de intercâmbio

Use uma lista JSON de até 1.000 observações e 256 KiB, com os campos `indicator`, `value` (número), `unit`, `period` (AAAA ou AAAA-MM), `source`, `reference` (URL HTTPS oficial pública) e `method`. Na importação, confira o município e o recorte selecionados. A exportação da área de trabalho mantém o formato de importação, inclui os identificadores no nome do arquivo e reflete a busca e os filtros mostrados. Uma repetição idêntica é contabilizada como duplicata. Um valor diferente para a mesma identificação documental rejeita o lote inteiro, preservando os dados já registrados. Confira a fonte antes de corrigir e reapresentar os dados. Use somente agregados revisados quanto ao risco de reidentificação, incluindo os campos de texto e as referências. A validação de esquema restringe os campos, e a revisão do conteúdo cabe a quem autoriza a importação.

## Testes

```bash
python3 -m unittest discover -s tests -v
npm ci --ignore-scripts
npm test
npx --no-install playwright-core install chromium
npm run test:browser
```

O teste de navegador usa uma prévia temporária do mesmo pacote que vai ao GitHub Pages. Para usar um Chrome instalado, defina `AUDITORES_CHROME` com o caminho do executável. O alvo de Node usado na integração contínua é 24.

## Publicação

Após integrar uma mudança na `main`, acompanhe o fluxo **Verificar e publicar AuditorES** no GitHub. A publicação acontece apenas após a suíte passar e o pacote público ser criado. Confirme que a revisão do fluxo corresponde ao commit publicado e que `auditor/workspace.html` retorna 404. Na configuração do GitHub Pages, a origem é **GitHub Actions**.
