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
  Area
} from 'recharts';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const ProcedentesChart = ({ data }) => {
// No ProcedentesChart.jsx, garantir que usa a mesma lógica:

const chartData = useMemo(() => {
  const weeksMap = {};
  
  data.forEach(item => {
    // 🔥 SÓ CONSIDERA REGISTROS COM DATA DE ABERTURA
    if (!item.dataAbertura || item.dataAbertura === '-') return;
    
    const week = item.semana || 'Semana sem classificação';
    
    if (!weeksMap[week]) {
      weeksMap[week] = { 
        semana: week, 
        total: 0, 
        procedentes: 0, 
        naoProcedentes: 0 
      };
    }
    
    // 🔥 TOTAL: TODOS com dataAbertura
    weeksMap[week].total += 1;
    
    // 🔥 PROCEDENTES: APENAS CONCLUÍDOS E Procedentes = SIM
    const temFinalizacao = item.dataFinalizacao && item.dataFinalizacao !== '';
    const val = item.procedentesCNR || item.procedentes || '';
    const isProcedente = val.toUpperCase() === 'SIM';
    
    if (temFinalizacao && isProcedente) {
      weeksMap[week].procedentes += 1;
    } else if (temFinalizacao && !isProcedente) {
      weeksMap[week].naoProcedentes += 1;
    }
    // Se não tem finalização, não conta como procedente nem não procedente
  });
  
  // ... resto igual
    const result = Object.values(weeksMap).sort((a, b) => {
      const weekA = a.semana;
      const weekB = b.semana;
      
      const numA = parseInt(weekA.split(' ')[1]) || 0;
      const numB = parseInt(weekB.split(' ')[1]) || 0;
      
      const monthA = weekA.match(/\((\d{2})\//);
      const monthB = weekB.match(/\((\d{2})\//);
      const monthNumA = monthA ? parseInt(monthA[1]) : 0;
      const monthNumB = monthB ? parseInt(monthB[1]) : 0;
      
      const yearA = weekA.match(/\/(\d{4})\)/);
      const yearB = weekB.match(/\/(\d{4})\)/);
      const yearNumA = yearA ? parseInt(yearA[1]) : 0;
      const yearNumB = yearB ? parseInt(yearB[1]) : 0;
      
      if (yearNumA !== yearNumB) return yearNumA - yearNumB;
      if (monthNumA !== monthNumB) return monthNumA - monthNumB;
      return numA - numB;
    });
    
    return result.map(item => ({
      ...item,
      percProcedentes: item.total > 0 ? Math.round((item.procedentes / item.total) * 100) : 0
    }));
  }, [data]);

  const totalProcedentes = chartData.reduce((sum, item) => sum + item.procedentes, 0);
  const totalGeral = chartData.reduce((sum, item) => sum + item.total, 0);
  const percGlobal = totalGeral > 0 ? Math.round((totalProcedentes / totalGeral) * 100) : 0;

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-500/10 p-2 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Evolução de Procedentes CNR
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sem dados disponíveis
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          Nenhum dado de procedentes encontrado
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/10 p-2 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Evolução de Procedentes CNR
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalProcedentes} procedentes de {totalGeral} chamados ({percGlobal}%)
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-gray-600 dark:text-gray-300">Procedentes</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-gray-600 dark:text-gray-300">Não Procedentes</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-300">% Procedentes</span>
          </div>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={chartData} 
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            
// No ProcedentesChart.jsx, substitua o XAxis por:

<XAxis 
  dataKey="semana" 
  tick={{ fill: 'currentColor', fontSize: 7 }}  // 👈 FONTE BEM MENOR
  className="text-xs" 
  angle={-45}  // 👈 INCLINA
  textAnchor="end" 
  height={80}  // 👈 AUMENTA ESPAÇO
  interval={0}
/>
            
            <YAxis 
              yAxisId="left" 
              tick={{ fill: 'currentColor', fontSize: 10 }}
              className="text-xs" 
            />
            
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              domain={[0, 100]} 
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
              formatter={(value, name) => {
                if (name === 'percProcedentes') return [`${value}%`, '% Procedentes'];
                if (name === 'procedentes') return [value, 'Procedentes CNR'];
                if (name === 'naoProcedentes') return [value, 'Não Procedentes'];
                return [value, name];
              }}
            />
            
            <Legend
              wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
            />
            
            <Bar 
              yAxisId="left" 
              dataKey="procedentes" 
              name="Procedentes CNR" 
              fill="#10B981" 
              radius={[4, 4, 0, 0]} 
            />
            
            <Bar 
              yAxisId="left" 
              dataKey="naoProcedentes" 
              name="Não Procedentes" 
              fill="#F87171" 
              radius={[4, 4, 0, 0]} 
            />
            
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="percProcedentes" 
              name="% Procedentes" 
              stroke="#3B82F6" 
              strokeWidth={2.5} 
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">Média de Procedentes</p>
          <p className="font-semibold text-green-600 dark:text-green-400">
            {Math.round(chartData.reduce((sum, item) => sum + item.percProcedentes, 0) / chartData.length)}%
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">Melhor Semana</p>
          <p className="font-semibold text-blue-600 dark:text-blue-400">
            {Math.max(...chartData.map(item => item.percProcedentes))}%
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">Pior Semana</p>
          <p className="font-semibold text-red-600 dark:text-red-400">
            {Math.min(...chartData.map(item => item.percProcedentes))}%
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProcedentesChart;