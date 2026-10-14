import test from 'node:test';
import assert from 'node:assert/strict';
import { callbackMetrics } from '../api/_callbackMetrics.js';

// Reordered headers exercise lookup rather than fixed column positions.
const ih = ['Direção', 'Total de conversas', 'ID de conversa', 'Usuários', 'Tipo de mídia'];
const ch = ['Status do callback', 'ID da chamada original'];
test('exige conversa efetiva, separa mistos e mantém regras pendentes sem estimativas', () => {
  const metrics = callbackMetrics([ih,
    ['Entrada', '00:01:00.000', 'a', 'Ana', 'voz'],
    ['Entrada', '00:01:00.000', 'A', 'Bia', 'voz'],
    ['Entrada', '00:00:00,001', 'b', 'Ana', 'voz'],
    ['Entrada', '00:00:00', 'c', 'Ana', 'voz'],
    ['Saída', '00:01:00', 'd', 'Ana', 'voz'],
    ['Entrada/Saída', '00:01:00', 'e', 'Ana', 'voz'],
    ['Entrada', '00:01:00', 'f', 'Ana', 'mensagem'],
  ], [ch, ['Sucesso', 'b'], ['SUCESSO', 'B'], ['Insucesso', 'g'], ['Sem saída identificada', 'c']]);
  assert.deepEqual(metrics, { received: 3, answered: null, unique: 2, finished: null,
    eligible: 3, performed: 2, success: 1, failed: 1, pending: 1,
    performedRate: 2/3, successRate: .5, failedRate: .5,
    potential: null, registered: null, registeredRate: null, mixed: 1 });
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
