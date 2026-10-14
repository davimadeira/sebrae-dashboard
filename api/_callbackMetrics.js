const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const cell = (row, index) => String(row[index] ?? '').trim();
const invalid = message => Object.assign(new Error(message), { statusCode: 409 });

function hasConversation(value) {
  const duration = String(value ?? '').trim().replace(',', '.');
  if (!duration) return false;
  if (/^\d+(?:\.\d+)?$/.test(duration)) return Number(duration) > 0;
  const time = /^(\d+):([0-5]\d):([0-5]\d(?:\.\d+)?)$/.exec(duration);
  return !!time && Number(time[1]) * 3600 + Number(time[2]) * 60 + Number(time[3]) > 0;
}

function columns(values, labels) {
  const headers = values[0] || [];
  const indices = Object.fromEntries(labels.map(label => [label, headers.findIndex(header => normalize(header) === normalize(label))]));
  if (Object.values(indices).some(index => index < 0)) {
    throw invalid('A estrutura da planilha Callback mudou. Confira os cabeçalhos das abas Interações e Callbacks.');
  }
  return indices;
}

export function callbackMetrics(interactionsValues = [], callbacksValues = []) {
  const i = columns(interactionsValues, ['ID de conversa', 'Tipo de mídia', 'Direção', 'Usuários', 'Total de conversas']);
  const c = columns(callbacksValues, ['ID da chamada original', 'Status do callback']);
  const callbacks = new Map();
  for (const row of callbacksValues.slice(1)) {
    const id = normalize(cell(row, c['ID da chamada original']));
    if (!id) continue;
    const status = normalize(cell(row, c['Status do callback']));
    if (!['sucesso', 'insucesso', 'sem saida identificada'].includes(status)) {
      throw invalid('Há um status de callback não reconhecido. Use Sucesso, Insucesso ou Sem saída identificada.');
    }
    if (callbacks.has(id) && callbacks.get(id) !== status) {
      throw invalid('Há resultados diferentes para o mesmo ID na aba Callbacks. Revise os registros duplicados.');
    }
    callbacks.set(id, status);
  }
  const inbound = new Set(), answered = new Set(), mixed = new Set();
  for (const row of interactionsValues.slice(1)) {
    const id = normalize(cell(row, i['ID de conversa']));
    if (!id || normalize(cell(row, i['Tipo de mídia'])) !== 'voz') continue;
    const direction = normalize(cell(row, i['Direção']));
    if (direction === 'entrada/saida') mixed.add(id);
    if (direction !== 'entrada') continue;
    inbound.add(id);
    if (cell(row, i['Usuários']) && hasConversation(cell(row, i['Total de conversas']))) {
      answered.add(id);
    }
  }
  const statuses = [...callbacks.values()];
  const success = statuses.filter(status => status === 'sucesso').length;
  const failed = statuses.filter(status => status === 'insucesso').length;
  const performed = success + failed;
  const rate = (value, total) => total ? value / total : null;
  return {
    received: inbound.size,
    // This export has no ACD acceptance events. Never substitute agent count for Answered.
    answered: null,
    unique: answered.size,
    // A nonempty wrap-up is not proof of completion; its classification is still pending.
    finished: null,
    eligible: callbacks.size,
    performed, success, failed,
    pending: callbacks.size - performed,
    performedRate: rate(performed, callbacks.size),
    successRate: rate(success, performed),
    failedRate: rate(failed, performed),
    potential: null,
    registered: null,
    registeredRate: null,
    mixed: mixed.size,
  };
}

function dayKey(value) {
  const raw = String(value ?? '').trim();
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})(?:\s|$)/.exec(raw);
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/.exec(raw);
  if (!br && !iso) return 'Sem data';
  let [year, month, day] = br ? [Number(br[3]), Number(br[2]), Number(br[1])] : [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  if (year < 100) year += 2000;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return 'Sem data';
  return date.toISOString().slice(0, 10);
}

export function callbackReport(interactions, callbacks) {
  const i = columns(interactions, ['Data', 'ID de conversa']);
  const c = columns(callbacks, ['Data da chamada', 'ID da chamada original']);
  const buckets = new Map();
  const group = (values, dateIndex, idIndex, kind) => {
    const seen = new Map();
    for (const row of values.slice(1)) {
      const id = normalize(cell(row, idIndex));
      if (!id) continue;
      const date = dayKey(cell(row, dateIndex));
      if (seen.has(id) && seen.get(id) !== date) throw invalid('Há datas diferentes para o mesmo ID de conversa. Revise a base antes da apuração diária.');
      seen.set(id, date);
      if (!buckets.has(date)) buckets.set(date, { interactions: [interactions[0]], callbacks: [callbacks[0]] });
      buckets.get(date)[kind].push(row);
    }
  };
  group(interactions, i.Data, i['ID de conversa'], 'interactions');
  group(callbacks, c['Data da chamada'], c['ID da chamada original'], 'callbacks');
  return {
    metrics: callbackMetrics(interactions, callbacks),
    rows: [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({
      date, ...callbackMetrics(values.interactions, values.callbacks),
    })),
  };
}
