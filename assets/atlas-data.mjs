export const gov26='https://www.marechalfloriano.es.gov.br/wp-content/uploads/2026/05/PMS-2026-2029-versao-final.pdf';
export const gov22='https://www.marechalfloriano.es.gov.br/downloads/arquivos-saude/instrumentos-gestao/PMS-2022-2025-resumo-DIGISUS.pdf';
export const incaper='https://incaper.es.gov.br/Media/proater/municipios/Marechal_Floriano.pdf';
export const amdiBulletin='https://atencaoprimaria.es.gov.br/Media/AtencaoPrimaria/LinhasDeCuidados/BOLETIM%20APS%202025%20-%20validado%20%2017%20de%20abril%202026.pdf#page=22';
export const rgps = 'https://www.gov.br/previdencia/pt-br/assuntos/previdencia-social/arquivos/ben_municipios_clientela_2025.xlsx';
export const mortality = 'https://dadosabertos.saude.gov.br/dataset/sim/resource/9ade641a-1f25-40d9-b55b-cff7096eb5b4';
const entries = [
['População residente',17641,'Território','Município','2022','n','IBGE · Censo 2022 · SIDRA tabela 4714, variável 93','https://apisidra.ibge.gov.br/values/t/4714/n6/3203346/v/93/p/2022','Oficial'],
['Óbitos por residência',142,'Território','Município','2022','n','Ministério da Saúde · SIM, Mortalidade Geral 2022',mortality,'Oficial','Óbitos'],
['População estimada',19159,'Território','Município','2026','n','IBGE · Estimativa 2026; não é o Censo 2022','https://www.ibge.gov.br/cidades-e-estados/es/marechal-floriano.html','Oficial'],
['Agentes comunitários de saúde',4,'Território','ESF','2021','n','PMS 2022–2025 · Tabela 23, p. 43',gov22,'Oficial','Profissionais'],
['Pessoas cadastradas na ESF',1780,'Território','ESF','30/04/2025','n','PMS 2026–2029 · Tabela 14, p. 38',gov26,'Oficial'],
['Famílias classificadas',480,'Risco familiar','ESF','ago/2021','n','PMS 2022–2025 · Tabela 45, p. 55',gov22,'Oficial'],
['Famílias em risco habitual',403,'Risco familiar','ESF','ago/2021','n','PMS 2022–2025 · Tabela 45, p. 55',gov22,'Oficial'],
['Famílias em risco menor',41,'Risco familiar','ESF','ago/2021','n','PMS 2022–2025 · Tabela 45, p. 55',gov22,'Oficial'],
['Famílias em risco médio',20,'Risco familiar','ESF','ago/2021','n','PMS 2022–2025 · Tabela 45, p. 55',gov22,'Oficial'],
['Famílias em risco máximo',16,'Risco familiar','ESF','ago/2021','n','PMS 2022–2025 · Tabela 45, p. 55',gov22,'Oficial'],
['Estabelecimentos de agricultura familiar',626,'Agricultura','Município','2017','n','Incaper / Censo Agropecuário 2017 · Tabela 5, p. 17',incaper,'Oficial'],
['Estabelecimentos de agricultura não familiar',290,'Agricultura','Município','2017','n','Incaper / Censo Agropecuário 2017 · Tabela 5, p. 17',incaper,'Oficial'],
['Associados da APROVH',120,'Agricultura','Comunidade','2020','n','Incaper · Quadro 1, p. 19 (associação local; não equivale à ESF)',incaper,'Contexto local'],
['Hipertensão autodeclarada',5514,'Doenças crônicas','Município','2024','n','PMS 2026–2029 · Tabela 39, p. 68',gov26,'Oficial'],
['Diabetes autodeclarado',1716,'Doenças crônicas','Município','2024','n','PMS 2026–2029 · Tabela 39, p. 68',gov26,'Oficial'],
['Insuficiência cardíaca autodeclarada',126,'Doenças crônicas','Município','2024','n','PMS 2026–2029 · Tabela 39, p. 68',gov26,'Oficial'],
['Insuficiência renal autodeclarada',60,'Doenças crônicas','Município','2024','n','PMS 2026–2029 · Tabela 39, p. 68',gov26,'Oficial'],
['Asma autodeclarada',597,'Doenças crônicas','Município','2024','n','PMS 2026–2029 · Tabela 39, p. 68',gov26,'Oficial'],
['DPOC autodeclarada',44,'Doenças crônicas','Município','2024','n','PMS 2026–2029 · Tabela 39, p. 68',gov26,'Oficial'],
['Deficiência física autodeclarada',256,'Doenças crônicas','Município','2024','n','PMS 2026–2029 · Tabela 38, p. 67',gov26,'Oficial'],
['Acidentes de trabalho notificados',3,'Saúde do trabalhador','Município','2020','n','PMS 2026–2029 · Tabela 56, p. 84–85',gov26,'Oficial'],
['Acidentes de trabalho notificados',6,'Saúde do trabalhador','Município','2021','n','PMS 2026–2029 · Tabela 56, p. 84–85',gov26,'Oficial'],
['Acidentes de trabalho notificados',19,'Saúde do trabalhador','Município','2022','n','PMS 2026–2029 · Tabela 56, p. 84–85',gov26,'Oficial'],
['Acidentes de trabalho notificados',240,'Saúde do trabalhador','Município','2023','n','PMS 2026–2029 · Tabela 56, p. 84–85',gov26,'Oficial'],
['Acidentes de trabalho notificados',313,'Saúde do trabalhador','Município','2024','n','PMS 2026–2029 · Tabela 56, p. 84–85',gov26,'Oficial'],
['LER/DORT notificadas',12,'Saúde do trabalhador','Município','2024','n','PMS 2026–2029 · Tabela 56, p. 84–85',gov26,'Oficial'],
['Intoxicações exógenas relacionadas ao trabalho',13,'Saúde do trabalhador','Município','2024','n','PMS 2026–2029 · Tabela 56, p. 84–85',gov26,'Oficial'],
['Absenteísmo — consulta cirurgia vascular',29.03,'Acesso','Município','2024','%','PMS 2026–2029 · Tabela 50, p. 76–77',gov26,'Oficial'],
['Absenteísmo — consulta cirurgia geral',23.26,'Acesso','Município','2024','%','PMS 2026–2029 · Tabela 50, p. 76–77',gov26,'Oficial'],
['Absenteísmo — consulta cardiologia',18.63,'Acesso','Município','2024','%','PMS 2026–2029 · Tabela 50, p. 76–77',gov26,'Oficial'],
['HbA1c avaliadas / solicitadas',38.98,'Acesso','Município','2024','%','PMS 2026–2029 · Tabela 41, p. 69',gov26,'Oficial'],
['Benefícios do RGPS emitidos',3810,'Proteção social','Município','dez/2025','n','Ministério da Previdência · Emitidos_2025, célula G919',rgps,'Oficial','Créditos para pagamento'],
['Benefícios rurais do RGPS emitidos',2145,'Proteção social','Município','dez/2025','n','Ministério da Previdência · Emitidos_2025, célula I919',rgps,'Oficial','Créditos para pagamento'],
['População com 60 anos ou mais',2879,'Pessoa idosa','Município','2022','n','SESA/ES · Boletim APS 2025, tabela AMDI · população IBGE 2022',amdiBulletin,'Oficial'],
['Avaliações multidimensionais da pessoa idosa — produção',37,'Pessoa idosa','Município','2025','n','SESA/ES · Boletim APS 2025, tabela AMDI; produção, não pessoas únicas',amdiBulletin,'Oficial'],
['Indicador AMDI',1.29,'Pessoa idosa','Município','2025','%','SESA/ES · Boletim APS 2025, tabela AMDI; produção/população 60+',amdiBulletin,'Oficial'],
['Meta estadual AMDI',20,'Pessoa idosa','Espírito Santo','2025','%','SESA/ES · Boletim APS 2025, meta de referência, não resultado',amdiBulletin,'Meta'],
];

const readingNotes = {
  'Território': 'Use a unidade, o recorte e a data da própria tabela. O total censitário e o cadastro da equipe têm bases próprias.',
  'Risco familiar': 'Classificação pelo método Coelho-Savassi. A referência são as 480 famílias classificadas da ESF Victor Hugo em agosto de 2021.',
  'Agricultura': 'Estabelecimentos agropecuários e associados são unidades diferentes. Nenhuma delas mede a população cadastrada na ESF.',
  'Doenças crônicas': 'Condição autodeclarada registrada no cadastro individual e-SUS APS. A contagem não estima prevalência, cobertura ou diagnóstico confirmado.',
  'Saúde do trabalhador': 'Contagem de notificações do e-SUS Vigilância. Mudanças na captação e no registro podem afetar a série.',
  'Acesso': 'Percentual informado pelo plano municipal para o procedimento e período indicados. Cada procedimento tem denominador próprio.',
  'Proteção social': 'A unidade territorial de pagamento e a competência são as da base publicadora.',
  'Pessoa idosa': 'Referência populacional de 2.879 residentes com 60 anos ou mais no Censo 2022. A produção do SISAB corresponde a registros, incluindo a possibilidade de avaliações repetidas.'
};

const specificNotes = {
  'Benefícios do RGPS emitidos': 'A planilha conta créditos no município do órgão pagador em dezembro de 2025. A contagem não mede moradores beneficiários nem pessoas únicas.',
  'Benefícios rurais do RGPS emitidos': 'Os créditos rurais são parte do total de 3.810 emitidos no município do órgão pagador. Somar os dois registros contaria os créditos rurais novamente.',
  'Agentes comunitários de saúde': 'Composição histórica da equipe Victor Hugo em 2021, conforme a coluna de agentes comunitários de saúde na tabela 23 do plano.',
  'Óbitos por residência': 'Total de óbitos não fetais, de todas as causas, com residência em Marechal Floriano em 2022. Na base oficial, filtre CODMUNRES 320334, TIPOBITO 2 e o ano de DTOBITO. A contagem não é uma taxa.',
  'População estimada': 'Estimativa exibida pelo IBGE. O ano informado segue a ficha do município. A contagem censitária de 2022 aparece em ficha própria.',
  'Associados da APROVH': 'Quantidade informada para a associação de produtores rurais de Victor Hugo no quadro de associações de 2020.',
  'HbA1c avaliadas / solicitadas': 'O plano registra 626 exames avaliados entre 1.606 solicitações na rede municipal de ESF, em 2024.',
  'Meta estadual AMDI': 'Parâmetro estadual de 2025 para comparação com o resultado municipal de 1,29%. Não há resultado de AMDI da ESF Victor Hugo nesta base.',
  'Indicador AMDI': 'Produção municipal de 37 registros dividida por 2.879 residentes com 60 anos ou mais, segundo o boletim. Extração SISAB em 11/02/2026.'
};

export const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const keyOf = text => normalize(text).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function documentPage(source, url) {
  const printedPage = source.match(/p\. (\d+)/)?.[1];
  if (!printedPage || (url !== gov26 && url !== gov22 && url !== incaper)) return url;
  // No PMS 2026–2029, o PDF tem duas folhas antes da paginação impressa.
  const offset = url === gov26 ? 2 : 0;
  return url + '#page=' + (Number(printedPage) + offset);
}

export const data = entries.map(([label, value, cat, scope, year, unit, source, url, quality, measure]) => ({
  id: keyOf(label + '-' + year),
  label, value, cat, scope, year, unit, source, quality,
  measure: measure || (unit === '%' ? 'Percentual' : ({
    'Risco familiar': 'Famílias classificadas',
    'Saúde do trabalhador': 'Notificações',
    'Doenças crônicas': 'Cadastros com autodeclaração',
    'Agricultura': scope === 'Comunidade' ? 'Associados' : 'Estabelecimentos agropecuários',
    'Pessoa idosa': label.includes('produção') ? 'Registros de avaliação' : 'Pessoas',
    'Território': 'Pessoas'
  })[cat] || 'Contagem'),
  url: documentPage(source, url),
  type: quality === 'Meta' ? 'Meta' : label === 'População estimada' || scope === 'Comunidade' ? 'Contexto' : 'Resultado',
  note: specificNotes[label] || readingNotes[cat]
}));

export const calendarYear = row => row.year.slice(-4);
export const scopeLabels = {
  'Município': 'Município', 'ESF': 'ESF Victor Hugo', 'Comunidade': 'Comunidade', 'Espírito Santo': 'Espírito Santo'
};
export const typeLabels = { Resultado: 'Resultado observado', Contexto: 'Referência de contexto', Meta: 'Meta' };

export function filterRows({ category = '', scope = '', year = '', type = '', query = '' }) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return data.filter(row => {
    const searchable = normalize([row.label, row.cat, scopeLabels[row.scope], row.year, row.source, typeLabels[row.type]].join(' '));
    return (!category || row.cat === category) && (!scope || row.scope === scope)
      && (!year || calendarYear(row) === year) && (!type || row.type === type)
      && terms.every(term => searchable.includes(term));
  });
}
