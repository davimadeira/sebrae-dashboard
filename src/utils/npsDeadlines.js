import { day, today } from './tratativaAnalytics.js';
export function deadlineSummary(rows, now = today()) {
  const result = { overdue: [], today: [], soon: [], later: [], missing: [], unclassified: [] };
  for (const row of rows.filter(r => r.lifecycle === 'open' || r.lifecycle === 'unknown')) {
    const due = day(row.deadline);
    const remaining = due === null ? null : Math.round((due - now) / 86400000);
    const key = row.lifecycle === 'unknown' ? 'unclassified' : remaining === null ? 'missing' : remaining < 0 ? 'overdue' : remaining === 0 ? 'today' : remaining <= 3 ? 'soon' : 'later';
    result[key].push({ ...row, due, remaining });
  }
  for (const rows of Object.values(result)) rows.sort((a, b) => (a.due ?? Infinity) - (b.due ?? Infinity) || a.row - b.row);
  return result;
}
export function statusSummary(analysis) {
  return [
    { label: 'Em aberto, sem resposta registrada', count: analysis.open.filter(r => !r.responded).length, color: '#f59e0b' },
    { label: 'Em aberto, com resposta registrada', count: analysis.open.filter(r => r.responded).length, color: '#3b82f6' },
    { label: 'Concluídos', count: analysis.closed, color: '#10b981' },
    { label: 'Revisar situação', count: analysis.unknown, color: '#94a3b8' },
  ];
}
