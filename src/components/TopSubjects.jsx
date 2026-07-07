import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

const TopSubjects = ({ data = [] }) => {
  const subjectCount = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    const counts = {};
    data.forEach(item => {
      const subject = item.assunto || 'Sem classificação';
      // 🔥 CORTA NOMES MUITO LONGOS PARA EXIBIÇÃO
      const shortSubject = subject.length > 30 ? subject.substring(0, 28) + '...' : subject;
      counts[shortSubject] = (counts[shortSubject] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data]);

  const getColor = (index) => {
    const intensity = 1 - (index / (subjectCount.length || 1)) * 0.6;
    return `hsl(24, 100%, ${40 + intensity * 30}%)`;
  };

  const total = data?.length || 0;
  const top1 = subjectCount[0];

  if (!subjectCount || subjectCount.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-6 h-full border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-500/10 p-2 rounded-lg">
            <Award className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Top Assuntos
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Aguardando dados...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          Nenhum assunto encontrado
        </div>
      </motion.div>
    );
  }

  const isDarkMode = document.documentElement.classList.contains('dark');
  const textColor = isDarkMode ? '#E2E8F0' : '#374151';
  const gridColor = isDarkMode ? '#334155' : '#E5E7EB';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-6 h-full border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/10 p-2 rounded-lg">
            <Award className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Top Assuntos
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {subjectCount.length} assuntos diferentes
            </p>
          </div>
        </div>
        {top1 && (
          <div className="text-right bg-sebrae-orange/5 px-3 py-1 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400">Top 1</span>
            <p className="text-sm font-bold text-sebrae-orange truncate max-w-[120px]">
              {top1.name}
            </p>
          </div>
        )}
      </div>

      {/* 🔥 AUMENTEI A ALTURA PARA 80 PARA DAR MAIS ESPAÇO */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={subjectCount}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}  // 👈 right: 30 para dar espaço
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            
            <XAxis
              type="number"
              tick={{ fill: textColor, fontSize: 10 }}
              className="text-xs"
            />
            
            {/* 🔥 YAXIS COM MAIS ESPAÇO E FONTE MENOR */}
            <YAxis
              type="category"
              dataKey="name"
              width={180}  // 👈 ERA 150, AGORA 180
              tick={{ fill: textColor, fontSize: 9 }}  // 👈 ERA 8, AGORA 9
              className="text-xs"
              interval={0}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                border: isDarkMode ? '1px solid #334155' : '1px solid #E5E7EB',
                borderRadius: '8px',
                color: isDarkMode ? '#E2E8F0' : '#111827',
                fontSize: '12px'
              }}
              formatter={(value) => [`${value} chamados`, 'Quantidade']}
            />
            
            {/* 🔥 BARRA COM LABEL PARA MOSTRAR VALOR */}
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              label={{ 
                position: 'right', 
                fontSize: 10, 
                fill: textColor,
                formatter: (value) => `${value}`
              }}
            >
              {subjectCount.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">Principal assunto</p>
          <p className="font-semibold text-gray-800 dark:text-white truncate">
            {subjectCount[0]?.name || '-'}
          </p>
          <p className="text-sebrae-orange font-medium">
            {subjectCount[0]?.value || 0} chamados
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">% do total</p>
          <p className="font-semibold text-gray-800 dark:text-white">
            {total > 0 ? Math.round((subjectCount[0]?.value / total) * 100) : 0}%
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            de {total} chamados
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default TopSubjects;