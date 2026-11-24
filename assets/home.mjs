import { data, scopeLabels } from './atlas-data.mjs';
import { barScale, evidenceHash, formatReading, resolveSeries } from './atlas-series.mjs';

const atlas = 'municipios/marechal-floriano/';
const byId = id => document.getElementById(id);
const choices = [...document.querySelectorAll('[data-series]')];
const marks = byId('series-marks');
let series;

function selectPoint(index, announce = false) {
  const point = series.points[index];
  if (!point) return;
  for (const [position, button] of [...marks.children].entries()) {
    button.setAttribute('aria-pressed', String(position === index));
  }
  const { row } = point;
  const scope = scopeLabels[row.scope];
  const amount = formatReading(row);
  byId('reading-scope').textContent = scope;
  const year = byId('reading-year');
  year.textContent = row.year;
  if (/^\d{4}$/.test(row.year)) year.dateTime = row.year;
  else year.removeAttribute('datetime');
  byId('reading-value').textContent = amount;
  byId('reading-label').textContent = row.label;
  byId('reading-explanation').textContent = series.detail;
  byId('reading-source').textContent = series.source;
  byId('reading-source').href = row.url;
  byId('reading-evidence').href = atlas + evidenceHash(row.id);
  if (announce) byId('reading-status').textContent = `${point.label}. ${scope}: ${amount}.`;
}

function makeMark(point, index, maximum) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'series-mark';
  const column = document.createElement('span');
  column.className = 'series-column';
  column.style.setProperty('--height', `${point.row.value / maximum * 100}%`);
  const value = document.createElement('span');
  value.className = 'series-mark-value';
  value.textContent = formatReading(point.row);
  const label = document.createElement('span');
  label.className = 'series-mark-label';
  label.textContent = point.label;
  column.append(value);
  button.append(label, column);
  button.addEventListener('click', () => selectPoint(index, true));
  return button;
}

function selectSeries(id, announce = false) {
  const entry = resolveSeries(id);
  if (!entry) return;
  series = entry;
  for (const button of choices) button.setAttribute('aria-pressed', String(button.dataset.series === id));
  byId('series-title').textContent = series.title;
  byId('series-context').textContent = series.context;
  byId('series-caption').textContent = series.description;
  const ticks = barScale(series.points.map(({ row }) => row.value));
  byId('series-scale').replaceChildren(...ticks.map(value => {
    const tick = document.createElement('span');
    tick.textContent = formatReading({ value, unit: series.points[0].row.unit });
    return tick;
  }));
  marks.replaceChildren(...series.points.map((point, index) => makeMark(point, index, ticks[0])));
  const more = byId('reading-more');
  more.href = atlas + series.link;
  more.textContent = series.linkText;
  selectPoint(series.defaultIndex, announce);
  byId('reading-desk').hidden = false;
}

for (const choice of choices) choice.addEventListener('click', () => selectSeries(choice.dataset.series, true));
const registrations = data.find(row => row.id === 'pessoas-cadastradas-na-esf-30-04-2025');
if (registrations) {
  const link = byId('registered-link');
  link.textContent = formatReading(registrations) + ' cadastros na ESF · ' + registrations.year;
  link.href = atlas + evidenceHash(registrations.id);
  link.hidden = false;
}
byId('atlas-summary').textContent = `Município e ESF Victor Hugo · ${data.length} fichas para consulta`;
selectSeries('trabalho');
