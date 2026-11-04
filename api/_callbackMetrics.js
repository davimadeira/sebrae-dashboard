const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const headerKey = value => normalize(value).replace(/[^a-z0-9]/g, '');
const cell = (row, index) => String(row[index] ?? '').trim();
const invalid = message => Object.assign(new Error(message), { statusCode: 409 });

const eligibleFinalizations = new Set(['erro sistemico', 'queda de ligacao', 'ligacao muda', 'ligacao muda/caida', 'falta de interacao']);

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
  if (Object.values(indices).some(index => index < 0)) throw invalid('A estrutura da aba Interações mudou. Confira os cabeçalhos antes de atualizar o painel Callback.');
  return indices;
}

function focoTelephoneByDate(values) {
  const headerIndex = values.findIndex(row => row.some(value => headerKey(value) === 'canaldeatendimento'));
  if (headerIndex < 0) return null;
  const headers = values[headerIndex];
  const index = label => headers.findIndex(value => headerKey(value) === label);
  const date = index('datadeabertura'), channel = index('canaldeatendimento');
  if (date < 0 || channel < 0) return null;
  const result = new Map(); let inheritedDate = '', inheritedChannel = '';
  for (const row of values.slice(headerIndex + 1)) {
    // O indicador é quantidade de linhas de Telefonia. Protocolo e interação
    // podem se repetir ou estar vazios e, por isso, não entram como critério.
    if (!row.some(value => cell([value], 0))) continue;
    const rowDate = cell(row, date), rowChannel = cell(row, channel);
    if (rowDate) inheritedDate = rowDate;
    if (rowChannel) inheritedChannel = rowChannel;
    if (!normalize(inheritedChannel).startsWith('telefon')) continue;
    const key = dayKey(inheritedDate);
    result.set(key, (result.get(key) || 0) + 1);
  }
  return result;
}

export function callbackMetrics(interactionsValues = [], _callbacksValues = [], focoValues = [], registeredOverride, receivedOverride) {
  const i = columns(interactionsValues, ['ID de conversa', 'Tipo de mídia', 'Direção', 'Usuários', 'Finalização', 'Total de conversas', 'ANI']);
  const focoByDate = registeredOverride === undefined ? focoTelephoneByDate(focoValues) : null;
  const inbound = new Set(), mixed = new Set(), eligible = new Set();
  const successfulCallbacks = new Set(), failedCallbacks = new Set();
  for (const row of interactionsValues.slice(1)) {
    const id = normalize(cell(row, i['ID de conversa']));
    if (!id || normalize(cell(row, i['Tipo de mídia'])) !== 'voz') continue;
    const direction = normalize(cell(row, i['Direção']));
    const ani = normalize(cell(row, i.ANI));
    const conversation = hasConversation(cell(row, i['Total de conversas']));
    if (ani.startsWith('sip:')) {
      if (conversation) successfulCallbacks.add(id); else failedCallbacks.add(id);
    }
    if (direction === 'entrada/saida') mixed.add(id);
    if (direction !== 'entrada') continue;
    inbound.add(id);
    if (eligibleFinalizations.has(normalize(cell(row, i.Finalização)))) eligible.add(id);
  }
  const success = successfulCallbacks.size;
  const failed = [...failedCallbacks].filter(id => !successfulCallbacks.has(id)).length;
  const performed = success + failed;
  const rate = (value, total) => total ? value / total : null;
  const unique = inbound.size;
  const finished = Math.max(unique - eligible.size, 0);
  const potential = finished + success;
  const registered = registeredOverride === undefined ? (focoByDate ? [...focoByDate.values()].reduce((sum, count) => sum + count, 0) : null) : registeredOverride;
  return { received: receivedOverride === undefined ? null : receivedOverride, answered: null, unique, finished, eligible: eligible.size, performed, success, failed, pending: Math.max(eligible.size - performed, 0), performedRate: rate(performed, eligible.size), successRate: rate(success, performed), failedRate: rate(failed, performed), potential, registered, registeredRate: registered === null ? null : rate(registered, potential), mixed: mixed.size };
}

function dayKey(value) {
  const raw = String(value ?? '').trim();
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})(?:\s|$)/.exec(raw), iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/.exec(raw);
  if (!br && !iso) return 'Sem data';
  let [year, month, day] = br ? [Number(br[3]), Number(br[2]), Number(br[1])] : [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  if (year < 100) year += 2000;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date.toISOString().slice(0, 10) : 'Sem data';
}

export function callbackReport(interactions, callbacks = [], foco = [], receivedByDate = new Map()) {
  const i = columns(interactions, ['Data', 'ID de conversa']);
  const buckets = new Map(), seen = new Map(), focoByDate = focoTelephoneByDate(foco);
  for (const row of interactions.slice(1)) {
    const id = normalize(cell(row, i['ID de conversa'])); if (!id) continue;
    const date = dayKey(cell(row, i.Data));
    if (seen.has(id) && seen.get(id) !== date) throw invalid('Há datas diferentes para o mesmo ID de conversa. Revise a base antes da apuração diária.');
    seen.set(id, date); if (!buckets.has(date)) buckets.set(date, []); buckets.get(date).push(row);
  }
  if (focoByDate) for (const date of focoByDate.keys()) if (!buckets.has(date)) buckets.set(date, []);
  for (const date of receivedByDate.keys()) if (!buckets.has(date)) buckets.set(date, []);
  const registeredTotal = focoByDate ? [...focoByDate.values()].reduce((sum, count) => sum + count, 0) : null;
  const receivedTotal = receivedByDate.size ? [...receivedByDate.values()].reduce((sum, count) => sum + count, 0) : null;
  return { metrics: callbackMetrics(interactions, callbacks, foco, registeredTotal, receivedTotal), rows: [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, rows]) => ({ date, ...callbackMetrics([interactions[0], ...rows], callbacks, foco, focoByDate ? focoByDate.get(date) || 0 : null, receivedByDate.has(date) ? receivedByDate.get(date) : null) })) };
}
