const authorize = async req => (await import('./_firebaseAdmin.js')).requireBko(req);
const accessToken = async () => (await import('./_firebaseAdmin.js')).getSheetsAccessToken();
export const createHandler = (auth = authorize, token = accessToken, request = fetch) => async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    await auth(req);
    const response = await request('https://sheets.googleapis.com/v4/spreadsheets/1sq5V2qrF91laGglRf6CByHOl5w6SnlVcTyGxNBZ63nw/values/Tratativa?valueRenderOption=FORMATTED_VALUE', { headers: { Authorization: `Bearer ${await token()}` } });
    if (!response.ok) return res.status(503).json({ error: 'Não foi possível carregar a aba Tratativa. Tente novamente.' });
    const { values = [] } = await response.json();
    const headers = values[0] || [];
    if (!headers.length) return res.status(409).json({ error: 'A aba Tratativa precisa ter cabeçalhos.' });
    const records = values.slice(1).map((row, i) => ({ row: i + 2, values: headers.map((_, index) => String(row[index] ?? '')) })).filter(record => record.values.some(value => value.trim()));
    return res.status(200).json({ headers, records });
  } catch (error) {
    return res.status(error.statusCode || 503).json({ error: error.statusCode ? error.message : 'Não foi possível carregar as tratativas.' });
  }
};
export default createHandler();
