const search = document.getElementById('municipioBusca');
const count = document.getElementById('municipiosContagem');
const empty = document.getElementById('municipiosVazio');
const rows = [...document.querySelectorAll('[data-municipality]')];
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function filter() {
  const terms = normalize(search.value).split(/\s+/).filter(Boolean);
  let visible = 0;
  for (const row of rows) {
    const name = row.dataset.municipality;
    row.hidden = !terms.every(term => name.includes(term));
    visible += Number(!row.hidden);
  }
  count.textContent = `${visible} ${visible === 1 ? 'município' : 'municípios'}`;
  empty.hidden = visible !== 0;
}

search.closest('.municipal-search').hidden = false;
search.addEventListener('input', filter);
window.addEventListener('pageshow', filter);
