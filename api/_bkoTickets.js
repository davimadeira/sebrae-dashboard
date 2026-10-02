import { createHash } from 'node:crypto';
import { getBkoFields } from './_bkoFields.js';

const fail = (message, statusCode = 400) => { throw Object.assign(new Error(message), { statusCode }); };
const column = index => { let result = ''; for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result; return result; };
const versionOf = data => createHash('sha256').update(JSON.stringify(data)).digest('hex');

export async function tickets(req, res, { base, headers, schema, request, user }) {
  const read = async (range, formula = false) => {
    const response = await request(`${base}${encodeURIComponent(range)}?valueRenderOption=${formula ? 'FORMULA' : 'FORMATTED_VALUE'}`, { headers });
    if (!response.ok) fail('Não foi possível consultar os chamados. Tente novamente.', 503);
    return (await response.json()).values || [];
  };
  const end = column(schema.length - 1);
  const normalize = row => schema.map((_, i) => String(row?.[i] ?? ''));
  const getRow = async row => {
    if (!Number.isSafeInteger(row) || row < 2) fail('Chamado inválido.');
    const range = `Preenchimento!A${row}:${end}${row}`;
    const [display, formulas] = await Promise.all([read(range), read(range, true)]);
    const values = normalize(display[0]), raw = normalize(formulas[0]);
    if (!values[0]) fail('Chamado não encontrado. Atualize a lista.', 404);
    return { row, values, version: versionOf({ values, raw }), calculated: raw.map((value, i) => value.startsWith('=') || schema[i] === 'Status Ticket'), raw };
  };
  if (req.method === 'GET' && req.query?.mode === 'tickets') {
    const query = String(req.query.q || '').trim().toLocaleLowerCase('pt-BR');
    const status = String(req.query.status || '');
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const rows = await read(`Preenchimento!A2:${end}`);
    const records = rows.map((values, i) => ({ row: i + 2, values: normalize(values) })).filter(record => record.values[0] && !record.values[0].startsWith('#'));
    const filtered = records.filter(({ values }) => (!status || values[12] === status) && (!query || [0, 4, 5, 7, 16].some(i => values[i]?.toLocaleLowerCase('pt-BR').includes(query)))).reverse();
    return res.status(200).json({ records: filtered.slice((page - 1) * 30, page * 30), total: filtered.length, page, pages: Math.max(1, Math.ceil(filtered.length / 30)) });
  }
  if (req.method === 'GET') {
    const { raw, ...record } = await getRow(Number(req.query.row));
    return res.status(200).json({ record });
  }
  const { row, version, changes, columns } = req.body || {};
  if (JSON.stringify(columns) !== JSON.stringify(schema)) fail('As colunas mudaram. Reabra o chamado.', 409);
  if (!Array.isArray(changes) || !changes.length || changes.length > schema.length) fail('Nenhuma alteração válida para salvar.');
  const current = await getRow(row);
  if (version !== current.version) fail('Este chamado foi alterado desde que você o abriu. Volte à lista e abra novamente para conferir os dados atuais.', 409);
  const fields = await getBkoFields(base, headers, schema, request);
  const seen = new Set();
  const data = changes.map(({ index, value }) => {
    if (!Number.isInteger(index) || index < 0 || index >= schema.length || seen.has(index) || typeof value !== 'string' || value.length > 10000) fail('Alteração inválida.');
    seen.add(index);
    if (index === 0 || current.calculated[index]) fail('Protocolo e campos calculados não podem ser alterados.');
    const field = fields[index];
    value = value.trim();
    if (value && field.strict && field.options.length && !field.options.includes(value)) fail(`Selecione uma opção válida em ${field.name}.`);
    if (value && field.type === 'date') {
      const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
      const date = match && new Date(+match[3], +match[2] - 1, +match[1]);
      if (!match || date.getFullYear() !== +match[3] || date.getMonth() !== +match[2] - 1 || date.getDate() !== +match[1]) fail(`Informe uma data válida em ${field.name}.`);
    }
    return { range: `Preenchimento!${column(index)}${row}`, values: [[value]] };
  });
  const response = await request(`${base.slice(0, -1)}:batchUpdate`, { method: 'POST', headers, body: JSON.stringify({ valueInputOption: 'RAW', data }) });
  if (!response.ok) fail('Não foi possível confirmar a atualização. Confira o chamado antes de tentar novamente.', 503);
  console.info('bko_record_updated', { uid: user.uid, row, columns: [...seen], updatedAt: new Date().toISOString() });
  return res.status(200).json({ ok: true, range: `Preenchimento!A${row}:${end}${row}` });
}
