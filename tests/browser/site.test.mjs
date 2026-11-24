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

async function withPage(run, viewport = { width: 1280, height: 900 }, options = {}) {
  const context = await browser.newContext({
    viewport,
    permissions: ['clipboard-read', 'clipboard-write'],
    ...options
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(8500);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      const type = response.request().resourceType();
      if (response.status() >= 400 && response.url().startsWith(site.url) &&
          ['stylesheet', 'script', 'image', 'font'].includes(type)) {
        errors.push(`${response.status()} ao carregar ${type}: ${response.url()}`);
      }
    });
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
    await page.screenshot({
      path: join(process.env.AUDITORES_SCREENSHOTS, filename),
      animations: 'disabled'
    });
  }
}

async function sansTypography(locator) {
  const font = await locator.evaluate(element => getComputedStyle(element).fontFamily);
  const families = font.split(',').map(family => family.trim().replace(/^["']|["']$/g, '').toLowerCase());
  assert.equal(families.some(family => ['serif', 'georgia', 'cambria', 'times new roman'].includes(family)), false,
    `a tipografia desta seção deve ser sem serifa, mas a pilha resolve para ${font}`);
}

async function entrance(page) {
  const main = page.getByRole('main');
  const heading = main.getByRole('heading', { level: 1 });
  assert.match(await heading.innerText(), /Gestão municipal\s+de saúde/);
  await main.getByRole('heading', { name: 'Cobertura documental' }).waitFor();
  assert.equal(await main.locator('.tiles i').count(), 78);
  await sansTypography(heading);
}

test('a matriz estadual permite consultar os 78 municípios sem seleção inicial', async () => withPage(async page => {
  await page.goto(site.url);
  await entrance(page);
  await screenshot(page, 'dashboard-desktop.png');
  await accessibility(page);
  assert.equal(await page.locator('.matrix tbody tr:visible').count(), 8);
  await page.getByRole('button', { name: /Próxima/ }).click();
  await page.getByText('Página 2 de 10').waitFor();
  await page.getByLabel('Disponibilidade').selectOption('contratos');
  assert.equal(await page.locator('.matrix tbody tr:visible').count(), 4);
  await page.getByLabel('Município ou código IBGE').fill('3203346');
  await page.getByRole('link', { name: 'Consultar metas' }).click();
  await page.getByRole('heading', { name: 'Metas da PAS' }).waitFor();
  assert.equal(await page.getByRole('cell', { name: 'Sem apuração' }).count(), 4);
}));
test('da visualização à ficha, com as séries e fontes corretas', async () => withPage(async page => {
  await page.goto(atlas + '#visao-geral');
  await page.locator('#reading-desk').waitFor();
  assert.equal(await page.locator('#reading-value').innerText(), '313');
  await sansTypography(page.locator('#reading-value'));
  await sansTypography(page.locator('#reading-desk').getByRole('heading').first());
  await accessibility(page);
  await screenshot(page, 'redesign-home-desktop.png');
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
  await screenshot(page, 'redesign-dossier.png');
  await page.keyboard.press('Escape');
  await page.waitForURL('**/#visao-geral');
}));

test('busca, atalhos de recorte e exportação trabalham sobre a mesma consulta', async () => withPage(async page => {
  await page.goto(atlas);
  await page.getByLabel('Buscar nos indicadores de saúde').fill('risco');
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
  await screenshot(page, 'redesign-explorer.png');
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
  assert.equal(await page.locator('.screen:visible').count(), 8);
  assert.equal(await page.locator('#dataTable tr:visible').count(), 28);
}));

const municipalNavigation = [
  ['Visão geral', '#visao-geral'],
  ['Atenção Primária (APS)', '#indicadores'],
  ['Contratos e OS', '#contratos'],
  ['Fontes e limites', '#fontes']
];

const municipalRoutes = [
  { slug: 'marechal-floriano', title: 'Marechal Floriano', source: 'www.marechalfloriano.es.gov.br' },
  { slug: 'vitoria', title: 'Vitória', source: 'cartadeservicos.vitoria.es.gov.br' },
  { slug: 'serra', title: 'Serra', source: 'www.serra.es.gov.br' },
  { slug: 'colatina', title: 'Colatina', source: 'www.colatina.es.gov.br' },
  { slug: 'afonso-claudio', title: 'Afonso Cláudio' }
];

test('o catálogo estadual oferece as 78 rotas e busca com ou sem acentos', async () => withPage(async page => {
  await page.goto(site.url + 'municipios/');
  const entries = page.locator('[data-municipality]');
  assert.equal(await entries.count(), 78);
  const search = page.getByLabel('Buscar município');
  await search.fill('afonso claudio');
  await page.waitForFunction(() => [...document.querySelectorAll('[data-municipality]')]
    .filter(entry => entry.getClientRects().length > 0).length === 1);
  await page.getByRole('link', { name: /Afonso Cláudio/ }).click();
  assert.equal(page.url(), site.url + 'municipios/afonso-claudio/');
  await page.getByRole('heading', { name: 'Afonso Cláudio', level: 1 }).waitFor();
}));

test('os municípios compartilham as mesmas seções e separam dados publicados de lacunas', async () => withPage(async page => {
  for (const { slug, title, source } of municipalRoutes) {
    const url = site.url + 'municipios/' + slug + '/';
    assert.equal((await page.goto(url)).status(), 200);
    assert.equal(page.url(), url);
    await page.getByRole('heading', { name: title, level: 1, exact: true }).waitFor();
    const navigation = page.getByRole('navigation', { name: 'Seções do município' });
    const links = navigation.getByRole('link');
    for (const [index, [name, hash]] of municipalNavigation.entries()) {
      const link = links.nth(index).and(navigation.getByRole('link', { name, exact: true }));
      await link.waitFor();
      assert.equal(new URL(await link.getAttribute('href'), url).hash, hash);
    }
    await navigation.getByRole('link', { name: 'Atenção Primária (APS)', exact: true }).click();
    if (slug === 'marechal-floriano') {
      await page.getByText('37 registros de 37').waitFor();
    } else {
      await page.getByRole('heading', { name: 'Atenção Primária (APS)', exact: true }).waitFor();
      await page.getByText('Indicadores aguardando publicação', { exact: true }).filter({ visible: true }).first().waitFor();
      assert.equal(await page.locator('#dataTable tr:visible').count(), 0);
    }
    await navigation.getByRole('link', { name: 'Contratos e OS', exact: true }).click();
    const contracts = page.locator('#screen-contratos');
    await contracts.waitFor();
    const contractText = await contracts.innerText();
    assert.equal(/PA São Pedro/.test(contractText), slug === 'vitoria');
    assert.doesNotMatch(contractText, /R\$\s*(?:0\b|649[.,]999\b|5,41\s*M|65,00\s*M)|\b(?:0|12|76)\s*%/i);
    if (source) {
      await navigation.getByRole('link', { name: 'Fontes e limites', exact: true }).click();
      const official = page.locator(`a[href^="https://${source}/"]:visible`);
      await official.first().waitFor();
    }
  }
}));

test('as âncoras antigas de Vitória levam a conteúdo útil e o ATLAS mantém sua ficha por URL', async () => withPage(async page => {
  const vitoria = site.url + 'municipios/vitoria/';
  for (const hash of ['#pa', '#status', '#plataforma', '#impacto']) {
    await page.goto(vitoria + hash);
    await page.locator(hash).waitFor();
    const contracts = page.locator('#screen-contratos');
    await contracts.waitFor();
    assert.match(await contracts.innerText(), /PA São Pedro/);
  }
  const matrix = page.getByRole('table', { name: /matriz de execução.*sem registros conferidos/i });
  await matrix.getByRole('columnheader', { name: 'Previsto' }).waitFor();
  await matrix.getByRole('columnheader', { name: 'Comprovado' }).waitFor();
  await matrix.getByRole('cell', { name: /Nenhuma obrigação/ }).waitFor();
  await page.goto(vitoria + '#documentos');
  await page.locator('a[href^="https://cartadeservicos.vitoria.es.gov.br/"]:visible').first().waitFor();

  await page.goto(atlas + '#aps');
  await page.getByText('37 registros de 37').waitFor();
  assert.equal(new URL(page.url()).hash, '#aps');

  await page.goto(atlas + '#evidencia-meta-estadual-amdi-2025');
  await page.getByRole('dialog').getByRole('heading', { name: 'Meta estadual AMDI' }).waitFor();
  await page.keyboard.press('Escape');
  await page.waitForURL('**/#aps');
  await page.getByText('37 registros de 37').waitFor();
}));

test('a estrutura municipal e suas âncoras também funcionam sem JavaScript', async () => withPage(async page => {
  for (const { slug, title } of municipalRoutes) {
    const url = site.url + 'municipios/' + slug + '/';
    await page.goto(url);
    await page.getByRole('heading', { name: title, level: 1, exact: true }).waitFor();
    const navigation = page.getByRole('navigation', { name: 'Seções do município' });
    for (const [name, hash] of municipalNavigation) {
      await navigation.getByRole('link', { name, exact: true }).click();
      assert.equal(new URL(page.url()).hash, hash);
      await page.locator(hash).waitFor();
    }
  }
}, undefined, { javaScriptEnabled: false }));

for (const width of [390, 320]) {
  test('navegação e leitura a ' + width + ' px', async () => withPage(async page => {
    const otherCities = municipalRoutes.filter(({ slug }) => slug !== 'marechal-floriano')
      .map(({ slug }) => site.url + 'municipios/' + slug + '/');
    for (const url of [site.url, site.url + 'municipios/', atlas, atlas + '?scope=victor-hugo#indicadores', atlas + '#pessoa-idosa', ...otherCities]) {
      await page.goto(url);
      await page.waitForLoadState('load');
      const layout = await page.evaluate(() => {
        const width = document.documentElement.scrollWidth;
        const outside = width > innerWidth
          ? [...document.querySelectorAll('main *, .atlas-hero *, header *, nav *')]
            .filter(node => node.getBoundingClientRect().right > innerWidth)
            .slice(0, 8).map(node => node.id || String(node.className) || node.tagName)
          : [];
        return { width, outside };
      });
      assert(layout.width <= width, `${url} ocupou ${layout.width}px em ${width}px (${layout.outside.join(', ')})`);
      if (url === site.url) {
        await entrance(page);
        if (width === 390) await accessibility(page);
        await screenshot(page, `redesign-home-mobile-${width}.png`);
      }
    }
  }, { width, height: 844 }));
}
