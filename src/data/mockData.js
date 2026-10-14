export const mockData = [
  {
    id: '2026135052',
    dataAbertura: '01/05/2026',
    semana: 'Semana 1',
    cliente: 'ISAAC DA SILVA',
    assunto: 'EMISSOR SEBRAE/MARKETUP',
    atendente: 'LUCAS BORGES SANTANA',
    status: 'OK'
  },
  {
    id: '2026135053',
    dataAbertura: '02/05/2026',
    semana: 'Semana 1',
    cliente: 'HILLARY VICTORIA FERREIRA',
    assunto: 'EMISSOR SEBRAE/MARKETUP',
    atendente: 'KAIO CESAR MOREIRA CAVALCANTE',
    status: 'OK'
  },
  // Adicione mais 50+ registros baseados na sua planilha
  // Vou gerar automaticamente com base nos dados que você mandou
];

// Função para gerar dados estatísticos
export const generateStats = (data) => {
  const total = data.length;
  const concluidos = data.filter(d => d.status === 'OK').length;
  const pendentes = data.filter(d => d.status !== 'OK').length;
  const resolucao = total > 0 ? Math.round((concluidos / total) * 100) : 0;
  
  return { total, concluidos, pendentes, resolucao };
};