import { callbackReport } from './_callbackMetrics.js';
import { loadReceivedFromDrive } from './_receivedMetrics.js';

const spreadsheetId = '1Egx88GkeZ9ZHQrijClJEXIEDlQBy-ImuW_G92uR65R4';
const authorize = async req => (await import('./_firebaseAdmin.js')).requireUser(req);
const accessToken = async () => (await import('./_firebaseAdmin.js')).getSheetsAccessToken();
const base = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;

export const createHandler = (auth = authorize, token = accessToken, request = fetch, receivedLoader = loadReceivedFromDrive) => async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    await auth(req);
    const bearer = await token();
    const options = { headers: { Authorization: `Bearer ${bearer}` }, signal: AbortSignal.timeout(20000) };
    const [response, receivedByDate] = await Promise.all([
      request(`${base}/values:batchGet?ranges=${encodeURIComponent("'Interações'!A:ZZ")}&ranges=${encodeURIComponent("'Callbacks'!A:ZZ")}&valueRenderOption=FORMATTED_VALUE`, options),
      receivedLoader(bearer, request),
    ]);
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
    let foco = [];
    try {
      const focoResponse = await request(`${base}/values/${encodeURIComponent("'Foco'!A:Z")}?valueRenderOption=FORMATTED_VALUE`, options);
      if (focoResponse.ok) foco = (await focoResponse.json()).values || [];
    } catch {
      // Foco is optional while its import automation is being configured.
    }
    const report = callbackReport(interactions, callbacks, foco, receivedByDate);
    return res.status(200).json({ ...report, updatedAt: new Date().toISOString(), source: { spreadsheetId, tabs: ['Interações', 'Callbacks', ...(foco.length ? ['Foco'] : [])] } });
  } catch (error) {
    return res.status(error.statusCode || 503).json({ error: error.statusCode ? error.message : 'Não foi possível carregar os dados de Callback.' });
  }
};

export default createHandler();
