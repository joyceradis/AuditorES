const byId = id => document.getElementById(id);
const search = byId('city-search');
const availability = byId('module');
const rows = [...document.querySelectorAll('tr[data-city]')];
const count = byId('count');
const reset = byId('reset');
const pageSize = 8;
let page = 1;
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

const stageButtons = [...document.querySelectorAll('[data-stage-filter]')].map(item => {
  const button = document.createElement('button');
  button.type = 'button';
  button.value = item.dataset.stageFilter === 'catalog' ? 'cadastro' : item.dataset.stageFilter;
  button.append(...item.childNodes);
  item.append(button);
  button.addEventListener('click', () => {
    availability.value = availability.value === button.value && !search.value ? '' : button.value;
    search.value = '';
    filterRows();
    count.focus();
  });
  return button;
});

function render() {
  const terms = normalize(search.value).split(/\s+/).filter(Boolean);
  const filter = availability.value;
  const matches = rows.filter(row => terms.every(term => row.dataset.city.includes(term)) &&
    (!filter || row.dataset.stage === filter || row.dataset.modules.split(' ').includes(filter)));
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  page = Math.min(page, pages);
  const start = (page - 1) * pageSize;
  const visible = new Set(matches.slice(start, start + pageSize));
  for (const row of rows) row.hidden = !visible.has(row);
  count.textContent = matches.length > pageSize
    ? `${start + 1}–${start + visible.size} de ${matches.length} municípios`
    : `${matches.length} ${matches.length === 1 ? 'município' : 'municípios'}`;
  for (const button of stageButtons) button.setAttribute('aria-pressed', String(button.value === filter));
  reset.hidden = !search.value && !filter;
  byId('empty').hidden = matches.length > 0;
  byId('pager').hidden = pages === 1;
  byId('page').textContent = `Página ${page} de ${pages}`;
  byId('prev').disabled = page === 1;
  byId('next').disabled = page === pages;
}

function saveSelection() {
  const url = new URL(location.href);
  for (const [key, value] of [['q', search.value], ['filtro', availability.value], ['pagina', page > 1 ? page : '']]) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  history.replaceState(history.state, '', url);
}
function restoreSelection() {
  const params = new URLSearchParams(location.search);
  search.value = (params.get('q') || '').slice(0, search.maxLength);
  const filter = params.get('filtro');
  availability.value = [...availability.options].some(option => option.value === filter) ? filter : '';
  const n = Number(params.get('pagina'));
  page = Number.isSafeInteger(n) && n > 0 ? n : 1;
  render();
}
function filterRows() { page = 1; render(); saveSelection(); }
function turnPage(delta) {
  page += delta;
  render();
  saveSelection();
  count.focus();
}
search.addEventListener('input', filterRows);
availability.addEventListener('change', filterRows);
byId('prev').addEventListener('click', () => turnPage(-1));
byId('next').addEventListener('click', () => turnPage(1));
reset.addEventListener('click', () => {
  search.value = ''; availability.value = ''; filterRows(); search.focus();
});
byId('filters').hidden = false;
restoreSelection();
window.addEventListener('pageshow', restoreSelection);
window.addEventListener('popstate', restoreSelection);
