"use strict";

const get = id => document.getElementById(id);
const period = get("period");
const source = get("source");
const series = get("series");
const results = get("results");
const importPanel = get("import-panel");
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 12 });
let groups;

const AXIS_CONTENT = {
  "auditoria-os": {
    description: "Acompanhe indicadores e evidências de auditoria por unidade ou contrato.",
    evidenceTitle: "Indicadores e evidências de auditoria",
  },
  "inteligencia-territorial": {
    description: "Consulte os indicadores por recorte municipal ou da equipe de saúde.",
    evidenceTitle: "Indicadores e fontes territoriais",
  },
};

const SCOPE_HEADINGS = { Unidade: "Unidades", Contrato: "Contratos", Território: "Territórios" };

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

function pagePath(parts) {
  return "/?" + new URLSearchParams(parts);
}

function setPage(title, description, parents = [], context = "") {
  document.title = title + " | AuditorES";
  get("titulo").textContent = title;
  get("context").textContent = context;
  get("context").hidden = !context;
  get("intro-copy").textContent = description;
  get("intro-copy").hidden = !description;

  if (!parents.length) return;
  const breadcrumbs = get("breadcrumbs");
  const list = breadcrumbs.querySelector("ol");
  for (const [label, href] of parents) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.textContent = label;
    link.href = href;
    item.append(link);
    list.append(item);
  }
  const current = document.createElement("li");
  current.textContent = title;
  current.setAttribute("aria-current", "page");
  list.append(current);
  breadcrumbs.hidden = false;
}

function renderDirectory(entries, heading) {
  const list = document.createElement("ul");
  list.className = "directory-list";
  for (const { title, caption, href } of entries) {
    const card = get("directory-card").content.cloneNode(true);
    const link = card.querySelector("a");
    link.href = href;
    link.querySelector(".card-title").textContent = title;
    link.querySelector(".card-caption").textContent = caption;
    list.append(card);
  }

  const directory = get("directory");
  if (!heading) {
    directory.append(list);
    return;
  }

  const section = document.createElement("section");
  section.className = "directory-group";
  const title = document.createElement("h2");
  title.textContent = heading;
  section.append(title, list);
  directory.append(section);
}

function showNavigationStatus(message) {
  const status = get("navigation-status");
  status.textContent = message;
  status.hidden = !message;
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
  options(series, [...groups.keys()].map(key => {
    const [label] = JSON.parse(key);
    return [key, label];
  }));
  renderChart();
}

async function showAnalysis(query, city, scope, sources, parents) {
  setPage(scope.label, "", parents, scope.kind);
  get("evidencias").textContent = AXIS_CONTENT[city.axisId].evidenceTitle;
  if (city.axisId === "auditoria-os") results.prepend(get("evidence-panel"));
  get("analysis").hidden = false;
  importPanel.hidden = scope.role !== "write";
  options(source, [["", "Todas"], ...Object.entries(sources)]);
  let observations = [];

  function renderResults() {
    const filters = new URLSearchParams(query);
    if (period.value) filters.set("period", period.value);
    if (source.value) filters.set("source", source.value);
    const filtered = observations.filter(row =>
      (!period.value || row.period.startsWith(period.value)) &&
      (!source.value || row.source === source.value)
    );
    if (filtered.length) renderRows(filtered);
    get("export").href = "/api/export?" + filters;
    results.hidden = !filtered.length;
    const count = filtered.length;
    get("status").textContent = count
      ? count + (count === 1 ? " observação de trabalho." : " observações de trabalho.")
      : "Nenhuma observação para este recorte e filtros.";
  }

  async function reload() {
    results.hidden = true;
    get("status").textContent = "Carregando observações…";
    period.disabled = true;
    source.disabled = true;
    try {
      observations = await api("/api/observations?" + query);
      const year = period.value;
      const years = [...new Set(observations.map(row => row.period.slice(0, 4)))].sort().reverse();
      options(period, [["", "Todos"], ...years.map(value => [value, value])]);
      if (years.includes(year)) period.value = year;
      source.disabled = false;
      renderResults();
    } catch (error) {
      get("status").textContent = error.message;
    }
  }

  period.addEventListener("change", renderResults);
  source.addEventListener("change", renderResults);
  series.addEventListener("change", renderChart);
  get("import-button").addEventListener("click", () => importFile(query, reload));
  await reload();
}

async function importFile(query, reload) {
  const input = get("import-file");
  const status = get("import-status");
  const button = get("import-button");
  const file = input.files[0];
  if (!file || file.size > 256 * 1024) {
    status.textContent = "Selecione um arquivo JSON de até 256 KiB.";
    return;
  }
  button.disabled = true;
  status.textContent = "Importando…";
  try {
    const result = await api("/api/import?" + query, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-AuditorES-Import": "1" },
      body: await file.text(),
    });
    input.value = "";
    status.textContent = result.added + " incluídas. " + result.duplicates + " já registradas.";
    await reload();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function init() {
  try {
    const { cities, sources } = await api("/api/catalog");
    const route = new URLSearchParams(window.location.search);
    const cityId = route.get("city");
    const axisId = route.get("axis");
    const scopeId = route.get("scope");
    showNavigationStatus("");

    if (!Object.hasOwn(cities, cityId)) {
      setPage("Municípios", "Selecione o município que você quer analisar.");
      if (cityId) showNavigationStatus("Município indisponível. Escolha uma opção abaixo.");
      renderDirectory(Object.entries(cities).map(([id, city]) => ({
        title: city.name, caption: city.axis, href: pagePath({ city: id }),
      })));
      return;
    }

    const city = cities[cityId];
    const parents = [["Municípios", "/"]];
    const cityPath = pagePath({ city: cityId });
    const axisPath = pagePath({ city: cityId, axis: city.axisId });
    if (axisId !== city.axisId) {
      setPage(city.name, "Eixo de análise disponível neste município.", parents);
      if (axisId || scopeId) showNavigationStatus("Eixo ou recorte indisponível. Abra o eixo abaixo.");
      renderDirectory([{
        title: city.axis, caption: AXIS_CONTENT[city.axisId].description, href: axisPath,
      }]);
      return;
    }

    parents.push([city.name, cityPath]);
    if (Object.hasOwn(city.scopes, scopeId)) {
      parents.push([city.axis, axisPath]);
      const query = new URLSearchParams({ city: cityId, scope: scopeId });
      await showAnalysis(query, city, city.scopes[scopeId], sources, parents);
      return;
    }

    const scopes = Object.entries(city.scopes);
    setPage(city.axis, scopes.length ? "Selecione o recorte da análise." : "", parents, city.name);
    if (scopeId) showNavigationStatus("Este recorte está indisponível para sua conta.");
    else if (!scopes.length) showNavigationStatus("Nenhum recorte disponível para sua conta neste eixo.");
    for (const kind of city.kinds) {
      const entries = scopes.filter(([, scope]) => scope.kind === kind).map(([id, scope]) => ({
        title: scope.label,
        caption: scope.role === "write" ? "Consulta e importação" : "Consulta",
        href: pagePath({ city: cityId, axis: axisId, scope: id }),
      }));
      if (entries.length) renderDirectory(entries, SCOPE_HEADINGS[kind]);
    }
  } catch (error) {
    showNavigationStatus(error.message);
  }
}

init();
