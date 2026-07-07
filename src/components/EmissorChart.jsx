import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

const EmissorChart = ({ data }) => {
  const emissorData = useMemo(() => {
    const counts = {};
    data.forEach(item => {
      const emissor = item.orgaoEmissor || item['órgão emissor'] || item['orgaoEmissor'] || 'Não identificado';
      if (emissor && emissor !== 'Não identificado') {
        counts[emissor] = (counts[emissor] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data]);

  const COLORS = ['#005A9C', '#FF6B00', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#F472B6'];
  const total = emissorData.reduce((sum, item) => sum + item.value, 0);

  if (emissorData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-500/10 p-2 rounded-lg">
            <Building2 className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Órgão Emissor
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sem dados disponíveis
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          Nenhum emissor encontrado
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-lg">
            <Building2 className="w-5 h-5 text-sebrae-blue" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Órgão Emissor
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {emissorData.length} emissores diferentes
            </p>
          </div>
        </div>
        {emissorData[0] && (
          <div className="text-right bg-sebrae-blue/5 px-3 py-1 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400">Principal</span>
            <p className="text-sm font-bold text-sebrae-blue truncate max-w-[100px]">
              {emissorData[0].name}
            </p>
          </div>
        )}
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={emissorData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={90}
              labelLine={true}
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              labelStyle={{ fontSize: '10px', fill: '#6B7280' }}
            >
              {emissorData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
              formatter={(value, name) => [`${value} chamados (${((value / total) * 100).toFixed(1)}%)`, name]}
            />
            <Legend
              wrapperStyle={{ 
                fontSize: '10px', 
                paddingTop: '10px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default EmissorChart;