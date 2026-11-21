"use strict";

const get = id => document.getElementById(id);
const city = get("city");
const scope = get("scope");
const period = get("period");
const source = get("source");
const series = get("series");
const results = get("results");
const importPanel = get("import-panel");
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 12 });
let catalog;
let groups;
let request = 0;

function options(select, items) {
  select.replaceChildren(...items.map(([value, label]) => new Option(label, value)));
  select.disabled = !items.length;
}

async function api(path, options) {
  const response = await fetch(path, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error);
  return body;
}

function scopeQuery() {
  return new URLSearchParams({ city: city.value, scope: scope.value });
}

function renderChart() {
  const observations = groups.get(series.value) || [];
  const maximum = Math.max(...observations.map(row => Math.abs(row.value)), 1e-15);
  get("chart").replaceChildren(...observations.map(row => {
    const entry = document.createElement("li");
    const date = document.createElement("span");
    date.textContent = row.period;
    const bar = document.createElement("meter");
    bar.min = 0;
    bar.max = maximum;
    bar.value = Math.abs(row.value);
    bar.setAttribute("aria-hidden", "true");
    const value = document.createElement("span");
    value.textContent = number.format(row.value);
    entry.append(date, bar, value);
    return entry;
  }));
  get("series-note").textContent = "Barras em magnitude absoluta. O valor ao lado preserva o sinal.";
}

function renderRows(observations) {
  groups = new Map();
  get("rows").replaceChildren(...observations.map(row => {
    const granularity = row.period.length === 4 ? "Anual" : "Mensal";
    const label = [row.indicator, row.unit, row.source, granularity].join(" · ");
    const key = JSON.stringify([label, row.reference, row.method]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
    const tr = document.createElement("tr");
    for (const value of [row.indicator, number.format(row.value) + " " + row.unit, row.period, row.source, row.method]) {
      tr.insertCell().textContent = value;
    }
    const reference = document.createElement("a");
    reference.href = row.reference;
    reference.textContent = row.source;
    reference.title = row.reference;
    tr.cells[3].replaceChildren(reference);
    return tr;
  }));
  options(series, [...groups.keys()].map((key, index) => {
    const [label] = JSON.parse(key);
    return [key, (index + 1) + " · " + label];
  }));
  renderChart();
}

async function load() {
  const id = ++request;
  results.hidden = true;
  importPanel.hidden = true;
  const selected = catalog.cities[city.value];
  get("axis").textContent = selected.axis;
  if (!scope.value) {
    get("status").textContent = "Nenhum recorte disponível para este município.";
    period.disabled = true;
    source.disabled = true;
    return;
  }
  source.disabled = false;
  const query = scopeQuery();
  get("status").textContent = "Carregando observações…";
  try {
    const all = await api("/api/observations?" + query);
    if (id !== request) return;
    const year = period.value;
    const years = [...new Set(all.map(row => row.period.slice(0, 4)))].sort().reverse();
    options(period, [["", "Todos"], ...years.map(value => [value, value])]);
    if (years.includes(year)) period.value = year;
    if (period.value) query.set("period", period.value);
    if (source.value) query.set("source", source.value);
    const filtered = all.filter(row =>
      (!period.value || row.period.startsWith(period.value)) &&
      (!source.value || row.source === source.value)
    );
    renderRows(filtered);
    get("export").href = "/api/export?" + query;
    results.hidden = !filtered.length;
    importPanel.hidden = selected.scopes[scope.value].role !== "write";
    get("status").textContent = filtered.length ? filtered.length + " observações de trabalho." : "Nenhuma observação para este recorte e filtros.";
  } catch (error) {
    if (id === request) get("status").textContent = error.message;
  }
}

function changeScope() {
  get("import-file").value = "";
  get("import-status").textContent = "";
  period.value = "";
  source.value = "";
  load();
}

function changeCity() {
  options(scope, Object.entries(catalog.cities[city.value].scopes).map(([id, entry]) => [id, entry.name]));
  changeScope();
}

async function importFile() {
  const input = get("import-file");
  const status = get("import-status");
  const button = get("import-button");
  const file = input.files[0];
  if (!file || file.size > 256 * 1024) {
    status.textContent = "Selecione um arquivo JSON de até 256 KiB.";
    return;
  }
  const query = scopeQuery().toString();
  button.disabled = true;
  status.textContent = "Importando…";
  try {
    const result = await api("/api/import?" + query, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-AuditorES-Import": "1" },
      body: await file.text(),
    });
    if (scopeQuery().toString() === query) {
      input.value = "";
      status.textContent = result.added + " incluídas. " + result.duplicates + " já registradas.";
      await load();
    }
  } catch (error) {
    if (scopeQuery().toString() === query) status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function init() {
  try {
    catalog = await api("/api/catalog");
    const cities = Object.entries(catalog.cities);
    options(city, cities.map(([id, entry]) => [id, entry.name]));
    const first = cities.find(([, entry]) => Object.keys(entry.scopes).length);
    if (first) city.value = first[0];
    options(source, [["", "Todas"], ...Object.entries(catalog.sources)]);
    city.addEventListener("change", changeCity);
    scope.addEventListener("change", changeScope);
    period.addEventListener("change", load);
    source.addEventListener("change", load);
    series.addEventListener("change", renderChart);
    get("import-button").addEventListener("click", importFile);
    changeCity();
  } catch (error) {
    get("status").textContent = error.message;
  }
}

init();
