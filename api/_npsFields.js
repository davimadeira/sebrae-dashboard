import { columnName, quotedTab, sheetError } from './_sheetRows.js';
import { identityIndexes, normalizedHeader } from '../src/utils/npsSchema.js';
export async function npsFields(root, headers, columns, request, records, formulas) {
  const response = await request(`${root}?ranges=${encodeURIComponent(`${quotedTab('NPS')}!A2:${columnName(columns.length - 1)}50`)}&fields=sheets(data(rowData(values(dataValidation))))`, { headers });
  if (!response.ok) throw sheetError('Não foi possível carregar as opções do NPS. Atualize a página.');
  const rows = (await response.json()).sheets?.[0]?.data?.[0]?.rowData || [];
  const { date } = identityIndexes(columns);
  const cache = new Map();
  return Promise.all(columns.map(async (name, index) => {
    const validation = rows.map(row => row.values?.[index]?.dataValidation).find(Boolean);
    const condition = validation?.condition;
    let options = condition?.type === 'ONE_OF_LIST' ? condition.values.map(v => v.userEnteredValue) : [];
    if (condition?.type === 'ONE_OF_RANGE') {
      const range = condition.values[0].userEnteredValue.replace(/^=/, '');
      if (!cache.has(range)) cache.set(range, (async () => { const r = await request(`${root}/values/${encodeURIComponent(range)}`, { headers }); if (!r.ok) throw sheetError(`Não foi possível carregar opções de ${name}.`); return (await r.json()).values?.flat() || []; })());
      options = await cache.get(range);
    }
    if (!condition && /status|perfil|forma de contato|canal|operador|sucesso|respondido|encaminhamento/i.test(name)) options = [...new Set(records.map(r => r.values[index]).filter(Boolean))].slice(0, 100);
    const calculated = index === date || normalizedHeader(name) === 'prazofinal' && formulas.some(row => String(row[index] || '').startsWith('='));
    return { name, options: [...new Set(options.map(String).filter(Boolean))], strict: validation?.strict === true && ['ONE_OF_LIST', 'ONE_OF_RANGE'].includes(condition?.type), type: calculated ? 'calculated' : /^data|prazo/i.test(name) ? 'date' : /coment|descri|detalha|conclusão do retorno/i.test(name) ? 'textarea' : 'text' };
  }));
}
