const requireBko = async req => (await import('./_firebaseAdmin.js')).requireBko(req);
const getSheetsAccessToken = async () => (await import('./_firebaseAdmin.js')).getSheetsAccessToken();

const sheetId = '1sq5V2qrF91laGglRf6CByHOl5w6SnlVcTyGxNBZ63nw';
const base = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/`;

export const createHandler = (authorize = requireBko, getToken = getSheetsAccessToken, request = fetch) => async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Método não permitido.' });
  try {
    const user = await authorize(req);
    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const schemaResponse = await request(`${base}${encodeURIComponent('Preenchimento!1:1')}`, { headers });
    if (!schemaResponse.ok) throw Object.assign(new Error('Não foi possível acessar a planilha. Verifique a permissão da conta de serviço.'), { statusCode: 503 });
    const schema = (await schemaResponse.json()).values?.[0];
    if (!schema?.length || !schema[0]) throw Object.assign(new Error('A planilha precisa ter cabeçalhos válidos.'), { statusCode: 409 });
    if (req.method === 'GET') return res.status(200).json({ headers: schema });
    const { columns, values } = req.body || {};
    if (JSON.stringify(columns) !== JSON.stringify(schema)) return res.status(409).json({ error: 'As colunas da planilha mudaram. Feche e abra o formulário novamente.' });
    if (!Array.isArray(values) || values.length !== schema.length || values.some(v => typeof v !== 'string' || v.length > 10000)) {
      return res.status(400).json({ error: 'Preencha os campos corretamente (até 10.000 caracteres por campo).' });
    }
    if (!values[0].trim() || values[0].trim() === '#VALOR!') return res.status(400).json({ error: `Preencha ${schema[0]}.` });
    if (values.some((v, i) => !schema[i] && v)) return res.status(400).json({ error: 'Uma coluna sem título não pode receber dados.' });
    // RAW mantém protocolos, zeros iniciais e textos como digitados, sem executar fórmulas.
    const response = await request(`${base}${encodeURIComponent('Preenchimento')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: 'POST', headers, body: JSON.stringify({ majorDimension: 'ROWS', values: [values.map(v => v.trim())] }),
    });
    if (!response.ok) return res.status(503).json({ error: 'Não foi possível salvar. Verifique a planilha antes de tentar novamente.' });
    const result = await response.json();
    console.info('bko_record_created', { uid: user.uid, createdAt: new Date().toISOString(), range: result.updates?.updatedRange });
    return res.status(201).json({ ok: true });
  } catch (error) {
    return res.status(error.statusCode || 503).json({ error: error.statusCode ? error.message : 'Não foi possível confirmar a operação. Verifique a planilha antes de tentar novamente.' });
  }
};

export default createHandler();
