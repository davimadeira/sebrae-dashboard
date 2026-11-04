const folderId = '1XyJJ72R2inxiCdBy1DRkpovSEBXfM7gi';
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
let cache = null;

function parseCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let index = 0; index < String(text ?? '').length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === ';' && !quoted) { row.push(field); field = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field); field = '';
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
    } else field += character;
  }
  row.push(field);
  if (row.some(value => value !== '')) rows.push(row);
  return rows;
}

function dateKey(value, filename = '') {
  const raw = String(value || filename).trim();
  const match = /^(\d{1,2})[\/.](\d{1,2})[\/.](\d{2}|\d{4})(?:\s|$)/.exec(raw);
  if (!match) return null;
  const year = Number(match[3]) + (match[3].length === 2 ? 2000 : 0);
  const month = Number(match[2]), day = Number(match[1]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date.toISOString().slice(0, 10) : null;
}

const number = value => {
  const raw = String(value ?? '').trim().replace(/\s/g, '').replace(',', '.');
  return /^\d+(?:\.\d+)?$/.test(raw) ? Number(raw) : 0;
};

export function receivedFromCsv(content, filename = '') {
  const rows = parseCsv(content);
  if (!rows.length) return null;
  const headers = rows[0].map(normalize);
  const dateIndex = headers.indexOf('inicio do intervalo');
  const queueIndex = headers.indexOf('nome da fila');
  const offerIndex = headers.indexOf('oferta');
  if (queueIndex < 0 || offerIndex < 0) throw Object.assign(new Error(`O arquivo ${filename || 'de recebidas'} não possui as colunas Nome da fila e Oferta.`), { statusCode: 409 });
  const relevant = rows.slice(1).filter(row => !normalize(row[queueIndex]).includes('ouvidoria'));
  const date = dateKey(relevant.find(row => row[dateIndex])?.[dateIndex], filename);
  if (!date) throw Object.assign(new Error(`Não foi possível identificar a data do arquivo ${filename || 'de recebidas'}.`), { statusCode: 409 });
  return { date, received: relevant.reduce((sum, row) => sum + number(row[offerIndex]), 0) };
}

export async function loadReceivedFromDrive(token, request = fetch) {
  if (cache?.expiresAt > Date.now()) return new Map(cache.values);
  const query = `'${folderId}' in parents and trashed = false and mimeType = 'text/csv'`;
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=1000&orderBy=name&fields=files(id,name,modifiedTime)`;
  const options = { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000) };
  const listResponse = await request(listUrl, options);
  if (!listResponse.ok) throw Object.assign(new Error('Não foi possível acessar a pasta de Recebidas. Compartilhe a pasta com a conta de serviço do dashboard como Leitor.'), { statusCode: 503 });
  const files = (await listResponse.json()).files || [];
  const contents = await Promise.all(files.map(async file => {
    const response = await request(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`, options);
    if (!response.ok) throw Object.assign(new Error(`Não foi possível ler o arquivo ${file.name}.`), { statusCode: 503 });
    return { ...file, content: await response.text() };
  }));
  const result = new Map();
  for (const file of contents.sort((a, b) => String(a.modifiedTime).localeCompare(String(b.modifiedTime)))) {
    const metric = receivedFromCsv(file.content, file.name);
    if (metric) result.set(metric.date, metric.received);
  }
  cache = { expiresAt: Date.now() + 5 * 60 * 1000, values: [...result.entries()] };
  return result;
}
