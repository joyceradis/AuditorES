import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { data, filterRows } from '../assets/atlas-data.mjs';

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

test('os destaques da página inicial apontam para fichas distintas na base', () => {
  const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const highlights = [...home.matchAll(/data-record="([^"]+)"/g)].map(match => match[1]);
  const rows = highlights.map(id => data.find(row => row.id === id));
  assert.equal(new Set(highlights).size, 4);
  assert.ok(rows.every(Boolean));
  assert.deepEqual(rows.map(({ scope, type }) => [scope, type]), [
    ['Município', 'Resultado'], ['Espírito Santo', 'Meta'],
    ['ESF', 'Resultado'], ['Município', 'Resultado']
  ]);
});
