import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { preview } from './preview.mjs';

const require = createRequire(import.meta.url);
const axe = require.resolve('axe-core/axe.min.js');
let site;
let browser;
let atlas;

before(async () => {
  site = await preview();
  atlas = site.url + 'municipios/marechal-floriano/';
  browser = await chromium.launch({ executablePath: process.env.AUDITORES_CHROME || undefined });
});

after(async () => {
  await browser?.close();
  await site?.close();
});

async function withPage(run, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport, permissions: ['clipboard-read', 'clipboard-write'] });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(8500);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

async function accessibility(page) {
  await page.addScriptTag({ path: axe });
  const result = await page.evaluate(() => window.axe.run({
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
  }));
  assert.deepEqual(result.violations.map(({ id, nodes }) => [id, nodes.map(node => node.target)]), []);
}

async function screenshot(page, filename) {
  if (process.env.AUDITORES_SCREENSHOTS) {
    await page.screenshot({ path: join(process.env.AUDITORES_SCREENSHOTS, filename) });
  }
}

test('da visualização à ficha, com as séries e fontes corretas', async () => withPage(async page => {
  await page.goto(site.url);
  await page.locator('#reading-desk').waitFor();
  assert.equal(await page.locator('#reading-value').innerText(), '313');
  await accessibility(page);
  await screenshot(page, 'editorial-home.png');
  await page.getByRole('button', { name: /2021\s*6/ }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#reading-value').innerText(), '6');
  assert.match(await page.getByRole('link', { name: /tabela 56/ }).getAttribute('href'), /#page=86$/);
  await page.getByRole('button', { name: 'Risco familiar' }).click();
  assert.equal(await page.locator('#reading-value').innerText(), '403');
  assert.equal(await page.locator('#reading-scope').innerText(), 'ESF Victor Hugo');
  await page.getByRole('button', { name: 'Pessoa idosa' }).click();
  assert.equal(await page.locator('#reading-value').innerText(), '1,29%');
  await page.getByRole('button', { name: /Meta estadual\s*20%/ }).click();
  assert.equal(await page.locator('#reading-scope').innerText(), 'Espírito Santo');
  await page.getByRole('link', { name: 'Abrir ficha' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('heading', { name: 'Meta estadual AMDI' }).waitFor();
  await accessibility(page);
  await screenshot(page, 'editorial-dossier.png');
  await page.keyboard.press('Escape');
  await page.waitForURL('**/#indicadores');
}));

test('busca, atalhos de recorte e exportação trabalham sobre a mesma consulta', async () => withPage(async page => {
  await page.goto(site.url);
  await page.getByLabel('Buscar no ATLAS de Marechal Floriano').fill('risco');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.waitForURL('**/?q=risco#indicadores');
  await page.getByLabel('Ano', { exact: true }).selectOption('2021');
  await page.getByRole('navigation', { name: 'Atalhos de recorte' })
    .getByRole('link', { name: 'ESF Victor Hugo' }).click();
  await page.getByText('5 registros de 37').waitFor();
  const query = new URL(page.url()).searchParams;
  assert.equal(query.get('q'), 'risco');
  assert.equal(query.get('year'), '2021');
  assert.equal(query.get('scope'), 'victor-hugo');
  await screenshot(page, 'editorial-explorer.png');
  const [download] = await Promise.all([
    page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar JSON' }).click()
  ]);
  const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
  assert.equal(exported.data.length, 5);
  assert(exported.data.every(row => row.scope === 'ESF'));
  await page.getByLabel('Buscar indicadores').fill('não existe xyz');
  await page.getByText('Nenhum registro encontrado').waitFor();
  assert(await page.getByRole('button', { name: 'Exportar CSV' }).isDisabled());
  await page.getByRole('button', { name: 'Ver todos os indicadores' }).click();
  await page.getByText('37 registros de 37').waitFor();
}));

test('links legados e cópia de perguntas continuam funcionando', async () => withPage(async page => {
  await page.goto(atlas + '?scope=municipio#indicadores');
  await page.getByText('28 registros de 37').waitFor();
  await page.goto(atlas + '#direitos');
  await page.getByRole('button', { name: 'Copiar perguntas' }).click();
  await page.getByText('Perguntas copiadas.').waitFor();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^1\. Essa roça/);
  for (const city of ['vitoria', 'serra', 'colatina']) {
    assert.equal((await page.goto(site.url + 'municipios/' + city + '/')).status(), 200);
    assert.equal(new URL(page.url()).hash, '');
  }
}));

test('o relatório e o CSV incluem todos os resultados da seleção', async () => withPage(async page => {
  await page.goto(atlas + '?scope=municipio#indicadores');
  await page.getByText('28 registros de 37').waitFor();
  assert.equal(await page.locator('#dataTable tr:visible').count(), 12);
  const [download] = await Promise.all([
    page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar CSV' }).click()
  ]);
  const csv = await readFile(await download.path(), 'utf8');
  assert.equal(csv.split('\r\n').length, 29);
  assert.match(csv, /acidentes-de-trabalho-notificados-2024/);
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.screen:visible').count(), 6);
  assert.equal(await page.locator('#dataTable tr:visible').count(), 28);
}));

for (const width of [390, 320]) {
  test('navegação e leitura a ' + width + ' px', async () => withPage(async page => {
    for (const url of [site.url, site.url + 'municipios/', atlas, atlas + '?scope=victor-hugo#indicadores', atlas + '#pessoa-idosa']) {
      await page.goto(url);
      await page.waitForLoadState('load');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), url + ' ultrapassou a largura');
      if (width === 390 && url === site.url) {
        await accessibility(page);
        await screenshot(page, 'editorial-home-mobile.png');
      }
    }
  }, { width, height: 844 }));
}
