import { data, normalize, gov26, gov22, incaper, amdiBulletin, rgps, mortality, scopeLabels, typeLabels, filterRows } from './atlas-data.mjs';
import { categoryValues, filtersFromSearch, rowsAsCSV, scopeValues, typeValues, urlForFilters, yearValues } from './atlas-query.mjs';
import { evidenceHash } from './atlas-series.mjs';
import { initMunicipalNavigation } from './municipio-nav.mjs';

const baseProfile={city:'Marechal Floriano',esf:'Victor Hugo',uf:'ES',date:'2026-11-23'};
const profile = baseProfile;
const fmt=(n,dec=0)=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:dec,maximumFractionDigits:dec});
const get=(label,yr)=>data.find(x=>x.label===label&&(yr==null||x.year===yr));
const value=(label,yr)=>get(label,yr)?.value??null;
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function vshow(n,unit='n'){return n==null?'—':unit==='%'?fmt(n,2)+'%':unit==='R$'?'R$ '+fmt(n,2):fmt(n)}
const filterForm = document.getElementById('indicatorFilters');
const filters = {
  q: document.getElementById('searchFilter'),
  scope: document.getElementById('scopeFilter'),
  category: document.getElementById('catFilter'),
  year: document.getElementById('yearFilter'),
  type: document.getElementById('typeFilter')
};
const shortcutLinks = [...document.querySelectorAll('[data-scope]')];
const csvButton = document.getElementById('exportCSV');
const jsonButton = document.getElementById('exportJSON');
const dialog = document.getElementById('evidenceDialog');
const pageSize = 12;
let currentPage = 0;
let filterSearch = location.search;
let rowForDialog;
let returnFocus;
let returnHash;
const previousPage = document.getElementById('previousPage');
const nextPage = document.getElementById('nextPage');
function appendOptions(control, values, labels = {}) {
  for (const value of values) control.add(new Option(labels[value] || value, value));
}

appendOptions(filters.scope, Object.values(scopeValues), scopeLabels);
appendOptions(filters.category, Object.values(categoryValues));
appendOptions(filters.year, yearValues);
appendOptions(filters.type, Object.values(typeValues), typeLabels);

function readFilters() {
  const state = filtersFromSearch(location.search);
  filters.q.value = state.query;
  filters.scope.value = state.scope;
  filters.category.value = state.category;
  filters.type.value = state.type;
  filters.year.value = state.year;
}

function currentFilters() {
  return {
    category: filters.category.value,
    scope: filters.scope.value,
    year: filters.year.value,
    type: filters.type.value,
    query: filters.q.value.trim()
  };
}

function selectedRows() {
  return filterRows(currentFilters());
}

function updateFilters() {
  const url = urlForFilters(location.href, currentFilters());
  history.replaceState(history.state, '', url);
  filterSearch = url.search;
  currentPage = 0;
  renderTable();
}

filterForm.addEventListener('submit', event => event.preventDefault());
filters.q.addEventListener('input', updateFilters);
for (const [key, control] of Object.entries(filters)) {
  if (key !== 'q') control.addEventListener('change', updateFilters);
}
for (const button of document.querySelectorAll('[data-clear]')) {
  button.addEventListener('click', () => {
    filterForm.reset();
    updateFilters();
    filters.q.focus();
  });
}
readFilters();

function render() {
  document.getElementById('totalRecords').textContent = data.length;
  for (const element of document.querySelectorAll('[data-count-scope]')) {
    element.textContent = data.filter(row => row.scope === element.dataset.countScope).length;
  }
  document.getElementById('otherRecords').textContent = data.filter(row => ['Comunidade', 'Espírito Santo'].includes(row.scope)).length;
  renderOverview();
  renderTable();
  renderRights();
  renderSources();
}
function renderOverview() {
  const rate = (count, total) => total ? fmt(count / total * 100, 1) + '%' : '—';
  const families = value('Famílias classificadas');
  const atRisk = value('Famílias em risco médio') + value('Famílias em risco máximo');
  const familyFarms = value('Estabelecimentos de agricultura familiar');
  const allFarms = familyFarms + value('Estabelecimentos de agricultura não familiar');
  const cards = [
    ['Pessoas cadastradas', fmt(value('Pessoas cadastradas na ESF')), 'ESF · 30/04/2025', 'local', '#evidencia-pessoas-cadastradas-na-esf-30-04-2025'],
    ['Famílias em risco médio ou máximo', fmt(atRisk), `${rate(atRisk, families)} das famílias classificadas · ESF 2021`, 'local', '?scope=victor-hugo&category=risco-familiar#indicadores'],
    ['Estabelecimentos rurais familiares', rate(familyFarms, allFarms), 'Município · Censo 2017', '', '#evidencia-estabelecimentos-de-agricultura-familiar-2017'],
    ['População residente', fmt(value('População residente', '2022')), 'Município · Censo 2022', '', '#evidencia-populacao-residente-2022']
  ];
  document.getElementById('kpis').innerHTML = cards.map(([label, amount, context, group, url]) =>
    `<a class="kpi ${group}" href="${url.replaceAll('&', '&amp;')}"><span class="label">${esc(label)}</span>
      <span class="value">${amount}</span><span class="meta">${esc(context)}</span></a>`
  ).join('');

  const series = data.filter(row => row.label === 'Acidentes de trabalho notificados' && row.scope === 'Município')
    .sort((a, b) => Number(a.year) - Number(b.year));
  const largest = Math.max(1, ...series.map(row => row.value));
  document.getElementById('accChart').innerHTML = series.map(row =>
    `<a class="barcol" href="${evidenceHash(row.id)}" aria-label="${fmt(row.value)} ${esc(row.year)} · notificações de acidentes de trabalho">
      <span class="val">${fmt(row.value)}</span>
      <span class="bar" style="height:${row.value / largest * 153}px"></span>
      <span class="x">${esc(row.year)}</span></a>`
  ).join('') || '<p class="empty">Série municipal indisponível nesta base.</p>';

  const riskLevels = [
    ['Habitual', 'Famílias em risco habitual', '#1a5383'], ['Menor', 'Famílias em risco menor', '#417ca8'],
    ['Médio', 'Famílias em risco médio', '#9a5379'], ['Máximo', 'Famílias em risco máximo', '#77294e']
  ];
  document.getElementById('riskBars').innerHTML = riskLevels.map(([label, indicator, color]) => {
    const count = value(indicator);
    const width = families ? count / families * 100 : 0;
    return `<div class="riskItem"><div class="riskRow"><span>${label}</span><b>${fmt(count)} (${rate(count, families)})</b></div>
      <div class="track"><div class="fill" style="width:${width}%;background:${color}"></div></div></div>`;
  }).join('');
  document.getElementById('riskText').textContent =
    `${fmt(atRisk)} famílias em risco médio ou máximo, classificadas em agosto de 2021. A escala descreve risco familiar.`;
  document.getElementById('farmText').textContent =
    `${fmt(familyFarms)} dos ${fmt(allFarms)} estabelecimentos agropecuários são de agricultura familiar (${rate(familyFarms, allFarms)}). A unidade de análise é o estabelecimento rural.`;

  const secondary = [
    ['Pessoas com diabetes', 'Diabetes autodeclarado', 'Cadastro municipal · 2024'],
    ['Insuficiência cardíaca', 'Insuficiência cardíaca autodeclarada', 'Autodeclaração municipal · 2024'],
    ['Absenteísmo vascular', 'Absenteísmo — consulta cirurgia vascular', 'Consultas especializadas · 2024']
  ];
  document.getElementById('secondaryStats').innerHTML = secondary.map(([label, indicator, context]) => {
    const row = get(indicator);
    return `<article class="statrow"><strong>${vshow(row?.value, row?.unit)}</strong>
      <span class="stat-label">${esc(label)}</span><div class="micro">${esc(context)}</div></article>`;
  }).join('');
}
function updatePage(count) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  currentPage = Math.min(currentPage, pages - 1);
  for (const [index, row] of [...document.getElementById('dataTable').rows].entries()) {
    row.toggleAttribute('data-page-hidden', Math.floor(index / pageSize) !== currentPage);
  }
  document.getElementById('resultsPager').hidden = pages === 1;
  document.getElementById('pagePosition').textContent = `Página ${currentPage + 1} de ${pages}`;
  previousPage.disabled = currentPage === 0;
  nextPage.disabled = currentPage >= pages - 1;
}

function turnPage(change) {
  currentPage += change;
  updatePage(selectedRows().length);
  const first = document.querySelector('#dataTable tr:not([data-page-hidden]) a');
  first?.focus();
}

previousPage.addEventListener('click', () => turnPage(-1));
nextPage.addEventListener('click', () => turnPage(1));

function renderTable() {
  const rows = selectedRows();
  const count = rows.length;
  const countLabel = count === 1 ? '1 registro' : `${count} registros`;
  document.getElementById('resultCount').textContent = `${countLabel} de ${data.length}`;
  document.getElementById('indicatorResults').hidden = count === 0;
  document.getElementById('emptyResults').hidden = count !== 0;
  csvButton.disabled = jsonButton.disabled = count === 0;
  const applied = currentFilters();
  for (const link of shortcutLinks) {
    link.href = urlForFilters(location.href, { ...applied, scope: link.dataset.scope });
    if (link.dataset.scope === filters.scope.value) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  document.getElementById('dataTable').innerHTML = rows.map(row => {
    const scopeClass = row.scope === 'ESF' ? 'local' : row.scope === 'Município' ? '' : 'context';
    const typeClass = row.type === 'Meta' ? 'tag goal' : 'micro';
    return `<tr role="row">
      <th scope="row" role="rowheader"><a class="record-link" href="${evidenceHash(row.id)}">${esc(row.label)}</a><br><span class="micro">${esc(row.cat)}</span></th>
      <td role="cell" data-label="Abrangência"><span class="tag ${scopeClass}">${esc(scopeLabels[row.scope])}</span></td>
      <td role="cell" data-label="Período">${esc(row.year)}</td>
      <td role="cell" class="num" data-label="Valor"><b>${vshow(row.value, row.unit)}</b><br><span class="${typeClass} row-type">${esc(typeLabels[row.type])}</span></td>
      <td role="cell" data-label="Evidência"><a href="${esc(row.url)}" target="_blank" rel="noopener noreferrer">${esc(row.source)}</a></td>
    </tr>`;
  }).join('');
  updatePage(count);
}
const rights=[['Incapacidade temporária','Auxílio por incapacidade temporária','Condição incapacitante para a atividade habitual; qualidade de segurado/carência ou isenção e comprovação conforme enquadramento.','INSS / Meu INSS'],['Incapacidade permanente','Aposentadoria por incapacidade permanente','Incapacidade sem possibilidade de reabilitação para atividade que garanta subsistência, além dos demais requisitos.','INSS'],['Impedimento de longo prazo e baixa renda','BPC à pessoa com deficiência','Avaliação biopsicossocial, renda familiar e CadÚnico, conforme requisitos legais; não exige contribuição.','CRAS + INSS'],['Idade rural','Aposentadoria por idade rural','Verificar idade, atividade rural e documentos de comprovação.','INSS'],['Afastamento e sequela de acidente','Auxílio-acidente e outras proteções','Auxílio-acidente não abrange automaticamente todas as categorias de segurado especial. Avaliar categoria e requisitos.','INSS / análise especializada'],['Tratamento e cirurgia pendentes','Acesso à saúde e continuidade do cuidado','Critérios clínicos de prioridade, situação na regulação, transporte e suporte familiar.','ESF / regulação / assistência social']];
const questions=[['Essa roça é sua, da família ou você trabalha para alguém?','Diferencia o regime de trabalho sem inferir o enquadramento automaticamente.'],['Se você precisar ficar 30 dias sem trabalhar, quem consegue cuidar da produção?','Revela dependência de trabalho pessoal e possibilidade de apoio.'],['O que a doença impede você de fazer no trabalho habitual?','Permite descrever capacidade funcional com tarefas reais.'],['Você já recebe algum benefício ou fez pedido ao INSS?','Identifica proteção existente, requerimento negado ou ausência de solicitação.'],['Quem ajuda com transporte, cuidados e renda durante o afastamento?','Identifica barreiras à continuidade do tratamento.']];
function renderRights(){document.getElementById('rightCards').innerHTML=rights.map(x=>`<div class="right"><b>${esc(x[1])}</b><small>${esc(x[0])}</small><div class="divider"></div><p class="mini">${esc(x[2])}</p><span class="tag">${esc(x[3])}</span></div>`).join('');document.getElementById('questionSteps').innerHTML=questions.map(x=>`<div class="step"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('');document.getElementById('rightsTable').innerHTML=rights.map(x=>`<tr><td>${esc(x[0])}</td><td>${esc(x[1])} — ${esc(x[2])}</td><td>${esc(x[3])}</td></tr>`).join('')}
const olderAdultSources = [
  ['SESA/ES · Boletim Estadual da APS 2025', 'Tabela de AMDI, p. 22. Base SISAB extraída em 11/02/2026, com população 60+ do Censo IBGE 2022.', amdiBulletin, 'Publicação estadual'],
  ['Câmara Municipal · Lei nº 2.937/2026', 'Conselho Municipal de Defesa dos Direitos da Pessoa Idosa e instituição do Fundo Municipal do Idoso.', 'https://sapl.marechalfloriano.es.leg.br/norma/2982', 'Legislação municipal'],
  ['DOM/ES · Decreto nº 446/2026', 'Edição 3.124, p. 148. Regulamentação do Fundo Municipal do Idoso.', 'https://ioes.dio.es.gov.br/portal/edicoes/download/11618#page=148', 'Legislação municipal'],
  ['DOM/ES · Resolução CMDI nº 031/2026', 'Edição 3.132, p. 200, de 23/11/2026. Calendário ordinário de 2027.', 'https://ioes.dio.es.gov.br/portal/edicoes/download/11656#page=200', 'Ato do CMDI']
];
const sources = [
  ['Plano Municipal de Saúde 2026–2029', 'Tabelas 14, 38, 39, 41, 50 e 56; dados de 2020 a 2025.', gov26, 'Publicação municipal'],
  ['Plano Municipal de Saúde 2022–2025', 'Tabela 45, agosto de 2021, risco familiar da ESF Victor Hugo.', gov22, 'Publicação municipal'],
  ['Incaper · Proater Marechal Floriano', 'Censo Agropecuário 2017 e associações rurais 2020; tabela 5 e quadro 1.', incaper, 'Publicação estadual'],
  ['IBGE · Marechal Floriano', 'Censo 2022 e estimativa populacional municipal de 2026.', 'https://www.ibge.gov.br/cidades-e-estados/es/marechal-floriano.html', 'Publicação federal'],
  ['IBGE · SIDRA', 'Consulta da população residente no Censo 2022, tabela 4714, variável 93, município 3203346.', 'https://apisidra.ibge.gov.br/values/t/4714/n6/3203346/v/93/p/2022', 'Base de dados'],
  ['Previdência Social · Benefícios do RGPS', 'Planilha por clientela, aba Emitidos_2025. Referência: município do órgão pagador e créditos emitidos.', rgps, 'Planilha federal'],
  ['Ministério da Saúde · SIM', 'Mortalidade Geral 2022. Contagem de óbitos não fetais pelo município de residência.', mortality, 'Base de dados'],
  ...olderAdultSources,
  ['INSS · Serviços e benefícios', 'Orientação pública sobre segurado especial e benefícios por incapacidade.', 'https://www.gov.br/inss/pt-br', 'Referência de serviços'],
  ['MDS · Proteção social', 'BPC, Cadastro Único e orientações de assistência social.', 'https://www.gov.br/mds/pt-br', 'Referência de serviços'],
  ['Critérios do Auditar Espírito Santo', 'Método de reprodução, recortes e pendências por período.', 'https://github.com/joyceradis/AuditorES/blob/main/docs/fontes.md', 'Documentação do projeto']
];
function renderSourceList(id, entries) {
  document.getElementById(id).innerHTML = entries.map(([title, description, url, type]) =>
    `<article class="source"><div><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a><small>${esc(description)}</small></div><span class="tag">${esc(type)}</span></article>`
  ).join('');
}
function renderSources() {
  renderSourceList('sourceList', sources);
  renderSourceList('olderAdultSources', olderAdultSources);
}
const repl=[['Definir unidade territorial','Município, distrito, ESF, microárea e data do levantamento. Não misturar bases territoriais.'],['Ler PMS/PAS/RAG','Planos e relatórios municipais de saúde: população, cadastros, crônicos, regulação, acidentes e produção.'],['Conferir e-SUS APS/CNES/DATASUS','Solicitar agregados atualizados à coordenação e checar o cadastro da equipe, notificações e série histórica.'],['Verificar estrutura produtiva','IBGE Censo Agropecuário, Incaper/Proater, RAIS/CAGED quando pertinente e associações locais.'],['Medir proteção social','MDS (BPC, Bolsa Família, CadÚnico), INSS/BEPS e dados agregados oficiais; distinguir cobertura e elegibilidade.'],['Pessoa idosa e governança','Consultar boletim AMDI da SESA, produção por equipe, CMDI, legislação do FMI, plano de aplicação e prestação de contas. Distinguir competência, meta e execução.'],['Mapear barreiras ao tratamento','Fila de regulação, absenteísmo, transporte, visitas domiciliares, equipe multiprofissional e serviço social.'],['Construir linha de cuidado','Definir quem rastreia necessidade, quem documenta, quem orienta requerimento e como acompanhar o desfecho.'],['Auditar o relatório','Documentar fonte, ano, unidade, denominador, limitações e hipótese a testar. Excluir dados pessoais.']];
document.getElementById('replicationSteps').innerHTML=repl.map(x=>`<div class="step"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('');
function renderEvidence(row) {
  rowForDialog = row;
  document.getElementById('evidenceTitle').textContent = row.label;
  document.getElementById('evidenceValue').textContent = vshow(row.value, row.unit);
  document.getElementById('evidenceNote').textContent = row.note;
  document.getElementById('evidenceSource').textContent = row.source;
  document.getElementById('evidenceOriginal').href = row.url;
  document.getElementById('evidenceFeedback').textContent = '';
  document.getElementById('evidenceFacts').innerHTML = [
    ['Abrangência', scopeLabels[row.scope]], ['Competência', row.year],
    ['Medida', row.measure], ['Tipo de dado', typeLabels[row.type]]
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('');
  if (!dialog.open) {
    dialog.showModal();
    document.getElementById('closeEvidence').focus();
  }
}

function isEvidenceHash(hash) {
  return hash?.startsWith('#evidencia-') ?? false;
}

function navigateEvidence({ hash, previousHash }) {
  const isEvidence = isEvidenceHash(hash);
  const row = isEvidence ? data.find(item => hash === evidenceHash(item.id)) : null;
  document.getElementById('missingEvidence').hidden = !isEvidence || Boolean(row);
  if (!row) {
    if (dialog.open) dialog.close();
    return false;
  }
  if (!dialog.open) {
    returnFocus = document.activeElement;
    returnHash = isEvidenceHash(previousHash) ? '#indicadores' : previousHash ?? '#indicadores';
  }
  renderEvidence(row);
  return true;
}

document.getElementById('closeEvidence').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  if (!isEvidenceHash(location.hash)) return;
  const url = new URL(location.href);
  url.hash = returnHash;
  history.replaceState(history.state, '', url);
  if (url.hash !== '#indicadores') refreshNavigation();
  if (returnFocus instanceof HTMLAnchorElement) returnFocus.focus();
  else if (url.hash === '#indicadores') filters.q.focus();
});
document.getElementById('copyEvidence').addEventListener('click', async () => {
  const url = new URL(location.href);
  url.search = '';
  url.hash = evidenceHash(rowForDialog.id);
  const feedback = document.getElementById('evidenceFeedback');
  try {
    await navigator.clipboard.writeText(url.href);
    feedback.textContent = 'Link copiado.';
  } catch {
    feedback.textContent = url.href;
  }
});

window.addEventListener('popstate', () => {
  if (location.search === filterSearch) return;
  filterSearch = location.search;
  readFilters();
  currentPage = 0;
  renderTable();
});

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slug(text) {
  return normalize(text).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function exportJSON() {
  const report = {
    schema: 'atlas-protecao-social-v1',
    exported_at: new Date().toISOString(),
    profile,
    filters: currentFilters(),
    data: selectedRows()
  };
  download('atlas_' + slug(profile.city) + '.json', JSON.stringify(report, null, 2), 'application/json;charset=utf-8');
}

function exportCSV() {
  download('indicadores_' + slug(profile.city) + '.csv', rowsAsCSV(selectedRows()), 'text/csv;charset=utf-8');
}

csvButton.addEventListener('click', exportCSV);
jsonButton.addEventListener('click', exportJSON);
document.getElementById('printReport').addEventListener('click', () => window.print());
async function copyQuestions() {
  const text = questions.map(([question], index) => `${index + 1}. ${question}`).join('\n');
  const status = document.getElementById('copyQuestionsStatus');
  const fallback = document.getElementById('copyQuestionsFallback');
  try {
    await navigator.clipboard.writeText(text);
    fallback.hidden = true;
    status.textContent = 'Perguntas copiadas.';
  } catch {
    fallback.value = text;
    fallback.hidden = false;
    fallback.focus();
    fallback.select();
    status.textContent = 'Selecione e copie as perguntas abaixo.';
  }
}
document.getElementById('copyQuestions').addEventListener('click', copyQuestions);
render();
const refreshNavigation = initMunicipalNavigation({
  tabForHash: hash => isEvidenceHash(hash) ? 'dados' : null,
  onNavigate: navigateEvidence
});
