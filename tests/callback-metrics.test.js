import test from 'node:test';
import assert from 'node:assert/strict';
import { callbackMetrics } from '../api/_callbackMetrics.js';

const headers = ['Direção', 'Total de conversas', 'ID de conversa', 'Usuários', 'Tipo de mídia', 'Finalização', 'ANI'];

test('usa a tabulação para elegíveis e ANI sip para callbacks', () => {
  const metrics = callbackMetrics([headers,
    ['Entrada', '00:00:00', 'e1', '', 'voz', 'Queda de ligação', 'tel:+55'],
    ['Entrada', '00:00:00', 'e2', '', 'voz', 'ERRO SISTÊMICO', 'tel:+55'],
    ['Entrada', '00:02:00', 'n1', 'Ana', 'voz', 'Atendimento concluído', 'tel:+55'],
    ['Saída', '00:01:00', 's1', 'Ana', 'voz', '', 'sip:callback-1'],
    ['Saída', '00:00:00', 's2', 'Ana', 'voz', '', 'sip:callback-2'],
    ['Saída', '', 's3', 'Ana', 'voz', '', 'sip:callback-3'],
    ['Saída', '00:02:00', 'x', 'Ana', 'voz', '', 'tel:+55'],
  ]);
  assert.equal(metrics.eligible, 2);
  assert.equal(metrics.performed, 3);
  assert.equal(metrics.success, 1);
  assert.equal(metrics.failed, 2);
  assert.equal(metrics.pending, 0);
  assert.equal(metrics.unique, 3);
  assert.equal(metrics.finished, 1); // atendidas únicas menos elegíveis
  assert.equal(metrics.potential, 2); // finalizadas mais callbacks com sucesso
  assert.equal(metrics.received, null); // recebidas vêm dos arquivos diários do Drive
  assert.equal(metrics.successRate, 1 / 3);
});

test('potencial soma finalizadas e callbacks com sucesso', () => {
  const metrics = callbackMetrics([headers,
    ['Entrada', '00:01:00', 't1', 'Ana', 'voz', 'Teste de atendimento', 'tel:+55'],
    ['Entrada', '00:01:00', 'n1', 'Ana', 'voz', 'Atendimento concluído', 'tel:+55'],
  ]);
  assert.equal(metrics.finished, 2);
  assert.equal(metrics.potential, 2);
});

test('aceita todas as tabulações elegíveis apenas na entrada e separa Entrada/Saída', () => {
  const metrics = callbackMetrics([headers,
    ['Entrada', '', 'a', '', 'voz', 'Ligação muda', 'tel:+55'],
    ['Entrada', '', 'b', '', 'voz', 'Ligação muda/caída', 'tel:+55'],
    ['Entrada', '', 'c', '', 'voz', 'Falta de interação', 'tel:+55'],
    ['Entrada/Saída', '00:01:00', 'd', 'Ana', 'voz', 'Queda de ligação', 'sip:callback'],
  ]);
  assert.equal(metrics.eligible, 3);
  assert.equal(metrics.mixed, 1);
  assert.equal(metrics.performed, 1);
  assert.equal(metrics.success, 1);
  assert.equal(metrics.finished, 0);
  assert.equal(metrics.potential, 1);
});

test('base vazia mantém contagens zeradas e taxas indefinidas', () => {
  const metrics = callbackMetrics([headers]);
  assert.equal(metrics.received, null);
  assert.equal(metrics.finished, 0);
  assert.equal(metrics.performedRate, null);
  assert.equal(metrics.successRate, null);
});

test('estrutura ausente exige revisão', () => {
  assert.throws(() => callbackMetrics([['Direção']]), { statusCode: 409 });
});
