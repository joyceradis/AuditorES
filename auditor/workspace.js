"use strict";

const get = id => document.getElementById(id);
const period = get("period");
const source = get("source");
const search = get("query");
const resetFilters = get("resetFilters");
const series = get("series");
const results = get("results");
const importPanel = get("import-panel");
const normalize = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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
  if (!response.headers.get("Content-Type")?.startsWith("application/json")) {
    throw new Error("Resposta inesperada do servidor.");
  }
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Não foi possível completar a operação.");
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
  get("series-details").textContent = observations.length ? observations[0].method : "";
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
    reference.target = "_blank";
    reference.rel = "noopener noreferrer";
    tr.cells[3].replaceChildren(reference);
    return tr;
  }));
  const selectedSeries = series.value;
  const variants = new Map();
  const choices = [...groups.keys()].map(key => {
    const [label, , method] = JSON.parse(key);
    const occurrence = (variants.get(label) || 0) + 1;
    variants.set(label, occurrence);
    return { key, label, method, occurrence };
  });
  options(series, choices.map(({ key, label, method, occurrence }) => [
    key, variants.get(label) === 1 ? label : `${label} · Série ${occurrence} · ${method}`
  ]));
  if (groups.has(selectedSeries)) series.value = selectedSeries;
  renderChart();
}

function downloadRows(query, rows) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${query.get("city")}-${query.get("scope")}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function showAnalysis(query, city, scope, sources, parents, route) {
  const permission = scope.role === "write" ? "Consulta e importação" : "Consulta";
  setPage(scope.label, permission, parents, `${city.name} · ${scope.kind}`);
  get("evidencias").textContent = AXIS_CONTENT[city.axisId].evidenceTitle;
  results.prepend(get("evidence-panel"));
  get("analysis").hidden = false;
  importPanel.hidden = scope.role !== "write";
  options(source, [["", "Todas"], ...Object.entries(sources)]);
  if (Object.hasOwn(sources, route.get("source"))) source.value = route.get("source");
  search.value = (route.get("q") || "").slice(0, 120);
  let year = route.get("period");
  let observations = [];
  let visibleRows = [];

  function renderResults() {
    const value = search.value.trim();
    const terms = normalize(value).split(/\s+/).filter(Boolean);
    visibleRows = observations.filter(row => {
      const description = normalize([row.indicator, row.unit, row.method, row.source, sources[row.source]].join(" "));
      return (!period.value || row.period.startsWith(period.value)) &&
        (!source.value || row.source === source.value) && terms.every(term => description.includes(term));
    });
    renderRows(visibleRows);
    results.hidden = !visibleRows.length;
    resetFilters.disabled = !period.value && !source.value && !value;
    const url = new URL(location.href);
    for (const [key, filter] of Object.entries({ q: value, period: period.value, source: source.value })) {
      if (filter) url.searchParams.set(key, filter);
      else url.searchParams.delete(key);
    }
    history.replaceState(history.state, "", url);
    const count = visibleRows.length;
    get("status").textContent = observations.length
      ? `${count} de ${observations.length} observações${count ? "." : ". Altere ou limpe os filtros."}`
      : "Ainda não há observações para este recorte.";
  }

  async function reload() {
    results.hidden = true;
    get("status").textContent = "Carregando observações…";
    period.disabled = source.disabled = search.disabled = resetFilters.disabled = true;
    try {
      observations = await api("/api/observations?" + query);
      const years = [...new Set(observations.map(row => row.period.slice(0, 4)))].sort().reverse();
      options(period, [["", "Todos"], ...years.map(value => [value, value])]);
      if (years.includes(year)) period.value = year;
      source.disabled = search.disabled = false;
      renderResults();
    } catch (error) {
      get("status").textContent = error.message;
    }
  }

  period.addEventListener("change", () => {
    year = period.value;
    renderResults();
  });
  source.addEventListener("change", renderResults);
  search.addEventListener("input", renderResults);
  resetFilters.addEventListener("click", () => {
    search.value = source.value = period.value = "";
    year = "";
    renderResults();
    search.focus();
  });
  series.addEventListener("change", renderChart);
  get("export").addEventListener("click", () => downloadRows(query, visibleRows));
  if (scope.role === "write") setupImport(query, scope.label, reload);
  await reload();
}

function setupImport(query, scope, reload) {
  const input = get("import-file");
  const status = get("import-status");
  const preview = get("import-preview");
  const button = get("import-button");
  let payload;

  input.addEventListener("change", async () => {
    const file = input.files[0];
    button.disabled = true;
    status.textContent = "";
    preview.textContent = "";
    payload = undefined;
    if (!file) return;
    if (!file.size || file.size > 256 * 1024) {
      preview.textContent = "Selecione um arquivo JSON de até 256 KiB.";
      return;
    }
    try {
      const content = await file.text();
      if (input.files[0] !== file) return;
      const rows = JSON.parse(content);
      if (!Array.isArray(rows) || !rows.length || rows.length > 1000) {
        throw new Error();
      }
      preview.textContent = `${rows.length} registros no arquivo. Destino: ${scope}. Confira antes de importar.`;
      payload = content;
      button.disabled = false;
    } catch {
      preview.textContent = "O arquivo deve conter uma lista JSON com 1 a 1.000 registros.";
    }
  });

  button.addEventListener("click", async () => {
    if (!payload) return;
    button.disabled = input.disabled = true;
    status.textContent = "Importando…";
    try {
      const result = await api("/api/import?" + query, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-AuditorES-Import": "1" },
        body: payload,
      });
      input.value = "";
      payload = undefined;
      preview.textContent = "";
      status.textContent = result.added + " incluídas. " + result.duplicates + " já registradas.";
      await reload();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      input.disabled = false;
      button.disabled = !payload;
    }
  });
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
      setPage("Municípios", "Escolha um município para consultar os recortes autorizados para sua conta.");
      if (cityId) showNavigationStatus("Município indisponível. Escolha uma opção abaixo.");
      renderDirectory(Object.entries(cities).map(([id, city]) => ({
        title: city.name, caption: Object.keys(city.scopes).length ? city.axis : city.axis + " · Sem recortes autorizados", href: pagePath({ city: id }),
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
      await showAnalysis(query, city, city.scopes[scopeId], sources, parents, route);
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
