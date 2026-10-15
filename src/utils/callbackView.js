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
  const keys = ['received', 'unique', 'finished', 'eligible', 'performed', 'success', 'failed', 'pending', 'mixed'];
  const total = Object.fromEntries(keys.map(key => [key, rows.reduce((sum, row) => sum + row[key], 0)]));
  const rate = (value, denominator) => denominator ? value / denominator : null;
  return { ...total, answered: null, potential: null, registered: null, registeredRate: null,
    performedRate: rate(total.performed, total.eligible), successRate: rate(total.success, total.performed), failedRate: rate(total.failed, total.performed) };
}

export function filterCallbackDateRange(rows, { start = '', end = '' } = {}) {
  if (start && end && start > end) return [];
  if (!start && !end) return rows;
  return rows.filter(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && (!start || row.date >= start) && (!end || row.date <= end));
}
