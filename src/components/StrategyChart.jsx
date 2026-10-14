import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Headphones } from 'lucide-react';

const StrategyChart = ({ data }) => {
  const strategyData = useMemo(() => {
    let chat = 0, voz = 0, outros = 0;
    data.forEach(item => {
      const estrategia = (item.estrategia || '').trim().toUpperCase();
      if (!estrategia || estrategia.includes('CHAT')) chat++;
      else if (estrategia.includes('VOZ')) voz++;
      else outros++;
    });
    return [
      { name: 'Chat', value: chat },
      { name: 'Voz', value: voz },
      { name: 'Outros', value: outros }
    ];
  }, [data]);

  const COLORS = ['#3B82F6', '#10B981', '#9CA3AF'];
  const total = strategyData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
      >
        <p className="text-center text-gray-500 dark:text-gray-400">Sem dados de estratégia</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-indigo-500/10 p-2 rounded-lg">
          <Headphones className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Estratégia de Atendimento
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {total} chamados analisados
          </p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={strategyData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={95}
              labelLine={false}
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              labelStyle={{ fontSize: '10px', fill: '#6B7280' }}
            >
              {strategyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              formatter={(value, name) => [`${value} chamados (${((value / total) * 100).toFixed(1)}%)`, name]}
            />
            <Legend
              wrapperStyle={{
                fontSize: '10px',
                paddingTop: '4px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}
              layout="horizontal"
              verticalAlign="top"
              align="center"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {strategyData.map((item) => (
          <div key={item.name} className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg text-center">
            <p className={`font-semibold ${item.name === 'Chat' ? 'text-blue-600' : item.name === 'Voz' ? 'text-emerald-600' : 'text-gray-500'}`}>
              {item.value}
            </p>
            <p className="text-gray-500 dark:text-gray-400">{item.name}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default StrategyChart;
