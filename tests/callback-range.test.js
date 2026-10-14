import test from 'node:test';
import assert from 'node:assert/strict';
import { filterCallbackDateRange } from '../src/utils/callbackView.js';

const rows = ['2026-09-30', '2026-10-01', '2026-10-02', 'Sem data'].map(date => ({ date }));
test('intervalo inclusivo cruza meses e permite selecionar um só dia', () => {
  assert.deepEqual(filterCallbackDateRange(rows, { start: '2026-09-30', end: '2026-10-01' }), rows.slice(0, 2));
  assert.deepEqual(filterCallbackDateRange(rows, { start: '2026-10-01', end: '2026-10-01' }), [rows[1]]);
});
test('limites abertos, limpeza e intervalo invertido', () => {
  assert.deepEqual(filterCallbackDateRange(rows, { start: '2026-10-01' }), rows.slice(1, 3));
  assert.deepEqual(filterCallbackDateRange(rows, { end: '2026-09-30' }), [rows[0]]);
  assert.deepEqual(filterCallbackDateRange(rows, {}), rows);
  assert.deepEqual(filterCallbackDateRange(rows, { start: '2026-10-02', end: '2026-09-30' }), []);
});
