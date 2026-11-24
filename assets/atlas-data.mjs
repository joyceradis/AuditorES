import acervo from "../site/acervo/3203346.json" with {type: "json"};
export const gov26='https://www.marechalfloriano.es.gov.br/wp-content/uploads/2026/05/PMS-2026-2029-versao-final.pdf';
export const gov22='https://www.marechalfloriano.es.gov.br/downloads/arquivos-saude/instrumentos-gestao/PMS-2022-2025-resumo-DIGISUS.pdf';
export const incaper='https://incaper.es.gov.br/Media/proater/municipios/Marechal_Floriano.pdf';
export const amdiBulletin='https://atencaoprimaria.es.gov.br/Media/AtencaoPrimaria/LinhasDeCuidados/BOLETIM%20APS%202025%20-%20validado%20%2017%20de%20abril%202026.pdf#page=22';
export const rgps = 'https://www.gov.br/previdencia/pt-br/assuntos/previdencia-social/arquivos/ben_municipios_clientela_2025.xlsx';
export const mortality = 'https://dadosabertos.saude.gov.br/dataset/sim/resource/9ade641a-1f25-40d9-b55b-cff7096eb5b4';
export const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const data = acervo.indicadores.map(row => ({
  id: row.id, label: row.indicador, value: row.valor, cat: row.categoria,
  scope: row.abrangencia, year: row.competencia, unit: row.unidade,
  source: row.fonte.titulo, url: row.fonte.url, quality: row.qualidade,
  measure: row.medida, type: row.tipo, note: row.metodo
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
