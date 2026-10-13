const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const cell = (row, index) => String(row[index] ?? '').trim();
const invalid = message => Object.assign(new Error(message), { statusCode: 409 });

function columns(values, labels) {
  const headers = values[0] || [];
  const indices = Object.fromEntries(labels.map(label => [label, headers.findIndex(header => normalize(header) === normalize(label))]));
  if (Object.values(indices).some(index => index < 0)) {
    throw invalid('A estrutura da planilha Callback mudou. Confira os cabeçalhos das abas Interações e Callbacks.');
  }
  return indices;
}

export function callbackMetrics(interactionsValues = [], callbacksValues = []) {
  const i = columns(interactionsValues, ['ID de conversa', 'Tipo de mídia', 'Direção', 'Usuários', 'Finalização']);
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
  const inbound = new Set(), answered = new Set(), finalized = new Set();
  for (const row of interactionsValues.slice(1)) {
    const id = normalize(cell(row, i['ID de conversa']));
    if (!id || normalize(cell(row, i['Tipo de mídia'])) !== 'voz' || normalize(cell(row, i['Direção'])) !== 'entrada') continue;
    inbound.add(id);
    if (cell(row, i['Usuários'])) {
      answered.add(id);
      if (cell(row, i['Finalização']) && !callbacks.has(id)) finalized.add(id);
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
    finished: finalized.size,
    eligible: callbacks.size,
    performed, success, failed,
    pending: callbacks.size - performed,
    performedRate: rate(performed, callbacks.size),
    successRate: rate(success, performed),
    failedRate: rate(failed, performed),
    potential: finalized.size + success,
    registered: null,
    registeredRate: null,
  };
}
