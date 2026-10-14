import { useMemo } from 'react';
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
          agents[tratadoPor] = { nome: tratadoPor, tratativas: 0, encerramentos: 0 };
        }
        agents[tratadoPor].tratativas += 1;
      }

      if (encerradoPor && encerradoPor !== 'Não atribuído') {
        if (!agents[encerradoPor]) {
          agents[encerradoPor] = { nome: encerradoPor, tratativas: 0, encerramentos: 0 };
        }
        agents[encerradoPor].encerramentos += 1;
      }
    });

    return Object.values(agents)
      .filter(agent => agent.tratativas > 0 || agent.encerramentos > 0)
      .map(agent => ({
        ...agent,
        total: agent.tratativas + agent.encerramentos,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [data]);

  const champion = useMemo(() => {
    if (performanceData.length === 0) return null;
    return performanceData.reduce((a, b) => (a.encerramentos > b.encerramentos ? a : b));
  }, [performanceData]);

  const maxValue = Math.max(...performanceData.map(agent => agent.total), 1);

  if (performanceData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="h-full flex items-center justify-center"
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
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
      className="h-full flex flex-col"
    >
      <div className="flex flex-wrap justify-between items-start gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/10 p-2 rounded-lg">
            <Users className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">
              Performance da Equipe
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Top {performanceData.length} agentes ativos
            </p>
          </div>
        </div>

        {champion && (
          <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
              Campeão: {champion.nome}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400 mb-3 shrink-0">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-sebrae-orange" />
          Tratativas
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          Encerramentos
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
        {performanceData.map((agent, index) => (
          <div key={agent.nome} className="text-xs">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex items-start gap-2 min-w-0">
                <span className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-200 whitespace-normal break-words leading-tight">
                  {agent.nome}
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-800 dark:text-white flex-shrink-0">
                {agent.total}
              </span>
            </div>

            <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex">
              <div
                className="h-full bg-sebrae-orange"
                title={`Tratativas: ${agent.tratativas}`}
                style={{ width: `${agent.total > 0 ? (agent.tratativas / maxValue) * 100 : 0}%` }}
              />
              <div
                className="h-full bg-emerald-500"
                title={`Encerramentos: ${agent.encerramentos}`}
                style={{ width: `${agent.total > 0 ? (agent.encerramentos / maxValue) * 100 : 0}%` }}
              />
            </div>

            <div className="mt-1 flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
              <span>{agent.tratativas} tratativas</span>
              <span>{agent.encerramentos} encerramentos</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default PerformanceChart;
