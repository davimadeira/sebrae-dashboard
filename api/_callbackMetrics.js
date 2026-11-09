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

function numeric(value) {
  const number = Number(String(value ?? '').trim().replace(',', '.'));
  return Number.isFinite(number) ? number : 0;
}

function returnIndex(values) {
  const c = columns(values, ['ID de conversa', 'Tipo de mídia', 'Direção', 'ANI', 'DNIS']);
  return new Map(values.slice(1).map(row => [normalize(cell(row, c['ID de conversa'])), { row, c }]));
}

function customerKey(value) {
  const normalized = normalize(value).replace(/^tel:/, '');
  return normalized.replace(/\D/g, '') || normalized;
}

function callbackResults(values, eligible, returns) {
  const c = columns(values, ['ID da chamada original', 'Quantidade de tentativas', 'Tentativas com conversa', 'IDs dos retornos'], 'Callbacks');
  const performed = new Set(), success = new Set();
  for (const row of values.slice(1)) {
    const id = normalize(cell(row, c['ID da chamada original']));
    if (!id || !eligible.has(id)) continue;
    const attempts = numeric(cell(row, c['Quantidade de tentativas']));
    const conversations = numeric(cell(row, c['Tentativas com conversa']));
    if (attempts <= 0) continue;
    const rowReturns = new Set();
    for (const returnId of cell(row, c['IDs dos retornos']).split(/\s*\|\s*/).map(normalize).filter(Boolean)) {
      const found = returns.get(returnId); if (!found) continue;
      const { row: returned, c: r } = found;
      const direction = normalize(cell(returned, r['Direção']));
      const sip = normalize(cell(returned, r.ANI));
      const customer = customerKey(cell(returned, r.DNIS));
      if (normalize(cell(returned, r['Tipo de mídia'])) !== 'voz' || !['saida', 'entrada/saida'].includes(direction)) continue;
      if (!sip.startsWith('sip:') || !customer) continue;
      rowReturns.add(`${sip}\u0000${customer}`);
    }
    for (const returned of rowReturns) performed.add(returned);
    if (conversations > 0) for (const returned of rowReturns) success.add(returned);
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

export function callbackMetrics(interactionsValues = [], callbacksValues = [], focoValues = [], registeredOverride, receivedOverride, returnSource = interactionsValues) {
  const i = columns(interactionsValues, ['ID de conversa', 'Tipo de mídia', 'Direção', 'Finalização']);
  const focoByDate = registeredOverride === undefined ? focoTelephoneByDate(focoValues) : null;
  const inbound = new Set(), mixed = new Set(), eligible = new Set();
  for (const row of interactionsValues.slice(1)) {
    const id = normalize(cell(row, i['ID de conversa']));
    if (!id || normalize(cell(row, i['Tipo de mídia'])) !== 'voz') continue;
    const direction = normalize(cell(row, i['Direção']));
    if (direction === 'entrada/saida') mixed.add(id);
    if (direction !== 'entrada') continue;
    inbound.add(id);
    if (isEligibleFinalization(cell(row, i.Finalização))) eligible.add(id);
  }
  const returns = returnSource instanceof Map ? returnSource : returnIndex(returnSource);
  const { performed, success, failed } = callbackResults(callbacksValues, eligible, returns);
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

function summarizeMetrics(rows, received, registered) {
  const keys = ['unique', 'finished', 'eligible', 'performed', 'success', 'failed', 'potential', 'mixed'];
  const total = Object.fromEntries(keys.map(key => [key, rows.reduce((sum, row) => sum + row[key], 0)]));
  const rate = (value, denominator) => denominator ? value / denominator : null;
  total.pending = Math.max(total.eligible - total.performed, 0);
  return { ...total, received, answered: null, registered,
    performedRate: rate(total.performed, total.eligible), successRate: rate(total.success, total.performed),
    failedRate: rate(total.failed, total.performed), registeredRate: registered === null ? null : rate(registered, total.potential) };
}

export function callbackReport(interactions, callbacks = [], foco = [], receivedByDate = new Map()) {
  const i = columns(interactions, ['Data', 'ID de conversa']);
  const buckets = new Map(), seen = new Map(), focoByDate = focoTelephoneByDate(foco), returns = returnIndex(interactions);
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
  const rows = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, ...callbackMetrics([interactions[0], ...values], callbacks, foco, focoByDate ? focoByDate.get(date) || 0 : null, receivedByDate.has(date) ? receivedByDate.get(date) : null, returns) }));
  return { metrics: summarizeMetrics(rows, receivedTotal, registeredTotal), rows };
}
