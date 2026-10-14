import { formatDateBR, getMonthYear, getWeekFromDate } from './dateHelpers.js';

export function callbackDateLabels(date) {
  if (date === 'Sem data') return { meses: 'Sem data', semanas: 'Sem data', dias: 'Sem data' };
  return { meses: getMonthYear(date), semanas: `${getWeekFromDate(date)} · ${date.slice(0, 4)}`, dias: formatDateBR(date) };
}

export function filterCallbackRows(rows, filters) {
  return rows.filter(row => {
    const labels = callbackDateLabels(row.date);
    return ['meses', 'semanas', 'dias'].every(key => !filters[key]?.length || filters[key].includes(labels[key]));
  });
}

export function summarizeCallbackRows(rows) {
  const keys = ['received', 'unique', 'eligible', 'performed', 'success', 'failed', 'pending', 'mixed'];
  const total = Object.fromEntries(keys.map(key => [key, rows.reduce((sum, row) => sum + row[key], 0)]));
  const rate = (value, denominator) => denominator ? value / denominator : null;
  return { ...total, answered: null, finished: null, potential: null, registered: null, registeredRate: null,
    performedRate: rate(total.performed, total.eligible), successRate: rate(total.success, total.performed), failedRate: rate(total.failed, total.performed) };
}
