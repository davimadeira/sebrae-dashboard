export const normalizedHeader = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const analyticsHeaders = ['Data (InicioTratativa)', 'Nome do cliente', 'CPF', 'E-mail', 'ID Indecx', 'PERFIL', 'ID Genesys', 'COMENTÁRIO DO CLIENTE', 'DESCRIÇÃO', 'STATUS', 'DATA DE RESPOSTA (CLIENTE)', 'DATA DE CONTATO (CNR)', 'FORMA DE CONTATO', 'EMAIL FOI RESPONDIDO? (EM ANÁLISE)', 'OPERADOR RESPONSÁVEL', 'STATUS DO 1º CONTATO', 'DETALHAMENTO DO 1º CONTATO', 'OPERADOR RESPONSÁVEL', 'STATUS DO 2º CONTATO', 'DETALHAMENTO DO 2º CONTATO', 'OPERADOR RESPONSÁVEL', 'STATUS 3º CONTATO', 'DETALHAMENTO DO 3º CONTATO', 'OPERADOR RESPONSÁVEL', 'STATUS DO 4º CONTATO', 'DETALHAMENTO DO 4º CONTATO', 'SUCESSO LIGAÇÃO (FOCO)', 'CANAL DE CONCLUSÃO', 'CONCLUSÃO DO RETORNO', 'ENCAMINHAMENTO N2 (Ouvidoria)'];
export function analyticsIndexes(headers) {
  const used = new Set();
  return analyticsHeaders.map(name => { const index = headers.findIndex((h, i) => !used.has(i) && normalizedHeader(h) === normalizedHeader(name)); if (index >= 0) used.add(index); return index; });
}
export function identityIndexes(headers) {
  const find = name => headers.findIndex(h => normalizedHeader(h) === normalizedHeader(name));
  return { date: find('Data (InicioTratativa)'), name: find('Nome do cliente'), cpf: find('CPF'), genesys: find('ID Genesys') };
}
export const npsGroups = [['Cliente e identificação', 0, 7], ['Análise e resposta', 7, 14], ['1º contato', 14, 17], ['2º contato', 17, 20], ['3º contato', 20, 23], ['4º contato', 23, 26], ['Conclusão e encaminhamento', 26, 30]];
export function fieldGroups(headers) {
  const indexes = analyticsIndexes(headers), used = new Set(indexes);
  const result = npsGroups.map(([title, start, end]) => ({ title, indexes: indexes.slice(start, end).filter(i => i >= 0) }));
  const extras = headers.flatMap((h, i) => h && !used.has(i) ? [i] : []);
  if (extras.length) result.push({ title: 'Outras informações', indexes: extras });
  return result;
}
