import test from 'node:test';
import assert from 'node:assert/strict';
import { callbackMetrics } from '../api/_callbackMetrics.js';

const headers = ['Direção', 'Total de conversas', 'ID de conversa', 'Usuários', 'Tipo de mídia', 'Finalização', 'ANI', 'DNIS'];

test('usa a tabulação para elegíveis e ANI sip para callbacks', () => {
  const metrics = callbackMetrics([headers,
    ['Entrada', '00:00:00', 'e1', '', 'voz', 'Queda de ligação', 'tel:+55', 'tel:100'],
    ['Entrada', '00:00:00', 'e2', '', 'voz', 'ERRO SISTÊMICO', 'tel:+55', 'tel:101'],
    ['Entrada', '00:02:00', 'n1', 'Ana', 'voz', 'Atendimento concluído', 'tel:+55', 'tel:102'],
    ['Saída', '00:01:00', 's1', 'Ana', 'voz', '', 'sip:callback-1', 'tel:200'],
    ['Saída', '00:00:00', 's2', 'Ana', 'voz', '', 'sip:callback-2', 'tel:201'],
    ['Saída', '', 's3', 'Ana', 'voz', '', 'sip:callback-3', 'tel:202'],
    ['Saída', '00:02:00', 'x', 'Ana', 'voz', '', 'tel:+55', 'tel:203'],
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
    ['Entrada', '00:01:00', 't1', 'Ana', 'voz', 'Teste de atendimento', 'tel:+55', 'tel:100'],
    ['Entrada', '00:01:00', 'n1', 'Ana', 'voz', 'Atendimento concluído', 'tel:+55', 'tel:101'],
  ]);
  assert.equal(metrics.finished, 2);
  assert.equal(metrics.potential, 2);
});

test('aceita todas as tabulações elegíveis apenas na entrada e separa Entrada/Saída', () => {
  const metrics = callbackMetrics([headers,
    ['Entrada', '', 'a', '', 'voz', 'Ligação muda', 'tel:+55', 'tel:100'],
    ['Entrada', '', 'b', '', 'voz', 'Ligação muda/caída', 'tel:+55', 'tel:101'],
    ['Entrada', '', 'c', '', 'voz', 'Falta de interação', 'tel:+55', 'tel:102'],
    ['Entrada/Saída', '00:01:00', 'd', 'Ana', 'voz', 'Queda de ligação', 'sip:callback', 'tel:103'],
  ]);
  assert.equal(metrics.eligible, 3);
  assert.equal(metrics.mixed, 1);
  assert.equal(metrics.performed, 1);
  assert.equal(metrics.success, 1);
  assert.equal(metrics.finished, 0);
  assert.equal(metrics.potential, 1);
});

test('reconhece tabulação elegível dentro de finalizações compostas e sem acentos', () => {
  const metrics = callbackMetrics([headers,
    ['Entrada', '', 'a', '', 'voz', 'Portal sebrae;erro sistemico', 'tel:+55', 'tel:100'],
    ['Entrada', '', 'b', '', 'voz', 'Outro;FALTA DE INTERACAO', 'tel:+55', 'tel:101'],
    ['Entrada', '', 'c', '', 'voz', 'Ligação muda/caída;Portal', 'tel:+55', 'tel:102'],
    ['Entrada', '', 'd', '', 'voz', 'Portal;queda de ligacao', 'tel:+55', 'tel:103'],
    ['Saída', '', 'e', '', 'voz', 'Portal;erro sistêmico', 'tel:+55', 'tel:104'],
    ['Entrada', '', 'f', '', 'chat', 'Erro sistêmico', 'tel:+55', 'tel:105'],
  ]);
  assert.equal(metrics.eligible, 4);
  assert.equal(metrics.unique, 4);
  assert.equal(metrics.finished, 0);
});

test('deduplica somente o mesmo par SIP e DNIS', () => {
  const metrics = callbackMetrics([headers,
    ['Saída', '', 'a1', 'Ana', 'voz', '', 'sip:operador-1', 'tel:100'],
    ['Saída', '00:00:05', 'a2', 'Ana', 'voz', '', 'sip:operador-1', 'tel:200'],
    ['Saída', '00:00:03', 'a3', 'Ana', 'voz', '', 'sip:operador-1', 'tel:200'],
    ['Saída', '00:00:02', 'b1', 'Bia', 'voz', '', 'sip:operador-2', 'tel:100'],
    ['Saída', '', 'c1', 'Caio', 'voz', '', 'sip:operador-3', 'tel:300'],
    ['Saída', '00:00:00', 'c2', 'Caio', 'voz', '', 'sip:operador-3', 'tel:301'],
  ]);
  assert.equal(metrics.performed, 5);
  assert.equal(metrics.success, 2);
  assert.equal(metrics.failed, 3);
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
