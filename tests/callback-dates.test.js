import test from 'node:test';
import assert from 'node:assert/strict';
import { callbackReport } from '../api/_callbackMetrics.js';
import { callbackDateLabels, filterCallbackRows, summarizeCallbackRows } from '../src/utils/callbackView.js';

const interactions = [
  ['ID de conversa', 'Tipo de mídia', 'Direção', 'Usuários', 'Total de conversas', 'Data'],
  ['a', 'voz', 'Entrada', 'Ana', '00:01:00', '01/09/26 23:59'],
  ['b', 'voz', 'Entrada', 'Ana', '', '02/09/2026 10:00'],
  ['c', 'voz', 'Entrada', 'Ana', '00:00:00.001', '2026-10-08T12:00:00'],
  ['d', 'voz', 'Entrada', 'Ana', '', '31/02/2026'],
];
const callbacks = [
  ['ID da chamada original', 'Status do callback', 'Data da chamada', 'Primeiro retorno'],
  ['a', 'Sucesso', '01/09/26 23:59', '02/09/26 00:10'],
  ['b', 'Sem saída identificada', '02/09/2026 10:00'],
];
test('agrupa pelo dia da origem, mantém datas inválidas visíveis e reconcilia total', () => {
  const report = callbackReport(interactions, callbacks);
  assert.deepEqual(report.rows.map(row => row.date), ['2026-09-01', '2026-09-02', '2026-10-08', 'Sem data']);
  assert.equal(report.rows[0].success, 1);
  assert.equal(report.rows[1].success, 0);
  assert.deepEqual(report.rows.map(row => row.finished), [1, 0, 1, 1]);
  assert.deepEqual(summarizeCallbackRows(report.rows), report.metrics);
});
test('combina filtros de mês, semana e dia e recalcula percentuais pelos totais', () => {
  const { rows } = callbackReport(interactions, callbacks);
  const september = filterCallbackRows(rows, { meses: ['09/2026'] });
  assert.equal(september.length, 2);
  assert.equal(summarizeCallbackRows(september).performedRate, .5);
  assert.equal(summarizeCallbackRows(september).finished, 1);
  const day = filterCallbackRows(rows, { meses: ['09/2026'], semanas: [callbackDateLabels('2026-09-01').semanas], dias: ['01/09/2026'] });
  assert.equal(day.length, 1);
  assert.equal(summarizeCallbackRows(day).performedRate, 1);
  assert.equal(filterCallbackRows(rows, { meses: ['10/2026'], dias: ['01/09/2026'] }).length, 0);
  assert.equal(summarizeCallbackRows([]).performedRate, null);
});
test('não conta o mesmo ID em dois dias diferentes', () => {
  assert.throws(() => callbackReport([...interactions, ['a', 'voz', 'Entrada', 'Ana', '00:01:00', '02/09/26']], callbacks), /datas diferentes/);
});
