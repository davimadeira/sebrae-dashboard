import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

const WeeklyChart = ({ data = [] }) => {
  const [showTable, setShowTable] = useState(false);

  console.log('📊 WeeklyChart - DADOS RECEBIDOS:', data);
  console.log('📊 WeeklyChart - QUANTIDADE:', data.length);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-sebrae-orange/10 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-sebrae-orange" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Evolução Semanal
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sem dados disponíveis</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          Nenhum dado encontrado (data vazia)
        </div>
      </div>
    );
  }

  // 🔥 CORREÇÃO: Se data já está pronta, usa ela diretamente
  const chartData = data.map(item => ({
    ...item,
    percResolucao: item.volumetria > 0 
      ? Math.round((item.concluidos / item.volumetria) * 100) 
      : 0
  }));

  console.log('📊 WeeklyChart - chartData processado:', chartData);

  const totalChamados = chartData.reduce((sum, item) => sum + item.volumetria, 0);
  const mediaSemanal = chartData.length > 0 ? Math.round(totalChamados / chartData.length) : 0;

  // 🔥 VERIFICA SE HÁ DADOS NO GRÁFICO
  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-sebrae-orange/10 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-sebrae-orange" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Evolução Semanal
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Nenhuma semana com dados</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          Nenhum dado para exibir no gráfico (chartData vazio)
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-sebrae-orange/10 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-sebrae-orange" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Evolução Semanal
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Média de {mediaSemanal} chamados por semana
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-sebrae-orange" />
            <span className="text-gray-600 dark:text-gray-300">Volumetria</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-gray-600 dark:text-gray-300">Concluídos</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-300">% Resolução</span>
          </div>
        </div>

        <button
          onClick={() => setShowTable(!showTable)}
          className="text-xs text-sebrae-orange hover:text-orange-600 flex items-center gap-1"
        >
          {showTable ? 'Ocultar dados' : 'Ver dados'}
          {showTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="semana"
              tick={{ fill: 'currentColor', fontSize: 7 }}
              className="text-xs"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis yAxisId="left" tick={{ fill: 'currentColor', fontSize: 10 }} className="text-xs" />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
              formatter={(value, name) => {
                if (name === 'percResolucao') return [`${value}%`, '% Resolução'];
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            <Area type="monotone" dataKey="volumetria" name="Volumetria" yAxisId="left" fill="#FF6B00" fillOpacity={0.15} stroke="#FF6B00" strokeWidth={2} dot={{ fill: '#FF6B00', r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="concluidos" name="Concluídos" yAxisId="left" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="percResolucao" name="% Resolução" yAxisId="right" stroke="#3B82F6" strokeWidth={2.5} strokeDasharray="5 5" dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {showTable && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 overflow-x-auto"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Semana</th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">Volumetria</th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">Concluídos</th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">Pendentes</th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">% Resolução</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item) => (
                <tr key={item.semana} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="py-2 px-3 text-gray-800 dark:text-gray-200">{item.semana}</td>
                  <td className="text-right py-2 px-3 font-medium text-sebrae-orange">{item.volumetria}</td>
                  <td className="text-right py-2 px-3 font-medium text-emerald-500">{item.concluidos}</td>
                  <td className="text-right py-2 px-3 font-medium text-amber-500">{item.pendentes}</td>
                  <td className="text-right py-2 px-3 font-medium">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.percResolucao >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      item.percResolucao >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {item.percResolucao}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </motion.div>
  );
};

export default WeeklyChart;