import { calendarYear, data, normalize } from './atlas-data.mjs';

const queryLimit = 120;
const slug = text => normalize(text).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const scopeValues = {
  municipio: 'Município', 'victor-hugo': 'ESF', comunidade: 'Comunidade', estado: 'Espírito Santo'
};
export const typeValues = { resultado: 'Resultado', contexto: 'Contexto', meta: 'Meta' };
export const categoryValues = Object.fromEntries(
  [...new Set(data.map(row => row.cat))].sort((first, second) => first.localeCompare(second, 'pt-BR'))
    .map(category => [slug(category), category])
);
export const yearValues = [...new Set(data.map(calendarYear))].sort().reverse();

function readOption(values, key) {
  return Object.hasOwn(values, key) ? values[key] : '';
}

export function filtersFromSearch(search) {
  const params = new URLSearchParams(search);
  return {
    query: (params.get('q') || '').trim().slice(0, queryLimit),
    scope: readOption(scopeValues, params.get('scope')),
    category: readOption(categoryValues, params.get('category')),
    year: yearValues.includes(params.get('year')) ? params.get('year') : '',
    type: readOption(typeValues, params.get('type'))
  };
}

export function urlForFilters(href, filters) {
  const url = new URL(href);
  const asKey = (options, value) => Object.keys(options).find(key => options[key] === value);
  const values = {
    q: (filters.query || '').trim().slice(0, queryLimit),
    scope: asKey(scopeValues, filters.scope),
    category: asKey(categoryValues, filters.category),
    year: yearValues.includes(filters.year) ? filters.year : '',
    type: asKey(typeValues, filters.type)
  };
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  url.hash = 'indicadores';
  return url;
}

const csvColumns = [
  ['indicador', 'label'], ['valor', 'value'], ['categoria', 'cat'], ['abrangencia', 'scope'],
  ['periodo', 'year'], ['unidade', 'unit'], ['fonte', 'source'], ['url', 'url'],
  ['qualidade', 'quality'], ['tipo', 'type'], ['id', 'id'], ['medida', 'measure'], ['nota', 'note']
];

export function rowsAsCSV(rows) {
  const encode = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
  const headings = csvColumns.map(([heading]) => heading);
  const values = rows.map(row => csvColumns.map(([, key]) => row[key]));
  return '\uFEFF' + [headings, ...values].map(row => row.map(encode).join(';')).join('\r\n');
}
