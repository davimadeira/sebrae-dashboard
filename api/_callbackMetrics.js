const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const headerKey = value => normalize(value).replace(/[^a-z0-9]/g, '');
const cell = (row, index) => String(row[index] ?? '').trim();
const invalid = message => Object.assign(new Error(message), { statusCode: 409 });

const eligibleFinalizations = ['erro sistemico', 'queda de ligacao', 'ligacao muda', 'falta de interacao'];

function isEligibleFinalization(value) {
  const finalization = normalize(value);
  return eligibleFinalizations.some(eligible => finalization.includes(eligible));
}

function columns(values, labels, sheet = 'Interações') {
  const headers = values[0] || [];
  const indices = Object.fromEntries(labels.map(label => [label, headers.findIndex(header => normalize(header) === normalize(label))]));
  if (Object.values(indices).some(index => index < 0)) throw invalid(`A estrutura da aba ${sheet} mudou. Confira os cabeçalhos antes de atualizar o painel Callback.`);
  return indices;
}

function customerKey(value) {
  const normalized = normalize(value).replace(/^tel:/, '');
  return normalized.replace(/\D/g, '') || normalized;
}

function dateTime(value) {
  const raw = String(value ?? '').trim();
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,3}))?)?)?$/.exec(raw);
  if (br) {
    let year = Number(br[3]); if (year < 100) year += 2000;
    const month = Number(br[2]), day = Number(br[1]), hour = Number(br[4] || 0), minute = Number(br[5] || 0), second = Number(br[6] || 0), millisecond = Number(String(br[7] || '').padEnd(3, '0'));
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && date.getUTCHours() === hour && date.getUTCMinutes() === minute ? date.getTime() : null;
  }
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function operatorSet(value) {
  return new Set(String(value ?? '').split(/[;|]/).map(normalize).filter(Boolean));
}

function sharesOperator(left, right) {
  if (!left.size || !right.size) return false;
  for (const operator of left) if (right.has(operator)) return true;
  return false;
}

function inferredEligibleOrigins(values, windowMinutes = 30) {
  const c = columns(values, ['ID de conversa', 'Tipo de mídia', 'Direção', 'Usuários', 'Data', 'Data de término', 'ANI', 'DNIS']);
  const originsByPhone = new Map(), returnsByPair = new Map();
  for (const row of values.slice(1)) {
    if (normalize(cell(row, c['Tipo de mídia'])) !== 'voz') continue;
    const direction = normalize(cell(row, c['Direção']));
    if (direction === 'entrada') {
      const id = normalize(cell(row, c['ID de conversa']));
      const ani = normalize(cell(row, c.ANI));
      const phone = customerKey(ani);
      const end = dateTime(cell(row, c['Data de término']));
      if (!id || !ani.startsWith('tel:') || !phone || end === null) continue;
      if (!originsByPhone.has(phone)) originsByPhone.set(phone, []);
      originsByPhone.get(phone).push({ id, end, operators: operatorSet(cell(row, c['Usuários'])) });
      continue;
    }
    if (!['saida', 'entrada/saida'].includes(direction)) continue;
    const sip = normalize(cell(row, c.ANI)), dnis = normalize(cell(row, c.DNIS)), customer = customerKey(dnis);
    const start = dateTime(cell(row, c.Data));
    if (!sip.startsWith('sip:') || !dnis.startsWith('tel:') || !customer || start === null) continue;
    const pair = `${dayKey(cell(row, c.Data))}\u0000${sip}\u0000${customer}`;
    if (!returnsByPair.has(pair)) returnsByPair.set(pair, []);
    returnsByPair.get(pair).push({ start, customer, operators: operatorSet(cell(row, c['Usuários'])) });
  }
  for (const origins of originsByPhone.values()) origins.sort((a, b) => b.end - a.end);
  for (const attempts of returnsByPair.values()) attempts.sort((a, b) => a.start - b.start);
  const inferred = new Set(), windowMs = windowMinutes * 60 * 1000;
  for (const attempts of returnsByPair.values()) {
    for (const attempt of attempts) {
      const origin = (originsByPhone.get(attempt.customer) || []).find(candidate => {
        const delay = attempt.start - candidate.end;
        return delay >= 0 && delay <= windowMs && sharesOperator(attempt.operators, candidate.operators);
      });
      if (origin) { inferred.add(origin.id); break; }
    }
  }
  return inferred;
}

function hasConversation(value) {
  const raw = String(value ?? '').trim().replace(',', '.');
  if (!raw) return false;
  const number = Number(raw);
  if (Number.isFinite(number)) return number > 0;
  const time = /^(\d+):(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/.exec(raw);
  if (!time) return false;
  return Number(time[1]) * 3600 + Number(time[2]) * 60 + Number(time[3]) > 0;
}

function callbackResults(values) {
  const c = columns(values, ['Tipo de mídia', 'Direção', 'ANI', 'DNIS', 'Total de conversas']);
  const performed = new Set(), success = new Set();
  for (const row of values.slice(1)) {
    const direction = normalize(cell(row, c['Direção']));
    const sip = normalize(cell(row, c.ANI));
    const dnis = normalize(cell(row, c.DNIS));
    const customer = customerKey(dnis);
    if (normalize(cell(row, c['Tipo de mídia'])) !== 'voz' || !['saida', 'entrada/saida'].includes(direction)) continue;
    if (!sip.startsWith('sip:') || !dnis.startsWith('tel:') || !customer) continue;
    const pair = `${sip}\u0000${customer}`;
    performed.add(pair);
    if (hasConversation(cell(row, c['Total de conversas']))) success.add(pair);
  }
  return { performed: performed.size, success: success.size, failed: performed.size - success.size };
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

export function callbackMetrics(interactionsValues = [], callbacksValues = [], focoValues = [], registeredOverride, receivedOverride, inferredEligible = new Set()) {
  const i = columns(interactionsValues, ['ID de conversa', 'Tipo de mídia', 'Direção', 'Finalização']);
  const focoByDate = registeredOverride === undefined ? focoTelephoneByDate(focoValues) : null;
  const inbound = new Set(), mixed = new Set(), explicit = new Set();
  for (const row of interactionsValues.slice(1)) {
    const id = normalize(cell(row, i['ID de conversa']));
    if (!id || normalize(cell(row, i['Tipo de mídia'])) !== 'voz') continue;
    const direction = normalize(cell(row, i['Direção']));
    if (direction === 'entrada/saida') mixed.add(id);
    if (direction !== 'entrada') continue;
    inbound.add(id);
    if (isEligibleFinalization(cell(row, i.Finalização))) explicit.add(id);
  }
  const inferred = new Set([...inbound].filter(id => inferredEligible.has(id) && !explicit.has(id)));
  const eligible = new Set([...explicit, ...inferred]);
  const { performed, success, failed } = callbackResults(interactionsValues);
  const rate = (value, total) => total ? value / total : null;
  const unique = inbound.size;
  const finished = Math.max(unique - eligible.size, 0);
  const potential = finished + success;
  const registered = registeredOverride === undefined ? (focoByDate ? [...focoByDate.values()].reduce((sum, count) => sum + count, 0) : null) : registeredOverride;
  return { received: receivedOverride === undefined ? null : receivedOverride, answered: null, unique, finished, eligible: eligible.size, inferred: inferred.size, performed, success, failed, pending: Math.max(eligible.size - performed, 0), performedRate: rate(performed, eligible.size), successRate: rate(success, performed), failedRate: rate(failed, performed), potential, registered, registeredRate: registered === null ? null : rate(registered, potential), mixed: mixed.size };
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

function summarizeMetrics(rows, received, registered) {
  const keys = ['unique', 'finished', 'eligible', 'inferred', 'performed', 'success', 'failed', 'potential', 'mixed'];
  const total = Object.fromEntries(keys.map(key => [key, rows.reduce((sum, row) => sum + row[key], 0)]));
  const rate = (value, denominator) => denominator ? value / denominator : null;
  total.pending = Math.max(total.eligible - total.performed, 0);
  return { ...total, received, answered: null, registered,
    performedRate: rate(total.performed, total.eligible), successRate: rate(total.success, total.performed),
    failedRate: rate(total.failed, total.performed), registeredRate: registered === null ? null : rate(registered, total.potential) };
}

export function callbackReport(interactions, callbacks = [], foco = [], receivedByDate = new Map()) {
  const i = columns(interactions, ['Data', 'ID de conversa']);
  const buckets = new Map(), seen = new Map(), focoByDate = focoTelephoneByDate(foco), inferredEligible = inferredEligibleOrigins(interactions);
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
  const rows = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, ...callbackMetrics([interactions[0], ...values], callbacks, foco, focoByDate ? focoByDate.get(date) || 0 : null, receivedByDate.has(date) ? receivedByDate.get(date) : null, inferredEligible) }));
  return { metrics: summarizeMetrics(rows, receivedTotal, registeredTotal), rows };
}
