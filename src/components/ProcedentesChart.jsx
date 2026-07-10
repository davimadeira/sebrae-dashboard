import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { formatDateBR, getMonthYear, parseDateValue } from '../utils/dateHelpers';

const normalizeAnswer = (value) => String(value || '')
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase();

const ProcedentesChart = ({ data, selectedMonths = [] }) => {
  const groupByMonth = selectedMonths.length === 0;

  const chartData = useMemo(() => {
    const groups = {};

    data.forEach(item => {
      const finalizacao = parseDateValue(item.dataFinalizacao);
      if (!finalizacao) return;

      const resposta = normalizeAnswer(item.procedentesCNR || item.procedentes);
      const isProcedente = resposta === 'SIM';
      const isNaoProcedente = resposta === 'NÃO' || resposta === 'NAO';
      if (!isProcedente && !isNaoProcedente) return;

      const monthLabel = getMonthYear(item.dataFinalizacao);
      const dayLabel = formatDateBR(item.dataFinalizacao);
      const label = groupByMonth ? monthLabel : dayLabel;
      if (!label) return;

      const sortKey = groupByMonth
        ? new Date(finalizacao.getFullYear(), finalizacao.getMonth(), 1).getTime()
        : finalizacao.getTime();

      if (!groups[label]) {
        groups[label] = {
          periodo: label,
          sortKey,
          total: 0,
          procedentes: 0,
          naoProcedentes: 0,
        };
      }

      groups[label].total += 1;
      if (isProcedente) {
        groups[label].procedentes += 1;
      } else {
        groups[label].naoProcedentes += 1;
      }
    });

    return Object.values(groups)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(item => ({
        ...item,
        percProcedentes: item.total > 0 ? Math.round((item.procedentes / item.total) * 100) : 0,
      }));
  }, [data, groupByMonth]);

  const totalProcedentes = chartData.reduce((sum, item) => sum + item.procedentes, 0);
  const totalGeral = chartData.reduce((sum, item) => sum + item.total, 0);
  const percGlobal = totalGeral > 0 ? Math.round((totalProcedentes / totalGeral) * 100) : 0;
  const groupingLabel = groupByMonth ? 'mês de finalização' : 'data de finalização';

  if (chartData.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Nenhum dado de procedentes finalizados encontrado
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="h-full flex flex-col"
    >
      <div className="flex flex-wrap justify-between items-start gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/10 p-2 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">
              Evolução de Procedentes CNR
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Por {groupingLabel}: {totalProcedentes} de {totalGeral} ({percGlobal}%)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Procedentes
          </span>
          <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Não Procedentes
          </span>
          <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> %
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: -8, bottom: 12 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="periodo"
              tick={{ fill: 'currentColor', fontSize: groupByMonth ? 10 : 9 }}
              className="text-xs"
              angle={groupByMonth ? 0 : -35}
              textAnchor={groupByMonth ? 'middle' : 'end'}
              height={groupByMonth ? 32 : 56}
              interval={0}
            />
            <YAxis yAxisId="left" tick={{ fill: 'currentColor', fontSize: 10 }} className="text-xs" />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-xs" />
            <Tooltip
              labelFormatter={(label) => `${groupByMonth ? 'Mês' : 'Finalização'}: ${label}`}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(value, name) => {
                if (name === 'percProcedentes') return [`${value}%`, '% Procedentes'];
                if (name === 'procedentes') return [value, 'Procedentes CNR'];
                if (name === 'naoProcedentes') return [value, 'Não Procedentes'];
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
            <Bar yAxisId="left" dataKey="procedentes" name="Procedentes CNR" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="naoProcedentes" name="Não Procedentes" fill="#F87171" radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="percProcedentes"
              name="% Procedentes"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ fill: '#3B82F6', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default ProcedentesChart;
