import test from 'node:test';
import assert from 'node:assert/strict';
import { callbackReport } from '../api/_callbackMetrics.js';
import { callbackDateLabels, filterCallbackRows, summarizeCallbackRows } from '../src/utils/callbackView.js';

const interactions = [
  ['ID de conversa', 'Tipo de mídia', 'Direção', 'Usuários', 'Total de conversas', 'Data', 'Marca externa', 'Finalização', 'ANI'],
  ['a', 'voz', 'Entrada', 'Ana', '00:01:00', '01/09/26 23:59', 'p1', '', 'tel:+55'],
  ['b', 'voz', 'Entrada', 'Ana', '', '02/09/2026 10:00', 'p2', 'Queda de ligação', 'tel:+55'],
  ['c', 'voz', 'Saída', 'Ana', '00:00:00.001', '2026-10-08T12:00:00', 'p3', '', 'sip:callback'],
  ['d', 'voz', 'Entrada', 'Ana', '', '31/02/2026', 'p4', '', 'tel:+55'],
];
const callbacks = [
  ['ID da chamada original', 'Status do callback', 'Data da chamada', 'Primeiro retorno'],
  ['a', 'Sucesso', '01/09/26 23:59', '02/09/26 00:10'],
  ['b', 'Sem saída identificada', '02/09/2026 10:00'],
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
test('não conta o mesmo ID em dois dias diferentes', () => {
  assert.throws(() => callbackReport([...interactions, ['a', 'voz', 'Entrada', 'Ana', '00:01:00', '02/09/26', '', '', 'tel:+55']], callbacks), /datas diferentes/);
});
