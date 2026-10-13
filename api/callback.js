import { callbackMetrics } from './_callbackMetrics.js';

const spreadsheetId = '1Egx88GkeZ9ZHQrijClJEXIEDlQBy-ImuW_G92uR65R4';
const authorize = async req => (await import('./_firebaseAdmin.js')).requireUser(req);
const accessToken = async () => (await import('./_firebaseAdmin.js')).getSheetsAccessToken();
const base = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;

export const createHandler = (auth = authorize, token = accessToken, request = fetch) => async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    await auth(req);
    const response = await request(`${base}/values:batchGet?ranges=${encodeURIComponent("'Interações'!A:N")}&ranges=${encodeURIComponent("'Callbacks'!A:M")}&valueRenderOption=FORMATTED_VALUE`, { headers: { Authorization: `Bearer ${await token()}` }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
      const account = process.env.GCP_SERVICE_ACCOUNT_EMAIL || 'a conta de serviço do dashboard';
      const error = [403, 404].includes(response.status)
        ? `Compartilhe a planilha Callback com ${account} como Leitor e atualize a página.`
        : 'Não foi possível carregar os dados de Callback. Tente novamente.';
      return res.status(503).json({ error });
    }
    const ranges = (await response.json()).valueRanges || [];
    const interactions = ranges.find(range => range.range.includes('Interações'))?.values || [];
    const callbacks = ranges.find(range => range.range.includes('Callbacks'))?.values || [];
    const metrics = callbackMetrics(interactions, callbacks);
    return res.status(200).json({ metrics, source: { spreadsheetId, tabs: ['Interações', 'Callbacks'] } });
  } catch (error) {
    return res.status(error.statusCode || 503).json({ error: error.statusCode ? error.message : 'Não foi possível carregar os dados de Callback.' });
  }
};

export default createHandler();
