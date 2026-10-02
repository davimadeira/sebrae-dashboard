import test from 'node:test';
import assert from 'node:assert/strict';
import { getBkoFields } from '../api/_bkoFields.js';
import { createHandler } from '../api/bko-records.js';
test('carrega listas literais e referências com opções únicas', async () => {
  const fields = await getBkoFields('https://sheets.googleapis.com/v4/spreadsheets/example/values/', {}, ['Órgão', 'Aberto por:', 'Data da Abertura', 'Status Ticket'], async url => ({ ok: true, json: async () => url.includes('/values/') ? { values: [['Ana'], ['Ana'], ['Bruno']] } : { sheets: [{ data: [{ rowData: [{ values: [{ dataValidation: { strict: true, condition: { type: 'ONE_OF_LIST', values: [{ userEnteredValue: 'ES' }] } } }, { dataValidation: { condition: { type: 'ONE_OF_RANGE', values: [{ userEnteredValue: '=LISTA!A1:A' }] } } }] }] }] }] } }));
  assert.deepEqual(fields[0].options, ['ES']); assert.equal(fields[0].strict, true);
  assert.deepEqual(fields[1].options, ['Ana', 'Bruno']); assert.equal(fields[1].strict, false);
  assert.equal(fields[2].type, 'date'); assert.equal(fields[3].type, 'calculated');
});
test('rejeita opção inválida e data impossível antes da escrita', async () => {
  const columns = ['Protocolo', 'Procedentes', 'Data da Abertura'];
  let writes = 0;
  const handler = createHandler(async () => ({ uid: 'u' }), async () => 'token', async (_, options) => { if (options.method) writes++; return { ok: true, json: async () => ({ values: [columns] }) }; }, async () => [{ name: columns[0], options: [] }, { name: columns[1], options: ['SIM', 'NÃO'], strict: true }, { name: columns[2], options: [], type: 'date' }]);
  for (const values of [['1', 'talvez', '01/10/2026'], ['1', 'SIM', '31/02/2026']]) {
    const res = { setHeader() {}, status(code) { this.code = code; return this; }, json() {} };
    await handler({ method: 'POST', body: { columns, values } }, res); assert.equal(res.code, 400);
  }
  assert.equal(writes, 0);
});
