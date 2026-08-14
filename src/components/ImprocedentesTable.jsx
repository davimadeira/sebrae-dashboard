import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Download, Search } from 'lucide-react';
import { formatDateBR } from '../utils/dateHelpers';

const normalizeAnswer = (value) => String(value || '')
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase();

const isImprocedenteCNR = (item) => {
  const answer = normalizeAnswer(item.procedentesCNR || item.procedentes);
  return answer === 'NAO'
    || answer === 'N'
    || answer === 'FALSE'
    || answer === '0'
    || answer.includes('IMPROCEDENTE')
    || answer.startsWith('NAO ');
};

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const ImprocedentesTable = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const improcedentes = useMemo(() => data
    .filter(isImprocedenteCNR)
    .map(item => ({
      protocolo: item.id || '-',
      dataFinalizacao: formatDateBR(item.dataFinalizacao) || item.dataFinalizacao || '-',
      abertoPor: item.abertopor || 'Não informado',
      autorizadoPor: item.autorizadoPor || 'Não informado',
      observacaoCNR: item.observacaoCNR || item.observacao || 'Sem observação',
    })), [data]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return improcedentes;
    return improcedentes.filter(row => Object.values(row).some(value =>
      String(value).toLowerCase().includes(term)
    ));
  }, [improcedentes, searchTerm]);

  const exportCSV = () => {
    if (!improcedentes.length) return;
    const headers = ['Protocolo', 'Data de finalização', 'Aberto por', 'Autorizado por', 'Observação CNR'];
    const rows = improcedentes.map(row => [
      row.protocolo,
      row.dataFinalizacao,
      row.abertoPor,
      row.autorizadoPor,
      row.observacaoCNR,
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(csvEscape).join(';'))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tickets_improcedentes_cnr.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 h-full flex flex-col"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/10 p-2 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Tickets Improcedentes CNR
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {filteredRows.length} de {improcedentes.length} improcedentes no período filtrado
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm focus:ring-2 focus:ring-sebrae-orange focus:border-transparent"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
          </div>
          <button
            onClick={exportCSV}
            disabled={!improcedentes.length}
            className="flex items-center gap-1 px-3 py-1.5 bg-sebrae-orange text-white rounded-lg hover:bg-orange-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {['Protocolo', 'Finalização', 'Aberto por', 'Autorizado por', 'Observação CNR'].map(header => (
                <th key={header} className="text-left py-3 px-3 text-gray-600 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum ticket improcedente CNR encontrado
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => (
                <tr key={`${row.protocolo}-${index}`} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors align-top">
                  <td className="py-3 px-3 text-xs font-semibold text-gray-800 dark:text-gray-100 tabular-nums">{row.protocolo}</td>
                  <td className="py-3 px-3 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.dataFinalizacao}</td>
                  <td className="py-3 px-3 text-xs text-gray-700 dark:text-gray-300">{row.abertoPor}</td>
                  <td className="py-3 px-3 text-xs text-gray-700 dark:text-gray-300">{row.autorizadoPor}</td>
                  <td className="py-3 px-3 text-xs text-gray-700 dark:text-gray-300 max-w-[420px] whitespace-normal leading-relaxed">{row.observacaoCNR}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ImprocedentesTable;
