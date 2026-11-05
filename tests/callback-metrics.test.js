import test from 'node:test';
import assert from 'node:assert/strict';
import { callbackMetrics } from '../api/_callbackMetrics.js';

const headers = ['Direção', 'Total de conversas', 'ID de conversa', 'Usuários', 'Tipo de mídia', 'Finalização', 'ANI', 'DNIS'];
const callbackHeaders = ['ID da chamada original', 'Status do callback', 'Quantidade de tentativas', 'Tentativas com conversa', 'IDs dos retornos'];
const noCallbacks = [callbackHeaders];

test('usa a tabulação para elegíveis e os resultados vinculados da aba Callbacks', () => {
  const metrics = callbackMetrics([headers,
    ['Entrada', '00:00:00', 'e1', '', 'voz', 'Queda de ligação', 'tel:+55', 'tel:100'],
    ['Entrada', '00:00:00', 'e2', '', 'voz', 'ERRO SISTÊMICO', 'tel:+55', 'tel:101'],
    ['Entrada', '00:02:00', 'n1', 'Ana', 'voz', 'Atendimento concluído', 'tel:+55', 'tel:102'],
    ['Saída', '00:01:00', 's1', 'Ana', 'voz', '', 'sip:callback-1', 'tel:200'],
    ['Saída', '00:00:00', 's2', 'Ana', 'voz', '', 'sip:callback-2', 'tel:201'],
    ['Saída', '', 's3', 'Ana', 'voz', '', 'sip:callback-3', 'tel:202'],
    ['Saída', '00:02:00', 'x', 'Ana', 'voz', '', 'tel:+55', 'tel:203'],
  ], [callbackHeaders,
    ['e1', 'Sucesso', '1', '1', 's1'],
    ['e2', 'Insucesso', '1', '0', 's2'],
    ['n1', 'Sucesso', '1', '1', 's3'],
  ]);
  assert.equal(metrics.eligible, 2);
  assert.equal(metrics.performed, 2);
  assert.equal(metrics.success, 1);
  assert.equal(metrics.failed, 1);
  assert.equal(metrics.pending, 0);
  assert.equal(metrics.unique, 3);
  assert.equal(metrics.finished, 1); // atendidas únicas menos elegíveis
  assert.equal(metrics.potential, 2); // finalizadas mais callbacks com sucesso
  assert.equal(metrics.received, null); // recebidas vêm dos arquivos diários do Drive
  assert.equal(metrics.successRate, 1 / 2);
});

test('potencial soma finalizadas e callbacks com sucesso', () => {
  const metrics = callbackMetrics([headers,
    ['Entrada', '00:01:00', 't1', 'Ana', 'voz', 'Teste de atendimento', 'tel:+55', 'tel:100'],
    ['Entrada', '00:01:00', 'n1', 'Ana', 'voz', 'Atendimento concluído', 'tel:+55', 'tel:101'],
  ], noCallbacks);
  assert.equal(metrics.finished, 2);
  assert.equal(metrics.potential, 2);
});

test('aceita todas as tabulações elegíveis apenas na entrada e separa Entrada/Saída', () => {
  const metrics = callbackMetrics([headers,
    ['Entrada', '', 'a', '', 'voz', 'Ligação muda', 'tel:+55', 'tel:100'],
    ['Entrada', '', 'b', '', 'voz', 'Ligação muda/caída', 'tel:+55', 'tel:101'],
    ['Entrada', '', 'c', '', 'voz', 'Falta de interação', 'tel:+55', 'tel:102'],
    ['Entrada/Saída', '00:01:00', 'd', 'Ana', 'voz', 'Queda de ligação', 'sip:callback', 'tel:103'],
  ], [callbackHeaders, ['a', 'Sucesso', '2', '1', 'd']]);
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
  ], noCallbacks);
  assert.equal(metrics.eligible, 4);
  assert.equal(metrics.unique, 4);
  assert.equal(metrics.finished, 0);
});

test('conta cada ID original elegível uma vez e ignora resultados de não elegíveis', () => {
  const metrics = callbackMetrics([headers,
    ['Entrada', '', 'a', 'Ana', 'voz', 'Erro sistêmico', 'tel:100', 'tel:900'],
    ['Entrada', '', 'b', 'Bia', 'voz', 'Ligação muda', 'tel:200', 'tel:900'],
    ['Entrada', '', 'n', 'Caio', 'voz', 'Atendimento concluído', 'tel:300', 'tel:900'],
    ['Saída', '', 'ra', 'Ana', 'voz', '', 'sip:ana', 'tel:901'],
    ['Saída', '', 'rb', 'Bia', 'voz', '', 'sip:bia', 'tel:902'],
    ['Saída', '', 'rn', 'Caio', 'voz', '', 'sip:caio', 'tel:903'],
  ], [callbackHeaders,
    ['a', 'Sucesso', '3', '1', 'ra'],
    ['a', 'Sucesso', '3', '1', 'ra'],
    ['b', 'Insucesso', '2', '0', 'rb'],
    ['n', 'Sucesso', '1', '1', 'rn'],
  ]);
  assert.equal(metrics.performed, 2);
  assert.equal(metrics.success, 1);
  assert.equal(metrics.failed, 1);
});

test('exige tentativa para realizado e conversa para sucesso, mesmo com status divergente', () => {
  const metrics = callbackMetrics([headers,
    ['Entrada', '', 'a', 'Ana', 'voz', 'Erro sistêmico', 'tel:100', 'tel:900'],
    ['Entrada', '', 'b', 'Bia', 'voz', 'Ligação muda', 'tel:200', 'tel:901'],
    ['Entrada', '', 'c', 'Caio', 'voz', 'Queda de ligação', 'tel:300', 'tel:902'],
    ['Saída', '', 'ra', 'Ana', 'voz', '', 'sip:ana', 'tel:910'],
    ['Saída', '', 'rb', 'Bia', 'voz', '', 'sip:bia', 'tel:911'],
    ['Saída', '', 'rc', 'Caio', 'voz', '', 'sip:caio', 'tel:912'],
  ], [callbackHeaders,
    ['a', 'Sucesso', '0', '0', 'ra'],
    ['b', 'Sucesso', '1', '0', 'rb'],
    ['c', 'Insucesso', '2', '1', 'rc'],
  ]);
  assert.equal(metrics.performed, 2);
  assert.equal(metrics.success, 1);
  assert.equal(metrics.failed, 1);
  assert.equal(metrics.pending, 1);
});

test('callback realizado remove repetição do mesmo cliente e operador no dia', () => {
  const metrics = callbackMetrics([headers,
    ['Entrada', '', 'e1', 'Ana', 'voz', 'Erro sistêmico', 'tel:100', 'tel:900'],
    ['Saída', '', 'r1', 'Ana', 'voz', '', 'sip:ana', 'tel:+55 11 99999-0000'],
    ['Saída', '', 'r2', 'Ana', 'voz', '', 'sip:ana', 'tel:5511999990000'],
    ['Saída', '', 'r3', 'Bia', 'voz', '', 'sip:bia', 'tel:5511999990000'],
    ['Saída', '', 'r4', 'Ana', 'voz', '', 'sip:ana', 'tel:5511888880000'],
  ], [callbackHeaders,
    ['e1', 'Sucesso', '4', '1', 'r1 | r2 | r3 | r4'],
  ]);
  assert.equal(metrics.performed, 3);
  assert.equal(metrics.success, 3);
  assert.equal(metrics.failed, 0);
});

test('base vazia mantém contagens zeradas e taxas indefinidas', () => {
  const metrics = callbackMetrics([headers], noCallbacks);
  assert.equal(metrics.received, null);
  assert.equal(metrics.finished, 0);
  assert.equal(metrics.performedRate, null);
  assert.equal(metrics.successRate, null);
});

test('estrutura ausente exige revisão', () => {
  assert.throws(() => callbackMetrics([['Direção']], noCallbacks), { statusCode: 409 });
  assert.throws(() => callbackMetrics([headers], [['ID da chamada original']]), { statusCode: 409 });
});
