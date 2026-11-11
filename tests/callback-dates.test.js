import test from 'node:test';
import assert from 'node:assert/strict';
import { callbackReport } from '../api/_callbackMetrics.js';
import { callbackDateLabels, filterCallbackRows, summarizeCallbackRows } from '../src/utils/callbackView.js';

const interactions = [
  ['ID de conversa', 'Tipo de mídia', 'Direção', 'Usuários', 'Total de conversas', 'Data', 'Data de término', 'Marca externa', 'Finalização', 'ANI', 'DNIS'],
  ['a', 'voz', 'Entrada', 'Ana', '00:01:00', '01/09/26 23:59', '01/09/26 23:59', 'p1', '', 'tel:+55', 'tel:100'],
  ['b', 'voz', 'Entrada', 'Ana', '', '02/09/2026 10:00', '02/09/2026 10:05', 'p2', 'Queda de ligação', 'tel:+55', 'tel:101'],
  ['c', 'voz', 'Saída', 'Ana', '00:00:00.001', '2026-10-08T12:00:00', '2026-10-08T12:01:00', 'p3', '', 'sip:callback', 'tel:102'],
  ['d', 'voz', 'Entrada', 'Ana', '', '31/02/2026', '31/02/2026', 'p4', '', 'tel:+55', 'tel:103'],
];
const callbacks = [
  ['ID da chamada original', 'Status do callback', 'Data da chamada', 'Primeiro retorno', 'Quantidade de tentativas', 'Tentativas com conversa', 'IDs dos retornos'],
  ['a', 'Sucesso', '01/09/26 23:59', '02/09/26 00:10', '1', '1', 'c'],
  ['b', 'Sem saída identificada', '02/09/2026 10:00', '', '0', '0', ''],
];
const foco = [
  ['Data de abertura', 'Canal de Atendimento', 'Status', 'Protocolo CNR', 'Interação Foco nº'],
  ['01/09/2026', 'Telefone', 'Em andamento', 'outro-protocolo', 'f1'],
  ['08/10/2026', 'Telefone', 'Concluído', 'outro-protocolo', 'f2'],
  ['08/10/2026', 'Email', 'Concluído', 'p3', 'f3'],
  ['08/10/2026', 'Telefone', 'Concluído', 'outro-protocolo', ''],
  ['08/10/2026', 'Telefone', 'Concluído', '', ''],
];
const received = new Map([['2026-09-01', 10], ['2026-09-02', 20], ['2026-10-08', 30], ['Sem data', 0]]);
test('agrupa pelo dia da origem, mantém datas inválidas visíveis e reconcilia total', () => {
  const report = callbackReport(interactions, callbacks, foco, received);
  assert.deepEqual(report.rows.map(row => row.date), ['2026-09-01', '2026-09-02', '2026-10-08', 'Sem data']);
  assert.equal(report.rows[0].success, 0);
  assert.equal(report.rows[1].success, 0);
  assert.deepEqual(report.rows.map(row => row.received), [10, 20, 30, 0]);
  assert.deepEqual(report.rows.map(row => row.finished), [1, 0, 0, 1]);
  assert.deepEqual(report.rows.map(row => row.registered), [1, 0, 3, 0]);
  assert.deepEqual(summarizeCallbackRows(report.rows), report.metrics);
});
test('combina filtros de mês, semana e dia e recalcula percentuais pelos totais', () => {
  const { rows } = callbackReport(interactions, callbacks, foco, received);
  const september = filterCallbackRows(rows, { meses: ['09/2026'] });
  assert.equal(september.length, 2);
  assert.equal(summarizeCallbackRows(september).performedRate, 0);
  assert.equal(summarizeCallbackRows(september).finished, 1);
  const day = filterCallbackRows(rows, { meses: ['09/2026'], semanas: [callbackDateLabels('2026-09-01').semanas], dias: ['01/09/2026'] });
  assert.equal(day.length, 1);
  assert.equal(summarizeCallbackRows(day).performedRate, null);
  assert.equal(filterCallbackRows(rows, { meses: ['10/2026'], dias: ['01/09/2026'] }).length, 0);
  assert.equal(summarizeCallbackRows([]).performedRate, null);
});
test('soma recebidas disponíveis mesmo quando algum dia não possui arquivo', () => {
  const rows = [
    { received: 10, unique: 0, finished: 0, eligible: 0, performed: 0, success: 0, failed: 0, pending: 0, potential: 0, mixed: 0, registered: 0 },
    { received: null, unique: 0, finished: 0, eligible: 0, performed: 0, success: 0, failed: 0, pending: 0, potential: 0, mixed: 0, registered: 0 },
    { received: 20, unique: 0, finished: 0, eligible: 0, performed: 0, success: 0, failed: 0, pending: 0, potential: 0, mixed: 0, registered: 0 },
  ];
  assert.equal(summarizeCallbackRows(rows).received, 30);
  assert.equal(summarizeCallbackRows(rows.map(row => ({ ...row, received: null }))).received, null);
});
test('não conta o mesmo ID em dois dias diferentes', () => {
  assert.throws(() => callbackReport([...interactions, ['a', 'voz', 'Entrada', 'Ana', '00:01:00', '02/09/26', '02/09/26', '', '', 'tel:+55', 'tel:100']], callbacks), /datas diferentes/);
});

test('inclui origem tabulada incorretamente quando há callback vinculado', () => {
  const values = [interactions[0],
    ['e1', 'voz', 'Entrada', 'Ana', '', '01/09/2026 10:00', '01/09/2026 10:05', '', 'Microtema comum', 'tel:900', 'tel:100'],
    ['e2', 'voz', 'Entrada', 'Bia', '', '02/09/2026 10:00', '02/09/2026 10:05', '', 'Ligação muda', 'tel:900', 'tel:200'],
    ['r1', 'voz', 'Saída', 'Ana', '00:00:00.001', '01/09/2026 10:20', '01/09/2026 10:21', '', '', 'sip:ana', 'tel:900'],
    ['r2', 'voz', 'Saída', 'Bia', '', '02/09/2026 10:20', '02/09/2026 10:21', '', '', 'sip:bia', 'tel:900'],
  ];
  const results = [callbacks[0],
    ['e1', 'Sucesso', '01/09/2026', '', '3', '1', 'r1'],
    ['e1', 'Sucesso', '01/09/2026', '', '3', '1', 'r1'],
    ['e2', 'Insucesso', '02/09/2026', '', '2', '0', 'r2'],
  ];
  const report = callbackReport(values, results);
  assert.deepEqual(report.rows.map(row => row.performed), [1, 1]);
  assert.deepEqual(report.rows.map(row => row.eligible), [1, 1]);
  assert.deepEqual(report.rows.map(row => row.inferred), [1, 0]);
  assert.equal(report.metrics.performed, 2);
  assert.equal(report.metrics.eligible, 2);
  assert.equal(report.metrics.inferred, 1);
  assert.equal(report.metrics.success, 1);
  assert.equal(report.metrics.failed, 1);
  assert.deepEqual(summarizeCallbackRows(report.rows), report.metrics);
});

test('não infere elegibilidade fora de 30 minutos ou sem operador em comum', () => {
  const values = [interactions[0],
    ['late', 'voz', 'Entrada', 'Ana', '', '03/09/2026 10:00', '03/09/2026 10:05', '', 'Microtema', 'tel:901', 'tel:100'],
    ['other', 'voz', 'Entrada', 'Ana', '', '03/09/2026 11:00', '03/09/2026 11:05', '', 'Microtema', 'tel:902', 'tel:100'],
    ['r1', 'voz', 'Saída', 'Ana', '1', '03/09/2026 10:36', '03/09/2026 10:37', '', '', 'sip:ana', 'tel:901'],
    ['r2', 'voz', 'Saída', 'Bia', '1', '03/09/2026 11:20', '03/09/2026 11:21', '', '', 'sip:bia', 'tel:902'],
  ];
  const report = callbackReport(values, [callbacks[0]]);
  assert.equal(report.metrics.performed, 2);
  assert.equal(report.metrics.eligible, 0);
  assert.equal(report.metrics.inferred, 0);
});
