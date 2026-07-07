import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const SLAChart = ({ data }) => {
  const slaData = useMemo(() => {
    let dentro = 0;
    let fora = 0;
    let semInfo = 0;

    data.forEach(item => {
      const sla = item.sla || '';
      const slaUpper = sla.toUpperCase().trim();
      
      if (slaUpper.includes('DENTRO') || slaUpper.includes('OK') || slaUpper.includes('SIM')) {
        dentro++;
      } else if (slaUpper.includes('FORA') || slaUpper.includes('EXCEDEU') || slaUpper.includes('NÃO')) {
        fora++;
      } else {
        semInfo++;
      }
    });

    return [
      { name: 'Dentro do Prazo', value: dentro },
      { name: 'Fora do Prazo', value: fora },
      { name: 'Sem Informação', value: semInfo }
    ];
  }, [data]);

  const COLORS = ['#10B981', '#EF4444', '#9CA3AF'];
  const total = slaData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-500/10 p-2 rounded-lg">
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              SLA - Prazo de Atendimento
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sem dados disponíveis
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          Nenhum dado de SLA encontrado
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
          <div className="bg-purple-500/10 p-2 rounded-lg">
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              SLA - Prazo de Atendimento
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {total} chamados analisados
            </p>
          </div>
        </div>
        {slaData[0] && slaData[0].value > 0 && (
          <div className="text-right bg-green-500/10 px-3 py-1 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400">Dentro do prazo</span>
            <p className="text-sm font-bold text-green-600">
              {Math.round((slaData[0].value / total) * 100)}%
            </p>
          </div>
        )}
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slaData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={90}
              labelLine={true}
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              labelStyle={{ fontSize: '10px', fill: '#6B7280' }}
            >
              {slaData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index]} 
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

      {total > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-center">
            <p className="text-green-600 dark:text-green-400 font-semibold">
              {slaData[0]?.value || 0}
            </p>
            <p className="text-gray-500 dark:text-gray-400">Dentro</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg text-center">
            <p className="text-red-600 dark:text-red-400 font-semibold">
              {slaData[1]?.value || 0}
            </p>
            <p className="text-gray-500 dark:text-gray-400">Fora</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-400 font-semibold">
              {slaData[2]?.value || 0}
            </p>
            <p className="text-gray-500 dark:text-gray-400">Sem info</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SLAChart;