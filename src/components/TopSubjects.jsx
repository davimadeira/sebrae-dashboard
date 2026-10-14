import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

const TopSubjects = ({ data = [] }) => {
  const subjectCount = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const counts = {};
    data.forEach(item => {
      const subject = item.assunto || 'Sem classificação';
      counts[subject] = (counts[subject] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data]);

  const total = data?.length || 0;
  const maxValue = Math.max(...subjectCount.map(item => item.value), 1);

  if (subjectCount.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="h-full flex items-center justify-center"
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          Nenhum assunto encontrado
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-purple-500/10 p-2 rounded-lg flex-shrink-0">
            <Award className="w-5 h-5 text-purple-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">
              Top Assuntos
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {subjectCount.length} principais de {total} chamados
            </p>
          </div>
        </div>
        <div className="text-right bg-sebrae-orange/5 px-2 py-1 rounded-lg flex-shrink-0">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Top 1</span>
          <p className="text-xs font-bold text-sebrae-orange">{subjectCount[0]?.value || 0}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400 mb-3 shrink-0">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-sebrae-orange" />
          Quantidade de chamados
        </span>
        <span>% do total filtrado</span>
      </div>

      <div className="min-h-0 flex-1 space-y-3">
        {subjectCount.map((item, index) => {
          const percentOfMax = Math.max((item.value / maxValue) * 100, 6);
          const percentOfTotal = total > 0 ? Math.round((item.value / total) * 100) : 0;

          return (
            <div key={item.name} className="text-xs">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 whitespace-normal break-words leading-tight">
                    {item.name}
                  </span>
                </div>
                <div className="text-right min-w-[68px] flex-shrink-0">
                  <p className="font-semibold text-gray-800 dark:text-white leading-none">{item.value}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{percentOfTotal}%</p>
                </div>
              </div>
              <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sebrae-orange"
                  style={{ width: `${percentOfMax}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TopSubjects;
