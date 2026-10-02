import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler as handlerFactory } from '../api/bko-records.js';

const createHandler = (auth, token, request) => handlerFactory(auth, token, request, async () => []);
const columns = ['Protocolo', 'Observações'];
const response = () => ({ setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const setup = () => {
  const calls = [];
  return { calls, handler: createHandler(async () => ({ uid: 'bko-user' }), async () => 'test-token', async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => options.method === 'POST' ? { updates: { updatedRange: 'Preenchimento!A2:B2' } } : { values: [columns] } };
  }) };
};

test('nega usuários sem BKO antes de acessar a planilha', async () => {
  const handler = createHandler(async () => { throw Object.assign(new Error('Acesso restrito'), { statusCode: 403 }); }, () => assert.fail('Não deve obter token'));
  const res = response();
  await handler({ method: 'POST' }, res);
  assert.equal(res.code, 403);
});
test('retorna todas as colunas na mesma ordem', async () => {
  const { handler } = setup(); const res = response();
  await handler({ method: 'GET' }, res);
  assert.deepEqual(res.body.headers, columns);
});
test('não grava se as colunas mudaram', async () => {
  const { handler, calls } = setup(); const res = response();
  await handler({ method: 'POST', body: { columns: ['Antiga'], values: ['123'] } }, res);
  assert.equal(res.code, 409); assert.equal(calls.length, 1);
});
test('valida protocolo e tipos antes de gravar', async () => {
  for (const values of [['', 'teste'], ['123', {}], ['123']]) {
    const { handler, calls } = setup(); const res = response();
    await handler({ method: 'POST', body: { columns, values } }, res);
    assert.equal(res.code, 400); assert.equal(calls.length, 1);
  }
});
test('inclui apenas uma linha e preserva zeros e fórmulas como texto', async () => {
  const { handler, calls } = setup(); const res = response();
  await handler({ method: 'POST', body: { columns, values: ['00123', '=1+1'] } }, res);
  assert.equal(res.code, 201);
  assert.equal(calls.length, 2);
  assert.match(calls[1].url, /valueInputOption=RAW/);
  assert.deepEqual(JSON.parse(calls[1].options.body).values, [['00123', '=1+1']]);
});
test('não informa sucesso se a gravação falha', async () => {
  const handler = createHandler(async () => ({ uid: 'bko' }), async () => 'token', async (url, options) => options.method === 'POST' ? { ok: false } : { ok: true, json: async () => ({ values: [columns] }) });
  const res = response();
  await handler({ method: 'POST', body: { columns, values: ['123', 'texto'] } }, res);
  assert.equal(res.code, 503);
});
