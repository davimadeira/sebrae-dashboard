// src/api/sheets.js
import { getWeekFromDate, getMonthYear } from '../utils/dateHelpers';

const SHEET_ID = '1sq5V2qrF91laGglRf6CByHOl5w6SnlVcTyGxNBZ63nw';
const API_KEY = 'AIzaSyBPlmaOy6GWnZFInYi1vVojS47r02UcE38';

export const fetchSheetData = async () => {
  try {
    let url;

    // Em producao, usa o proxy da Vercel para nao expor a chave no navegador.
    if (import.meta.env.PROD) {
      url = '/api/sheets'; 
    } else {
      url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Preenchimento!A:T?key=${API_KEY}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.status}`);
    }
    const data = await response.json();
    return data.values;
  } catch (error) {
    console.error('Erro na conexão com Google Sheets:', error);
    return null;
  }
};

export const formatSheetData = (rawData) => {
  if (!rawData || rawData.length < 2) return [];
  
  const headers = rawData[0];
  const rows = rawData.slice(1);
  
  console.log('Cabeçalhos da planilha:', headers);
  
  return rows
    .filter(row => row.length > 0 && row[0] && row[0] !== '#VALOR!')
    .map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        let value = row[index] || '';
        if (typeof value === 'string') {
          value = value.trim();
        }
        
        const headerLower = String(header).toLowerCase().trim();
        const normalizedHeader = headerLower
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9 ]/g, '');

        if (normalizedHeader.includes('protocolo') || normalizedHeader.includes('id') || normalizedHeader.includes('chamado')) {
          obj.id = value;
        } else if (normalizedHeader.includes('data') && normalizedHeader.includes('abertura')) {
          obj.dataAbertura = value;
        } else if (normalizedHeader === 'data da abertura') {
          obj.dataAbertura = value;
        } else if (normalizedHeader.includes('data') && normalizedHeader.includes('tratativa')) {
          obj.dataFinalizacao = value;
        } else if (normalizedHeader.includes('data') && 
                 (normalizedHeader.includes('finalizacao') || normalizedHeader.includes('encerramento'))) {
          obj.dataFinalizacao = value;
        } else if (normalizedHeader.includes('cliente') || normalizedHeader.includes('solicitante')) {
          obj.cliente = value;
        } else if (normalizedHeader.includes('motivo') || normalizedHeader.includes('assunto') || normalizedHeader.includes('motivo da abertura') || normalizedHeader.includes('motivo de abertura')) {
          obj.assunto = value;
        } else if (normalizedHeader.includes('tratado por') || normalizedHeader.includes('tratadopor') || normalizedHeader.includes('tratado')) {
          obj.tratadopor = value;
        } else if (normalizedHeader.includes('encerrado por') || normalizedHeader.includes('encerradopor') || normalizedHeader.includes('encerrado')) {
          obj.encerradopor = value;
        } else if (normalizedHeader.includes('aberto por') || normalizedHeader.includes('abertopor') || normalizedHeader.includes('atendente') || normalizedHeader.includes('responsavel')) {
          obj.abertopor = value;
        } else if (normalizedHeader.includes('status') || normalizedHeader.includes('situacao') || normalizedHeader.includes('resolucao')) {
          obj.status = value;
        } else if (normalizedHeader.includes('observacao') || normalizedHeader.includes('detalhe')) {
          obj.observacao = value;
        } else if (normalizedHeader.includes('orgao') || normalizedHeader.includes('uf') || normalizedHeader.includes('emissor') || normalizedHeader.includes('ead')) {
          obj.orgaoEmissor = value;
        } else if (normalizedHeader === 'procedentes' || (normalizedHeader.includes('procedentes') && !normalizedHeader.includes('retorno'))) {
          obj.procedentesCNR = value;
        } else if (normalizedHeader.includes('retorno procedente do estado') || normalizedHeader.includes('retorno procedente')) {
          obj.procedentesBKO = value;
        } else if (normalizedHeader.includes('mascara')) {
          obj.usouMascara = value;
        } else if (normalizedHeader.includes('autorizado')) {
          obj.autorizadoPor = value;
        } else if (normalizedHeader.includes('sla') || normalizedHeader.includes('prazo')) {
          obj.sla = value;
        } else if (normalizedHeader.includes('estrategia')) {
          obj.estrategia = value;
        } else if (normalizedHeader.includes('mes')) {
          obj.mes = value;
        } else {
          const key = headerLower
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
          obj[key] = value;
        }
      });
      
      if (!obj.dataAbertura) {
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (typeof val === 'string' && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(val)) {
            obj.dataAbertura = val;
            break;
          }
        }
      }
      
      if (obj.dataAbertura && !obj.semana) {
        obj.semana = getWeekFromDate(obj.dataAbertura);
      }
      if (obj.dataAbertura && !obj.mes) {
        obj.mes = getMonthYear(obj.dataAbertura);
      }
      
      if (obj.status) {
        const statusUpper = obj.status.toUpperCase().trim();
        if (statusUpper === 'OK' || statusUpper === 'CONCLUÍDO' || statusUpper === 'CONCLUIDO' || statusUpper === 'FINALIZADO') {
          obj.status = 'OK';
        } else if (statusUpper === 'PENDENTE' || statusUpper === 'EM ANDAMENTO') {
          obj.status = 'Pendente';
        }
      }
      
      return obj;
    });
};
