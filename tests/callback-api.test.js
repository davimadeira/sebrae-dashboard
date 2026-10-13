import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../api/callback.js';

const res = () => ({ headers: {}, code: 0, body: null, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
test('rejeita sessão ausente antes de acessar a planilha', async () => {
  let fetched = false;
  const handler = createHandler(async () => { throw Object.assign(new Error('Entre novamente.'), { statusCode: 401 }); }, async () => 'token', async () => { fetched = true; });
  const response = res();
  await handler({ method: 'GET' }, response);
  assert.equal(response.code, 401);
  assert.equal(fetched, false);
});
test('só permite consulta e orienta sobre permissão do Google', async () => {
  const handler = createHandler(async () => {}, async () => 'token', async () => ({ ok: false, status: 403 }));
  const write = res();
  await handler({ method: 'POST' }, write);
  assert.equal(write.code, 405);
  const read = res();
  await handler({ method: 'GET' }, read);
  assert.equal(read.code, 503);
  assert.match(read.body.error, /como Leitor/);
});
test('retorna apenas métricas agregadas, sem dados pessoais das linhas', async () => {
  const handler = createHandler(async () => {}, async () => 'token', async () => ({ ok: true, json: async () => ({ valueRanges: [
    { range: "'Interações'!A1:N2", values: [['ID de conversa', 'Tipo de mídia', 'Direção', 'Usuários', 'Finalização'], ['private-id', 'voz', 'Entrada', 'Pessoa', 'Resolvido']] },
    { range: "'Callbacks'!A1:M1", values: [['ID da chamada original', 'Status do callback']] },
  ] }) }));
  const response = res();
  await handler({ method: 'GET' }, response);
  assert.equal(response.code, 200);
  assert.equal(response.body.metrics.received, 1);
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.doesNotMatch(JSON.stringify(response.body), /private-id|Pessoa/);
});
