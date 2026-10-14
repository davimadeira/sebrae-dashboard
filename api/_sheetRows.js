export const columnName = index => { let text = ''; for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) text = String.fromCharCode(65 + (n - 1) % 26) + text; return text; };
export const quotedTab = name => `'${name.replace(/'/g, "''")}'`;
export const sheetError = (message, statusCode = 503) => Object.assign(new Error(message), { statusCode });

// Formula-only template rows are not records. Insert and populate in one atomic
// batch so concurrent submissions cannot overwrite each other's new record.
export async function insertAfterRecords({ root, tab, schema, values, headers, request, calculated = [], cellOverrides = {} }) {
  const range = `${quotedTab(tab)}!A2:${columnName(schema.length - 1)}`;
  const results = await Promise.all([
    request(`${root}/values/${encodeURIComponent(range)}?valueRenderOption=FORMULA`, { headers }),
    request(`${root}?fields=sheets(properties)`, { headers }),
  ]);
  if (results.some(result => !result.ok)) throw sheetError('Não foi possível identificar a última linha. Nenhum registro foi gravado.');
  const rows = (await results[0].json()).values || [];
  const sheet = (await results[1].json()).sheets?.find(s => s.properties.title === tab)?.properties;
  if (!sheet) throw sheetError('A aba de destino não foi encontrada.');
  let last = -1;
  rows.forEach((row, i) => { if (row.some((value, col) => !calculated.includes(col) && String(value ?? '').trim() && !String(value).startsWith('='))) last = i; });
  const index = last + 2; // zero-based destination, after header or last record
  const grid = col => ({ sheetId: sheet.sheetId, startRowIndex: index, endRowIndex: index + 1, startColumnIndex: col, endColumnIndex: col + 1 });
  const requests = [index < sheet.gridProperties.rowCount
    ? { insertDimension: { range: { sheetId: sheet.sheetId, dimension: 'ROWS', startIndex: index, endIndex: index + 1 }, inheritFromBefore: true } }
    : { appendDimension: { sheetId: sheet.sheetId, dimension: 'ROWS', length: 1 } }];
  const templateIndex = index > 1 ? index - 1 : index + 1;
  if (templateIndex < sheet.gridProperties.rowCount) {
    const source = { sheetId: sheet.sheetId, startRowIndex: templateIndex, endRowIndex: templateIndex + 1, startColumnIndex: 0, endColumnIndex: schema.length };
    const destination = { ...source, startRowIndex: index, endRowIndex: index + 1 };
    for (const pasteType of ['PASTE_FORMAT', 'PASTE_DATA_VALIDATION']) requests.push({ copyPaste: { source, destination, pasteType } });
  }
  for (let col = 0; col < schema.length; col++) {
    // Copy ordinary per-row formulas with relative references; never copy spill anchors.
    const formula = rows[index > 1 ? index - 2 : 0]?.[col];
    if (!cellOverrides[col] && (calculated.includes(col) || !values[col]?.trim()) && String(formula || '').startsWith('=') && !/\b(MAP|ARRAYFORMULA|BYROW|SCAN|FILTER|QUERY|SEQUENCE|SORT|UNIQUE)\s*\(/i.test(formula)) {
      requests.push({ copyPaste: { source: { ...grid(col), startRowIndex: templateIndex, endRowIndex: templateIndex + 1 }, destination: grid(col), pasteType: 'PASTE_FORMULA' } });
    }
    if (cellOverrides[col] || (!calculated.includes(col) && values[col]?.trim())) requests.push({ updateCells: { range: grid(col), rows: [{ values: [cellOverrides[col] || { userEnteredValue: { stringValue: values[col].trim() } }] }], fields: cellOverrides[col]?.userEnteredFormat ? 'userEnteredValue,userEnteredFormat.numberFormat' : 'userEnteredValue' } });
  }
  const response = await request(`${root}:batchUpdate`, { method: 'POST', headers, body: JSON.stringify({ requests }) });
  if (!response.ok) throw sheetError('Não foi possível confirmar a gravação. Atualize a lista antes de tentar novamente.');
  return `${tab}!A${index + 1}:${columnName(schema.length - 1)}${index + 1}`;
}
