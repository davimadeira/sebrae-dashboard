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
  const keys = ['unique', 'finished', 'eligible', 'inferred', 'performed', 'success', 'failed', 'pending', 'potential', 'mixed'];
  const total = Object.fromEntries(keys.map(key => [key, rows.reduce((sum, row) => sum + (typeof row[key] === 'number' ? row[key] : 0), 0)]));
  const receivedRows = rows.filter(row => typeof row.received === 'number');
  total.received = receivedRows.length
    ? receivedRows.reduce((sum, row) => sum + row.received, 0)
    : null;
  // Recalculate the filtered total from eligible original IDs and their
  // linked results so the period follows the same formula as each day.
  total.pending = Math.max(total.eligible - total.performed, 0);
  const registered = rows.length && rows.every(row => typeof row.registered === 'number')
    ? rows.reduce((sum, row) => sum + row.registered, 0)
    : null;
  const rate = (value, denominator) => denominator ? value / denominator : null;
  return { ...total, answered: null, registered, registeredRate: registered === null ? null : rate(registered, total.potential),
    performedRate: rate(total.performed, total.eligible), successRate: rate(total.success, total.performed), failedRate: rate(total.failed, total.performed) };
}

export function filterCallbackDateRange(rows, { start = '', end = '' } = {}) {
  if (start && end && start > end) return [];
  if (!start && !end) return rows;
  return rows.filter(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && (!start || row.date >= start) && (!end || row.date <= end));
}
