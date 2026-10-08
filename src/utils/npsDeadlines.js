import { day, normalize, today } from './tratativaAnalytics.js';
export function deadlineSummary(rows, now = today()) {
  const result = { overdue: [], today: [], soon: [], later: [], missing: [] };
  for (const row of rows.filter(r => r.lifecycle === 'open')) {
    const due = day(row.deadline);
    const remaining = due === null ? null : Math.round((due - now) / 86400000);
    const key = remaining === null ? 'missing' : remaining < 0 ? 'overdue' : remaining === 0 ? 'today' : remaining <= 3 ? 'soon' : 'later';
    result[key].push({ ...row, due, remaining });
  }
  for (const rows of Object.values(result)) rows.sort((a, b) => (a.due ?? Infinity) - (b.due ?? Infinity) || a.row - b.row);
  return result;
}
export function statusSummary(analysis) {
  return [
    { label: 'Em aberto', count: analysis.open.length, color: '#f59e0b' },
    { label: 'Respondido', count: analysis.rows.filter(r => ['respondido', 'respondida'].includes(normalize(r.values[9]))).length, color: '#10b981' },
    { label: 'A definir', count: null, color: '#94a3b8' },
    { label: 'A definir', count: null, color: '#cbd5e1' },
  ];
}
