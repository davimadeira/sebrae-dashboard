export function parseDateValue(dateStr) {
  if (!dateStr) return null;

  const raw = String(dateStr).trim();
  if (!raw || raw === '-') return null;

  let day;
  let month;
  let year;

  if (raw.includes('/')) {
    const [first, second, third] = raw.split('/');
    day = parseInt(first, 10);
    month = parseInt(second, 10);
    year = parseInt(third, 10);
  } else if (raw.includes('-')) {
    const [first, second, third] = raw.split('-');
    if (first.length === 4) {
      year = parseInt(first, 10);
      month = parseInt(second, 10);
      day = parseInt(third, 10);
    } else {
      day = parseInt(first, 10);
      month = parseInt(second, 10);
      year = parseInt(third, 10);
    }
  } else {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (!day || !month || !year || Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return null;
  }

  if (year < 100) year = 2000 + year;

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateBR(dateStr) {
  const date = parseDateValue(dateStr);
  if (!date) return null;

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export function getWeekFromDate(dateStr) {
  const date = parseDateValue(dateStr);
  if (!date) return 'Semana sem classificação';

  const dayOfMonth = date.getDate();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const weekNumber = Math.ceil(dayOfMonth / 7);
  const startDay = (weekNumber - 1) * 7 + 1;
  const endDay = Math.min(weekNumber * 7, daysInMonth);
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `Semana ${weekNumber} (${String(startDay).padStart(2, '0')}/${month} a ${String(endDay).padStart(2, '0')}/${month})`;
}

export function getMonthYear(dateStr) {
  const date = parseDateValue(dateStr);
  if (!date) return null;

  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}
