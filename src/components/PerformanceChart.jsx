import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { Users, Trophy } from 'lucide-react';

const PerformanceChart = ({ data }) => {
  const performanceData = useMemo(() => {
    const agents = {};
    
    data.forEach(item => {
      const tratadoPor = item.tratadopor || item['tratado por'] || null;
      const encerradoPor = item.encerradopor || item['encerrado por'] || null;
      
      if (tratadoPor && tratadoPor !== 'Não atribuído') {
        if (!agents[tratadoPor]) {
          agents[tratadoPor] = { 
            nome: tratadoPor, 
            tratativas: 0, 
            encerramentos: 0 
          };
        }
        agents[tratadoPor].tratativas += 1;
      }
      
      if (encerradoPor && encerradoPor !== 'Não atribuído') {
        if (!agents[encerradoPor]) {
          agents[encerradoPor] = { 
            nome: encerradoPor, 
            tratativas: 0, 
            encerramentos: 0 
          };
        }
        agents[encerradoPor].encerramentos += 1;
      }
    });

    const result = Object.values(agents)
      .filter(agent => agent.tratativas > 0 || agent.encerramentos > 0)
      .sort((a, b) => (b.tratativas + b.encerramentos) - (a.tratativas + a.encerramentos))
      .slice(0, 10);

    return result;
  }, [data]);

  const champion = useMemo(() => {
    if (performanceData.length === 0) return null;
    return performanceData.reduce((a, b) => 
      a.encerramentos > b.encerramentos ? a : b
    );
  }, [performanceData]);

  if (performanceData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-500/10 p-2 rounded-lg">
            <Users className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Performance da Equipe
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sem dados disponíveis
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          Nenhum dado de performance encontrado
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
    >
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/10 p-2 rounded-lg">
            <Users className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Performance da Equipe
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {performanceData.length} agentes ativos
            </p>
          </div>
        </div>

        {champion && (
          <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
              Campeão: {champion.nome} ({champion.encerramentos} encerramentos)
            </span>
          </div>
        )}
      </div>

      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={performanceData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            
            <XAxis
              dataKey="nome"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fill: 'currentColor', fontSize: 9 }}
              className="text-xs"
              interval={0}
            />
            
            <YAxis
              tick={{ fill: 'currentColor', fontSize: 10 }}
              className="text-xs"
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
              formatter={(value, name) => [
                value,
                name === 'tratativas' ? 'Tratativas' : 'Encerramentos'
              ]}
            />
            
            <Legend
              wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
              formatter={(value) => value === 'tratativas' ? 'Tratativas' : 'Encerramentos'}
            />
            
            <Bar
              dataKey="tratativas"
              name="tratativas"
              fill="#FF6B00"
              radius={[4, 4, 0, 0]}
              label={{ position: 'top', fontSize: 9, fill: '#FF6B00' }}
            />
            <Bar
              dataKey="encerramentos"
              name="encerramentos"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              label={{ position: 'top', fontSize: 9, fill: '#10B981' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default PerformanceChart;