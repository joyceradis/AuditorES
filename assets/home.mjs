const byId = id => document.getElementById(id);
const search = byId('city-search');
const moduleFilter = byId('module');
const rows = [...document.querySelectorAll('tr[data-city]')];
const pageSize = 8;
let page = 1;
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

function render() {
  const term = normalize(search.value);
  const filter = moduleFilter.value;
  const matches = rows.filter(row => row.dataset.city.includes(term) &&
    (!filter || row.dataset.modules.split(' ').includes(filter)));
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  page = Math.min(page, pages);
  const start = (page - 1) * pageSize;
  const visible = new Set(matches.slice(start, start + pageSize));
  for (const row of rows) row.hidden = !visible.has(row);
  byId('count').textContent = matches.length
    ? `Exibindo ${start + 1}–${start + visible.size} de ${matches.length} · Ordem alfabética`
    : '0 municípios encontrados';
  byId('empty').hidden = matches.length > 0;
  byId('pager').hidden = pages === 1;
  byId('page').textContent = `Página ${page} de ${pages}`;
  byId('prev').disabled = page === 1;
  byId('next').disabled = page === pages;
}
function filterRows() { page = 1; render(); }
search.addEventListener('input', filterRows);
moduleFilter.addEventListener('change', filterRows);
byId('prev').addEventListener('click', () => { page--; render(); });
byId('next').addEventListener('click', () => { page++; render(); });
byId('reset').addEventListener('click', () => {
  search.value = ''; moduleFilter.value = ''; filterRows(); search.focus();
});
byId('filters').hidden = false;
render();
