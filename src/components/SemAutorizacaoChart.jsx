import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const SemAutorizacaoChart = ({ data }) => {
  const autorizacaoData = useMemo(() => {
    const counts = {};

    data.forEach(item => {
      const autorizado = item.autorizadoPor || '';
      if (autorizado.toUpperCase().includes('SEM AUTORIZAÇÃO')) {
        const operador = item.abertopor || 'Desconhecido';
        counts[operador] = (counts[operador] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data]);

  if (autorizacaoData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-center text-gray-500 dark:text-gray-400">Nenhum ticket sem autorização</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <div className="bg-red-500/10 p-2 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">
            Tickets sem Autorização
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Top 5 operadores que mais abriram sem autorização
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={autorizacaoData}
            layout="vertical"
            margin={{ top: 26, right: 36, left: 120, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" horizontal={false} />
            <XAxis type="number" tick={{ fill: 'currentColor', fontSize: 11 }} className="text-xs" />
            <YAxis
              type="category"
              dataKey="name"
              width={190}
              tick={{ fill: 'currentColor', fontSize: 10 }}
              className="text-xs"
              interval={0}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '10px' }} verticalAlign="top" align="center" />
            <Bar
              dataKey="value"
              name="Tickets sem autorização"
              fill="#EF4444"
              radius={[0, 4, 4, 0]}
              label={{
                position: 'right',
                fontSize: 11,
                fill: '#EF4444',
                fontWeight: 'bold',
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default SemAutorizacaoChart;
