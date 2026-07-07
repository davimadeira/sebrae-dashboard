import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const SemAutorizacaoChart = ({ data }) => {
  const autorizacaoData = useMemo(() => {
    const counts = {};
    data.forEach(item => {
      const autorizado = item.autorizadoPor || '';
      if (autorizado && autorizado.toUpperCase().includes('SEM AUTORIZAÇÃO')) {
        const operador = item.abertopor || 'Desconhecido';
        const nomeCurto = operador.length > 20 ? operador.substring(0, 18) + '...' : operador;
        counts[nomeCurto] = (counts[nomeCurto] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data]);

  if (autorizacaoData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <p className="text-center text-gray-500 dark:text-gray-400">Nenhum ticket sem autorização</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-red-500/10 p-2 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            ⚠️ Tickets sem Autorização
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Top 5 operadores que mais abriram sem autorização
          </p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={autorizacaoData} 
            layout="vertical" 
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" horizontal={false} />
            
            <XAxis 
              type="number" 
              tick={{ fill: 'currentColor', fontSize: 11 }}
              className="text-xs"
            />
            
// No SemAutorizacaoChart.jsx, substitua o YAxis por:

<YAxis 
  type="category" 
  dataKey="name" 
  width={140}  // 👈 ERA 120, AGORA 140
  tick={{ fill: 'currentColor', fontSize: 9 }}  // 👈 FONTE MENOR (era 10)
  className="text-xs"
  interval={0}
/>
            
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
            />
            
            <Bar 
              dataKey="value" 
              fill="#EF4444" 
              radius={[0, 4, 4, 0]}
              label={{ 
                position: 'right', 
                fontSize: 11, 
                fill: '#EF4444',
                fontWeight: 'bold'
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default SemAutorizacaoChart;