// Configurações da planilha
const SHEET_ID = '1sq5V2qrF91laGglRf6CByHOl5w6SnlVcTyGxNBZ63nw';
const API_KEY = 'AIzaSyBPlmaOy6GWnZFInYi1vVojS47r02UcE38';
const RANGE = 'Preenchimento!A:T';

export const fetchSheetData = async () => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
    );
    
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
  
  console.log('📋 CABEÇALHOS DA PLANILHA:', headers);
  
  return rows
    .filter(row => row.length > 0 && row[0] && row[0] !== '#VALOR!')
    .map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        let value = row[index] || '';
        if (typeof value === 'string') {
          value = value.trim();
        }
        
        const headerLower = header.toLowerCase().trim();

        // ========== MAPEAMENTO COMPLETO ==========
        
        // ID / Protocolo
        if (headerLower.includes('protocolo') || headerLower.includes('id') || headerLower.includes('chamado')) {
          obj.id = value;
        } 
        // 🔥 DATA DE ABERTURA - VERSÃO MAIS ROBUSTA
        else if (headerLower.includes('data') && headerLower.includes('abertura')) {
          obj.dataAbertura = value;
          console.log(`✅ Data Abertura: "${header}" -> "${value}"`);
        } 
        // 🔥 FALLBACK: Se não pegou pela regra acima, tenta exatamente "data da abertura"
        else if (headerLower === 'data da abertura') {
          obj.dataAbertura = value;
          console.log(`✅ Data Abertura (fallback): "${header}" -> "${value}"`);
        }
        // DATA DA TRATATIVA
        else if (headerLower.includes('data') && headerLower.includes('tratativa')) {
          obj.dataFinalizacao = value;
        } 
        // DATA DE FINALIZAÇÃO
        else if (headerLower.includes('data') && 
                 (headerLower.includes('finalização') || 
                  headerLower.includes('finalizacao') || 
                  headerLower.includes('encerramento'))) {
          obj.dataFinalizacao = value;
        }
        // Cliente
        else if (headerLower.includes('cliente') || headerLower.includes('solicitante')) {
          obj.cliente = value;
        } 
        // ASSUNTO - captura "Motivo de Abertura"
        else if (headerLower.includes('motivo') || 
                 headerLower.includes('assunto') || 
                 headerLower.includes('motivo da abertura') ||
                 headerLower.includes('motivo de abertura')) {
          obj.assunto = value;
        } 
        // Tratado por
        else if (headerLower.includes('tratado por') || 
                 headerLower.includes('tratadopor') || 
                 headerLower.includes('tratado')) {
          obj.tratadopor = value;
        } 
        // Encerrado por
        else if (headerLower.includes('encerrado por') || 
                 headerLower.includes('encerradopor') || 
                 headerLower.includes('encerrado')) {
          obj.encerradopor = value;
        } 
        // Aberto por
        else if (headerLower.includes('aberto por') || 
                 headerLower.includes('abertopor') || 
                 headerLower.includes('atendente') || 
                 headerLower.includes('responsavel')) {
          obj.abertopor = value;
        } 
        // Status
        else if (headerLower.includes('status') || headerLower.includes('situacao') || headerLower.includes('resolucao')) {
          obj.status = value;
        } 
        // Observação
        else if (headerLower.includes('observacao') || headerLower.includes('detalhe')) {
          obj.observacao = value;
        } 
        // Órgão Emissor
        else if (headerLower.includes('órgão') || 
                 headerLower.includes('orgão') || 
                 headerLower.includes('orgao') ||
                 headerLower.includes('uf') || 
                 headerLower.includes('emissor') || 
                 headerLower.includes('ead')) {
          obj.orgaoEmissor = value;
        } 
        // PROCEDENTES CNR
        else if (headerLower === 'procedentes' || 
                 (headerLower.includes('procedentes') && !headerLower.includes('retorno'))) {
          obj.procedentesCNR = value;
        } 
        // PROCEDENTES BKO
        else if (headerLower.includes('retorno procedente do estado') || 
                 headerLower.includes('retorno procedente')) {
          obj.procedentesBKO = value;
        } 
        // Máscara
        else if (headerLower.includes('máscara') || headerLower.includes('mascara')) {
          obj.usouMascara = value;
        }
        // Autorizado por
        else if (headerLower.includes('autorizado')) {
          obj.autorizadoPor = value;
        }
        // SLA
        else if (headerLower.includes('sla') || headerLower.includes('prazo')) {
          obj.sla = value;
        }
        // Estratégia
        else if (headerLower.includes('estratégia') || headerLower.includes('estrategia')) {
          obj.estrategia = value;
        }
        // MÊS
        else if (headerLower.includes('mês') || headerLower.includes('mes')) {
          obj.mes = value;
        }
        else {
          const key = headerLower
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
          obj[key] = value;
        }
      });
      
      // 🔥 SE AINDA NÃO TEM DATA DE ABERTURA, TENTA ENCONTRAR EM QUALQUER CAMPO QUE PARECE DATA
      if (!obj.dataAbertura) {
        // Procura em todas as chaves por algo que pareça data
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (typeof val === 'string' && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(val)) {
            obj.dataAbertura = val;
            console.log(`✅ Data Abertura encontrada em campo genérico: "${key}" -> "${val}"`);
            break;
          }
        }
      }
      
      // GERA A SEMANA BASEADA NA DATA DE ABERTURA
      if (obj.dataAbertura && !obj.semana) {
        obj.semana = getWeekFromDate(obj.dataAbertura);
      }
      
      // GERA O MÊS BASEADO NA DATA DE ABERTURA (se não tiver coluna Mês)
      if (obj.dataAbertura && !obj.mes) {
        obj.mes = getMonthYear(obj.dataAbertura);
      }
      
      // PADRONIZA O STATUS
      if (obj.status) {
        const statusUpper = obj.status.toUpperCase().trim();
        if (statusUpper === 'OK' || statusUpper === 'CONCLUÍDO' || statusUpper === 'FINALIZADO') {
          obj.status = 'OK';
        } else if (statusUpper === 'PENDENTE' || statusUpper === 'EM ANDAMENTO') {
          obj.status = 'Pendente';
        }
      }
      
      return obj;
    });
};

function getWeekFromDate(dateStr) {
  if (!dateStr) return 'Semana sem classificação';
  
  try {
    let date;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        if (year > 2000) {
          date = new Date(year, month - 1, day);
        } else {
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      }
    } else {
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) {
      return 'Semana sem classificação';
    }
    
    const dayOfMonth = date.getDate();
    let weekNumber = Math.ceil(dayOfMonth / 7);
    if (dayOfMonth === 31) weekNumber = 4;
    
    const startDay = (weekNumber - 1) * 7 + 1;
    const endDay = Math.min(weekNumber * 7, 30);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `Semana ${weekNumber} (${String(startDay).padStart(2, '0')}/${month} a ${String(endDay).padStart(2, '0')}/${month})`;
  } catch (e) {
    return 'Semana sem classificação';
  }
}

export function getMonthYear(dateStr) {
  if (!dateStr) return null;
  
  try {
    let day, month, year;
    
    // Tenta DD/MM/AAAA
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
      }
    } 
    // Tenta DD-MM-AAAA
    else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
      }
    }
    // Tenta criar a data diretamente
    else {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        day = date.getDate();
        month = date.getMonth() + 1;
        year = date.getFullYear();
      }
    }
    
    if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
      return null;
    }
    
    if (year < 100) {
      year = 2000 + year;
    }
    
    const monthStr = String(month).padStart(2, '0');
    const yearStr = String(year);
    
    return `${monthStr}/${yearStr}`;
  } catch (e) {
    return null;
  }
}