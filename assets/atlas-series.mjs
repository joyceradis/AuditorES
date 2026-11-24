import { data } from './atlas-data.mjs';

const records = new Map(data.map(row => [row.id, row]));
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export function formatReading(row) {
  const amount = number.format(row.value);
  if (row.unit === '%') return amount + '%';
  if (row.unit === 'R$') return 'R$ ' + amount;
  return amount;
}

const series = {
  trabalho: {
    title: 'Acidentes de trabalho notificados',
    context: 'Marechal Floriano · 2020–2024',
    description: 'Mudanças na captação e no registro podem afetar a comparação entre anos.',
    detail: 'As barras mostram notificações, que podem incluir mais de um registro por trabalhador.',
    source: 'Plano Municipal de Saúde 2026–2029 · tabela 56',
    link: '?scope=municipio&category=saude-do-trabalhador#indicadores',
    linkText: 'Consultar saúde do trabalhador',
    defaultIndex: 4,
    points: [2020, 2021, 2022, 2023, 2024].map(year => [String(year), 'acidentes-de-trabalho-notificados-' + year])
  },
  familias: {
    title: 'Risco familiar na ESF Victor Hugo',
    context: 'ESF Victor Hugo · agosto de 2021',
    description: 'A escala de Coelho-Savassi classifica as famílias avaliadas em quatro estratos de risco.',
    detail: 'Os dados descrevem as famílias classificadas em agosto de 2021. A série não mede a situação atual da equipe.',
    source: 'Plano Municipal de Saúde 2022–2025 · tabela 45',
    link: '?scope=victor-hugo&category=risco-familiar#indicadores',
    linkText: 'Consultar risco familiar',
    defaultIndex: 0,
    points: ['Habitual', 'Menor', 'Médio', 'Máximo'].map((label, index) =>
      [label, 'familias-em-risco-' + ['habitual', 'menor', 'medio', 'maximo'][index] + '-ago-2021']
    )
  },
  amdi: {
    title: 'Avaliação multidimensional da pessoa idosa',
    context: 'Município e meta estadual · 2025',
    description: 'O resultado divide os registros de avaliação pela população de 60 anos ou mais do Censo de 2022.',
    detail: 'O resultado é municipal. O boletim não informa a produção da ESF Victor Hugo separadamente.',
    source: 'SESA/ES · Boletim Estadual da APS 2025',
    link: '#pessoa-idosa',
    linkText: 'Consultar CMDI, AMDI e Fundo do Idoso',
    defaultIndex: 0,
    points: [['Resultado', 'indicador-amdi-2025'], ['Meta estadual', 'meta-estadual-amdi-2025']]
  }
};

export function resolveSeries(id) {
  if (!Object.hasOwn(series, id)) return null;
  const entry = series[id];
  const points = entry.points.map(([label, key]) => ({ label, row: records.get(key) }));
  if (points.some(point => !point.row)) return null;
  return { ...entry, points };
}

export function barScale(values) {
  const interval = Math.max(...values, 1) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(interval));
  const step = [1, 2, 2.5, 5, 10].map(value => value * magnitude).find(value => value >= interval);
  return [4, 3, 2, 1, 0].map(mark => Number((mark * step).toPrecision(12)));
}

export function evidenceHash(id) {
  return '#evidencia-' + id;
}
