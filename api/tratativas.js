import { createHash } from 'node:crypto';
import { insertAfterRecords, columnName, quotedTab, sheetError } from './_sheetRows.js';
import { npsFields } from './_npsFields.js';
import { identityIndexes } from '../src/utils/npsSchema.js';
const authorize = async req => (await import('./_firebaseAdmin.js')).requireBko(req);
const accessToken = async () => (await import('./_firebaseAdmin.js')).getSheetsAccessToken();
const root = 'https://sheets.googleapis.com/v4/spreadsheets/1L77GtPqjvdchT7CxMBW-zoT1ZGrP7S9u5zJPzPKb-zU';
const versionOf = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function automaticDate(values, columns, now = new Date()) {
  const ids = identityIndexes(columns);
  if (Object.values(ids).some(i => i < 0)) throw sheetError('Confira os cabeçalhos de data de início, nome, CPF e ID Genesys na aba NPS.', 409);
  if (values[ids.date]?.trim() || ![ids.name, ids.cpf, ids.genesys].every(i => values[i]?.trim())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = type => Number(parts.find(p => p.type === type).value);
  return { index: ids.date, cell: { userEnteredValue: { numberValue: Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) / 86400000 + 25569 }, userEnteredFormat: { numberFormat: { type: 'DATE_TIME', pattern: 'dd/mm/yyyy hh:mm:ss' } } } };
}
export const createHandler = (auth = authorize, token = accessToken, request = fetch, fieldsLoader = npsFields) => async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) return res.status(405).json({ error: 'Método não permitido.' });
  try {
    await auth(req);
    const headers = { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' };
    const read = async formula => {
      const response = await request(`${root}/values/NPS?valueRenderOption=${formula ? 'FORMULA' : 'FORMATTED_VALUE'}`, { headers });
      if (!response.ok) throw sheetError([403, 404].includes(response.status) ? `Compartilhe a planilha NPS com ${process.env.GCP_SERVICE_ACCOUNT_EMAIL || 'dashboard-admin@sebrae-fc1b9.iam.gserviceaccount.com'} como Editor.` : 'Não foi possível acessar a aba NPS. Confira o nome da aba e tente novamente.');
      return (await response.json()).values || [];
    };
    const [display, raw] = await Promise.all([read(false), read(true)]);
    const columns = display[0] || [];
    if (!columns.length) throw sheetError('A aba NPS precisa ter cabeçalhos.', 409);
    const normalize = row => columns.map((_, i) => String(row?.[i] ?? ''));
    const dateIndex = identityIndexes(columns).date;
    const records = display.slice(1).map((row, i) => {
      const values = normalize(row), formula = normalize(raw[i + 1]);
      return { row: i + 2, values, version: versionOf({ values, formula }), calculated: formula.map((v, c) => v.startsWith('=') || c === dateIndex) };
    }).filter(record => record.values.some((value, i) => i !== dateIndex && !record.calculated[i] && value.trim()));
    const fields = await fieldsLoader(root, headers, columns, request, records, raw.slice(1));
    if (req.method === 'GET') return res.status(200).json({ headers: columns, records, fields });
    const body = req.body || {};
    if (JSON.stringify(body.columns) !== JSON.stringify(columns)) throw sheetError('As colunas mudaram. Atualize a página antes de salvar.', 409);
    const existing = req.method === 'PATCH' ? records.find(r => r.row === body.row) : null;
    if (req.method === 'PATCH' && (!existing || existing.version !== body.version)) throw sheetError('O registro mudou desde a abertura. Volte à lista e abra novamente.', 409);
    const values = existing ? [...existing.values] : body.values;
    const changes = existing ? body.changes : (Array.isArray(values) ? values.map((value, index) => ({ index, value })) : null);
    if (!Array.isArray(values) || values.length !== columns.length || !Array.isArray(changes) || !changes.length || changes.length > columns.length) throw sheetError('Preencha os campos corretamente.', 400);
    const seen = new Set();
    for (const { index, value } of changes) {
      if (!Number.isInteger(index) || index < 0 || index >= columns.length || seen.has(index) || typeof value !== 'string' || value.length > 10000) throw sheetError('Alteração inválida.', 400);
      seen.add(index);
      const field = fields[index];
      if (field.optionsError && value.trim() !== (existing?.values[index] || '').trim()) throw sheetError(`A lista de ${field.name} está indisponível. Atualize após corrigir a origem na planilha.`, 400);
      if (field.type === 'calculated' || existing?.calculated[index]) { if (value.trim() && !existing || existing && value !== existing.values[index]) throw sheetError(`${field.name} é preenchido automaticamente.`, 400); continue; }
      if (!columns[index] && value.trim()) throw sheetError('Uma coluna sem título não pode receber dados.', 400);
      if (value.trim() && field.strict && !field.options.includes(value.trim()) && value !== existing?.values[index]) throw sheetError(`Selecione uma opção válida em ${field.name}.`, 400);
      if (value.trim() && field.type === 'date' && value !== existing?.values[index]) {
        const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
        const d = match && new Date(Date.UTC(+match[3], +match[2] - 1, +match[1]));
        if (!match || d.getUTCFullYear() !== +match[3] || d.getUTCMonth() !== +match[2] - 1 || d.getUTCDate() !== +match[1]) throw sheetError(`Informe uma data válida em ${field.name}.`, 400);
      }
      values[index] = value.trim();
    }
    if (!values.some((v, i) => fields[i].type !== 'calculated' && v.trim())) throw sheetError('Preencha pelo menos uma informação do registro.', 400);
    const stamp = automaticDate(values, columns);
    if (!existing) {
      const range = await insertAfterRecords({ root, tab: 'NPS', schema: columns, values, headers, request, calculated: fields.flatMap((f, i) => f.type === 'calculated' ? [i] : []), cellOverrides: stamp ? { [stamp.index]: stamp.cell } : {} });
      return res.status(201).json({ ok: true, range });
    }
    // Re-read immediately before updating; never replace an entire existing row.
    const latest = await read(false);
    if (JSON.stringify(normalize(latest[existing.row - 1])) !== JSON.stringify(existing.values)) throw sheetError('O registro foi alterado. Reabra antes de salvar.', 409);
    const metaResponse = await request(`${root}?fields=sheets(properties)`, { headers });
    if (!metaResponse.ok) throw sheetError('Não foi possível consultar a aba NPS.');
    const sheetId = (await metaResponse.json()).sheets?.find(s => s.properties.title === 'NPS')?.properties.sheetId;
    if (sheetId === undefined) throw sheetError('A aba NPS não foi encontrada.');
    const cells = changes.filter(c => !existing.calculated[c.index] && fields[c.index].type !== 'calculated').map(c => ({ index: c.index, cell: { userEnteredValue: { stringValue: values[c.index] } } }));
    if (stamp) cells.push(stamp);
    const requests = cells.map(({ index, cell }) => ({ updateCells: { range: { sheetId, startRowIndex: existing.row - 1, endRowIndex: existing.row, startColumnIndex: index, endColumnIndex: index + 1 }, rows: [{ values: [cell] }], fields: cell.userEnteredFormat ? 'userEnteredValue,userEnteredFormat.numberFormat' : 'userEnteredValue' } }));
    const saved = await request(`${root}:batchUpdate`, { method: 'POST', headers, body: JSON.stringify({ requests }) });
    if (!saved.ok) throw sheetError('Não foi possível confirmar a atualização. Confira a lista antes de tentar novamente.');
    return res.status(200).json({ ok: true, range: `${quotedTab('NPS')}!A${existing.row}:${columnName(columns.length - 1)}${existing.row}` });
  } catch (error) { return res.status(error.statusCode || 503).json({ error: error.statusCode ? error.message : 'Não foi possível confirmar a operação. Confira a lista antes de tentar novamente.' }); }
};
export default createHandler();
