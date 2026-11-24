import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { data, filterRows } from '../assets/atlas-data.mjs';
import { barScale, resolveSeries } from '../assets/atlas-series.mjs';
import { filtersFromSearch, rowsAsCSV, urlForFilters } from '../assets/atlas-query.mjs';

test('cada ficha tem identidade estável, fonte e instrução de leitura', () => {
  const ids = data.map(row => row.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const row of data) {
    assert.match(row.id, /^[a-z0-9-]+$/);
    assert.ok(row.source && row.note && row.measure && Number.isFinite(row.value));
    const url = new URL(row.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(url.hostname.endsWith('.gov.br'));
  }
});

test('recortes e AMDI mantêm população, equipe e meta separados', () => {
  const records = filterRows({ query: 'amdi', year: '2025', category: 'Pessoa idosa' });
  assert.deepEqual(records.map(row => [row.value, row.scope, row.type]), [
    [37, 'Município', 'Resultado'], [1.29, 'Município', 'Resultado'], [20, 'Espírito Santo', 'Meta']
  ]);
  assert.deepEqual(filterRows({ scope: 'ESF', query: 'AMDI' }), []);
  assert.equal(filterRows({ scope: 'Município', query: 'populacao estimada' })[0].value, 19159);
  assert.equal(filterRows({ scope: 'ESF', query: 'agentes comunitarios' })[0].value, 4);
});

test('busca combina termos, ano e categoria, sem depender de acento', () => {
  assert.deepEqual(filterRows({ query: 'acidentes trabalho', year: '2024' }).map(row => row.value), [313]);
  assert.deepEqual(filterRows({ query: 'classificadas', year: '2021', category: 'Risco familiar' }).map(row => row.value), [480]);
  assert.deepEqual(filterRows({ query: 'beneficios rgps', year: '2025' }).map(row => row.value), [3810, 2145]);
  assert.deepEqual(filterRows({ query: 'zzz', scope: 'Município' }), []);
});

test('base da vitrine e agregados da área de trabalho concordam quando compartilham a medida', () => {
  for (const [file, scope] of [['municipio', 'Município'], ['victor-hugo', 'ESF']]) {
    const aggregates = JSON.parse(readFileSync(new URL(
      `../docs/dados-publicos/marechal-floriano-${file}.json`, import.meta.url
    )));
    for (const aggregate of aggregates) {
      const publicRow = data.find(row => row.scope === scope && row.label === aggregate.indicator);
      assert.ok(publicRow, aggregate.indicator);
      assert.equal(publicRow.value, aggregate.value);
    }
  }
});

test('as séries da abertura têm fichas canônicas e escalas coerentes', () => {
  const accidents = resolveSeries('trabalho').points.map(point => point.row.value);
  assert.deepEqual(accidents, [3, 6, 19, 240, 313]);
  assert.deepEqual(barScale(accidents), [400, 300, 200, 100, 0]);
  assert.equal(resolveSeries('familias').points.reduce((sum, { row }) => sum + row.value, 0), 480);
  assert.deepEqual(resolveSeries('amdi').points.map(({ row }) => [row.scope, row.value]), [
    ['Município', 1.29], ['Espírito Santo', 20]
  ]);
  assert.equal(resolveSeries('inexistente'), null);
});

test('os filtros passam pelo endereço sem perder parâmetros de contexto', () => {
  const initial = new URL('https://example.org/AuditorES/municipios/marechal-floriano/?q=risco&year=2021&scope=municipio&ref=vitrine#indicadores');
  const filtered = filtersFromSearch(initial.search);
  const changed = urlForFilters(initial, { ...filtered, scope: 'ESF' });
  assert.equal(changed.searchParams.get('scope'), 'victor-hugo');
  assert.equal(changed.searchParams.get('q'), 'risco');
  assert.equal(changed.searchParams.get('year'), '2021');
  assert.equal(changed.searchParams.get('ref'), 'vitrine');
  assert.equal(initial.searchParams.get('scope'), 'municipio');
  assert.equal(filtersFromSearch('?scope=invalido&year=2001').scope, '');
  assert.equal(filtersFromSearch('?scope=invalido&year=2001').year, '');
});

test('a exportação CSV preserva ordem, competência e aspas', () => {
  const row = filterRows({ query: 'acidentes trabalho', year: '2024' })[0];
  const csv = rowsAsCSV([{ ...row, note: 'Trecho "publicado"; origem' }]);
  assert.ok(csv.startsWith('\uFEFF"indicador";"valor"'));
  const lines = csv.split('\r\n');
  assert.equal(lines.length, 2);
  assert.match(lines[1], /"313";"Saúde do trabalhador";"Município";"2024"/);
  assert.match(lines[1], /"Trecho ""publicado""; origem"$/);
});
