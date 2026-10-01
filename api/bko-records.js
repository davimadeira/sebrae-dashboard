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
    if (!schemaResponse.ok) {
      const detail = await schemaResponse.json().catch(() => ({}));
      const reason = detail.error?.details?.find(item => item.reason)?.reason || '';
      console.error('bko_sheet_access_failed', { status: schemaResponse.status, reason, message: detail.error?.message });
      const account = process.env.GCP_SERVICE_ACCOUNT_EMAIL || 'a conta de serviço configurada';
      const message = reason === 'SERVICE_DISABLED'
        ? 'A API Google Sheets está desativada no projeto Google Cloud da conta de serviço. Ative-a para continuar.'
        : reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT'
          ? 'A conexão Google não tem o escopo necessário para acessar planilhas.'
          : schemaResponse.status === 403 || schemaResponse.status === 404
            ? `Compartilhe a planilha do BKO com ${account} como Editor. Depois, abra este formulário novamente.`
            : 'Não foi possível acessar a planilha. Tente novamente em instantes.';
      throw Object.assign(new Error(message), { statusCode: 503 });
    }
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
