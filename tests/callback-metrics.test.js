import test from 'node:test';
import assert from 'node:assert/strict';
import { callbackMetrics } from '../api/_callbackMetrics.js';

// Reordered headers exercise lookup rather than fixed column positions.
const ih = ['Direção', 'Finalização', 'ID de conversa', 'Usuários', 'Tipo de mídia'];
const ch = ['Status do callback', 'ID da chamada original'];
test('separa finalizadas de elegíveis, ignora mensagem e deduplica IDs', () => {
  const metrics = callbackMetrics([ih,
    ['Entrada', 'Resolvido', 'a', 'Ana', 'voz'],
    ['Entrada', 'Resolvido', 'A', 'Bia', 'voz'],
    ['Entrada', 'Queda', 'b', 'Ana', 'voz'],
    ['Entrada', 'Abandono', 'c', '', 'voz'],
    ['Saída', 'Resolvido', 'd', 'Ana', 'voz'],
    ['Entrada/Saída', 'Resolvido', 'e', 'Ana', 'voz'],
    ['Entrada', 'Resolvido', 'f', 'Ana', 'mensagem'],
  ], [ch, ['Sucesso', 'b'], ['SUCESSO', 'B'], ['Insucesso', 'g'], ['Sem saída identificada', 'c']]);
  assert.deepEqual(metrics, { received: 3, answered: null, unique: 2, finished: 1,
    eligible: 3, performed: 2, success: 1, failed: 1, pending: 1,
    performedRate: 2/3, successRate: .5, failedRate: .5,
    potential: 2, registered: null, registeredRate: null });
});
test('base vazia mantém contagens zeradas e taxas indefinidas', () => {
  const metrics = callbackMetrics([ih], [ch]);
  assert.equal(metrics.received, 0);
  assert.equal(metrics.performedRate, null);
  assert.equal(metrics.successRate, null);
});
test('estrutura ausente, status novos e duplicações conflitantes exigem revisão', () => {
  assert.throws(() => callbackMetrics([['Direção']], [ch]), { statusCode: 409 });
  assert.throws(() => callbackMetrics([ih], [ch, ['Novo status', 'a']]), /status de callback/);
  assert.throws(() => callbackMetrics([ih], [ch, ['Sucesso', 'a'], ['Insucesso', 'a']]), /resultados diferentes/);
});
