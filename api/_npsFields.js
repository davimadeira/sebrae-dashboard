import { columnName, quotedTab, sheetError } from './_sheetRows.js';
import { identityIndexes, normalizedHeader } from '../src/utils/npsSchema.js';
export function validationRange(value) {
  const range = String(value || '').replace(/^=/, '').trim();
  if (!range || /#REF!/i.test(range)) return null;
  // A1 references without a sheet belong to NPS, not the workbook's first tab.
  return !range.includes('!') && /^\$?[A-Z]+(?:\$?\d+)?(?::\$?[A-Z]+(?:\$?\d+)?)?$/i.test(range) ? `${quotedTab('NPS')}!${range}` : range;
}
export async function npsFields(root, headers, columns, request, records, formulas) {
  const response = await request(`${root}?ranges=${encodeURIComponent(`${quotedTab('NPS')}!A2:${columnName(columns.length - 1)}50`)}&fields=sheets(data(rowData(values(dataValidation))))`, { headers });
  if (!response.ok) throw sheetError('Não foi possível carregar as opções do NPS. Atualize a página.');
  const rows = (await response.json()).sheets?.[0]?.data?.[0]?.rowData || [];
  const { date } = identityIndexes(columns);
  const cache = new Map();
  return Promise.all(columns.map(async (name, index) => {
    const validation = rows.map(row => row.values?.[index]?.dataValidation).find(Boolean);
    const condition = validation?.condition;
    let optionsError = '';
    let options = condition?.type === 'ONE_OF_LIST' ? (condition.values || []).map(v => v.userEnteredValue) : [];
    if (condition?.type === 'ONE_OF_RANGE') {
      const range = validationRange(condition.values?.[0]?.userEnteredValue);
      if (!cache.has(range)) cache.set(range, (async () => {
        if (!range) return { error: 'A lista aponta para uma referência inválida na planilha. Corrija a validação de dados dessa coluna no Google Planilhas.' };
        try {
          const r = await request(`${root}/values/${encodeURIComponent(range)}`, { headers });
          if (!r.ok) return { error: [400, 404].includes(r.status) ? 'O intervalo da lista não foi encontrado nesta planilha. Confira se a aba ou intervalo de origem também foi copiado para o arquivo NPS.' : 'Não foi possível consultar a lista. Confira o acesso à origem e tente atualizar.' };
          const values = (await r.json()).values?.flat() || [];
          return values.length ? { values } : { error: 'A lista de opções está vazia na planilha. Preencha o intervalo de origem e atualize.' };
        } catch { return { error: 'A consulta da lista falhou. Tente atualizar novamente.' }; }
      })());
      const result = await cache.get(range);
      options = result.values || []; optionsError = result.error || '';
    }
    if (!condition && /status|perfil|forma de contato|canal|operador|sucesso|respondido|encaminhamento/i.test(name)) options = [...new Set(records.map(r => r.values[index]).filter(Boolean))].slice(0, 100);
    const calculated = index === date || normalizedHeader(name) === 'prazofinal' && formulas.some(row => String(row[index] || '').startsWith('='));
    return { name, options: [...new Set(options.map(String).filter(Boolean))], ...(optionsError ? { optionsError } : {}), strict: validation?.strict === true && ['ONE_OF_LIST', 'ONE_OF_RANGE'].includes(condition?.type), type: calculated ? 'calculated' : /^data|prazo/i.test(name) ? 'date' : /coment|descri|detalha|conclusão do retorno/i.test(name) ? 'textarea' : 'text' };
  }));
}
