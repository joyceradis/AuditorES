import { data } from './atlas-data.mjs';

const records = new Map(data.map(row => [row.id, row]));
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

for (const card of document.querySelectorAll('[data-record]')) {
  const row = records.get(card.dataset.record);
  if (!row) {
    card.hidden = true;
    continue;
  }
  const fact = card.querySelector('[data-fact]');
  fact.textContent = number.format(row.value) + (row.unit === '%' ? '%' : '');
  fact.hash = 'evidencia-' + row.id;
  fact.setAttribute('aria-label', fact.textContent + ' · ' + row.label + ' · Abrir ficha');
  card.querySelector('[data-period]').textContent = row.year;
  const source = card.querySelector('[data-source]');
  if (source) source.href = row.url;
}

const observed = records.get('indicador-amdi-2025');
const goal = records.get('meta-estadual-amdi-2025');
if (observed && goal && goal.value > 0) {
  const amdi = document.querySelector('.home-amdi');
  amdi.querySelector('[data-source]').href = observed.url;
  document.getElementById('amdi-bar').style.width = Math.min(100, observed.value / goal.value * 100) + '%';
} else {
  document.querySelector('.home-amdi').hidden = true;
}

document.getElementById('atlas-summary').textContent =
  data.length + ' fichas no ATLAS · município, ESF Victor Hugo e referências de contexto';
document.getElementById('home-evidence').hidden = false;
