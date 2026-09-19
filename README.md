# AuditorES

**Auditoria técnico-documental e inteligência operacional para contratos assistenciais em saúde pública.**

> **English:** Audit and decision-support MVP built around structured evidence, traceability and operational healthcare workflows.

[**Abrir demonstração**](https://joyceradis.github.io/AuditorES/)

## O que este repositório demonstra

| Competência | Evidência no projeto |
| --- | --- |
| Modelagem de informação | contratos, competências, indicadores, evidências e níveis de risco representados como dados estruturados |
| Data-driven UI | atualização dinâmica de KPIs, tabelas e contexto operacional em JavaScript |
| Visualização | gráficos de tendência e distribuição de risco com Chart.js |
| Regras de negócio | transformação de dados em exposição, classificação e priorização para revisão humana |
| Product thinking | separação explícita entre evidência, alerta automatizado e conclusão técnico-administrativa |

**Portfolio signal:** data modeling · decision-support UI · JavaScript · Chart.js · audit workflows · human-in-the-loop design

O AuditorES é um MVP de produto voltado à transformação de dados contratuais, assistenciais e documentais em uma visão operacional mais auditável. O projeto explora como indicadores, evidências e critérios de risco podem ser organizados para apoiar análise técnica sem reduzir auditoria a um dashboard genérico.

## Problema

Contratos assistenciais terceirizados produzem grande volume de informação, mas a tomada de decisão pode permanecer fragmentada entre planilhas, documentos, competências, metas e justificativas.

O AuditorES foi concebido para aproximar três camadas que normalmente ficam separadas:

```text
DADO OPERACIONAL
      ↓
EVIDÊNCIA DOCUMENTAL
      ↓
CRITÉRIO DE AUDITORIA
      ↓
RISCO / NÃO CONFORMIDADE
      ↓
PRIORIZAÇÃO PARA ANÁLISE HUMANA
```

## O que o MVP demonstra

- visão executiva por contrato e competência;
- indicadores financeiros e assistenciais;
- sinalização de risco e não conformidade;
- comparação temporal;
- organização de evidências para rastreabilidade;
- interface orientada à leitura rápida por equipes técnicas e gestoras;
- estrutura preparada para evolução de uma vitrine estática para um fluxo auditável de dados.

## Princípios de produto

**Rastreabilidade antes de automação.** Um alerta precisa ser explicável por dados e critérios verificáveis.

**Separação entre evidência e conclusão.** O sistema organiza sinais e inconsistências; a conclusão técnico-administrativa permanece dependente de análise competente.

**Contexto importa.** Indicadores isolados não demonstram, por si, execução inadequada, glosa devida ou descumprimento contratual.

**Interface executiva sem apagar a fonte.** Síntese visual deve facilitar investigação, não substituir documentação primária.

## Escopo atual

A versão pública é uma **vitrine funcional / MVP**, construída para demonstrar arquitetura de informação, interação e modelo de análise. Os dados apresentados na demonstração não devem ser interpretados como auditoria oficial de contrato real.

## Stack

- HTML5;
- CSS3;
- JavaScript;
- Chart.js para visualização de indicadores;
- GitHub Pages para publicação da demonstração.

## Estrutura

```text
AuditorES/
├── index.html
├── styles.css
├── script.js
├── README.md
└── LICENSE
```

## Execução local

Não há etapa de build obrigatória. Clone o repositório e abra a aplicação por um servidor HTTP local:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Próximas camadas

A evolução natural do projeto inclui ingestão estruturada de dados, trilha de evidências, regras versionadas, gestão de achados, filtros por unidade/competência e mecanismos explícitos de revisão humana.

## Autoria

Projeto idealizado e desenvolvido por **Dra. Joyce Radis**, médica com atuação assistencial e em medicina pericial, como estudo aplicado de produto, auditoria em saúde e sistemas de apoio à decisão.

## Licença

Consulte o arquivo [LICENSE](LICENSE).
