const SHEET_ID = '1sq5V2qrF91laGglRf6CByHOl5w6SnlVcTyGxNBZ63nw';
const RANGE = 'Preenchimento!A:T';

export default async function handler(req, res) {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY || 'AIzaSyBPlmaOy6GWnZFInYi1vVojS47r02UcE38';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RANGE)}?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'Erro ao buscar dados da planilha',
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Erro interno ao buscar dados da planilha',
    });
  }
}
