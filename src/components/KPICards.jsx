import { motion } from 'framer-motion';
import {
  TrendingUp,
  CheckCircle,
  Clock,
  Percent,
  ThumbsUp,
  ShieldCheck,
} from 'lucide-react';

const KPICards = ({ stats }) => {
  const cards = [
    {
      title: 'Volume',
      value: stats.total,
      icon: TrendingUp,
      color: 'bg-sebrae-blue',
      description: `Chat: ${stats.chat || 0} | Voz: ${stats.voz || 0}`,
    },
    {
      title: 'Concluídos',
      value: stats.concluidos,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      description: `${stats.resolucao}% de resolução`,
    },
    {
      title: 'Pendentes',
      value: stats.pendentes,
      icon: Clock,
      color: 'bg-amber-500',
      description: 'Aguardando ação',
    },
    {
      title: '% Resolução',
      value: `${stats.resolucao}%`,
      icon: Percent,
      color: 'bg-violet-500',
      description: 'Taxa de conclusão',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-4 border border-gray-100 dark:border-gray-700 hover:border-sebrae-blue/30"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 leading-none tabular-nums">
                {card.value}
              </p>
              {card.description && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-tight">
                  {card.description}
                </p>
              )}
            </div>
            <div className={`${card.color} p-2.5 rounded-lg flex-shrink-0`}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
          </div>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-4 border-2 border-blue-400 dark:border-blue-500/50"
        style={{ background: 'linear-gradient(135deg, #005A9C 0%, #003D6B 100%)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-blue-100 uppercase tracking-wide leading-tight">Procedentes CNR</p>
            <p className="text-2xl font-bold text-white mt-1 leading-none tabular-nums">
              {stats.cnrSim || 0}
            </p>
            <p className="text-[11px] text-blue-100/90 mt-1.5 leading-tight">
              {stats.percCNR || 0}% de {stats.cnrTotal || 0} com dados
            </p>
          </div>
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <ThumbsUp className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 bg-white text-blue-700 text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
              {stats.percCNR || 0}%
            </div>
          </div>
        </div>
        <div className="mt-3 w-full bg-white/30 rounded-full h-1.5">
          <div
            className="bg-white h-1.5 rounded-full transition-all duration-1000"
            style={{ width: `${stats.percCNR || 0}%` }}
          />
        </div>
        <p className="text-[11px] text-blue-100/90 mt-1.5 leading-tight">
          {stats.cnrNao || 0} NÃO
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-4 border-2 border-emerald-400 dark:border-emerald-500/50"
        style={{ background: 'linear-gradient(135deg, #065F46 0%, #022C22 100%)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wide leading-tight">Procedentes BKO</p>
            <p className="text-2xl font-bold text-white mt-1 leading-none tabular-nums">
              {stats.bkoSim || 0}
            </p>
            <p className="text-[11px] text-emerald-100/90 mt-1.5 leading-tight">
              {stats.percBKO || 0}% de {stats.bkoTotal || 0} com dados
            </p>
          </div>
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 bg-white text-emerald-700 text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
              {stats.percBKO || 0}%
            </div>
          </div>
        </div>
        <div className="mt-3 w-full bg-white/30 rounded-full h-1.5">
          <div
            className="bg-white h-1.5 rounded-full transition-all duration-1000"
            style={{ width: `${stats.percBKO || 0}%` }}
          />
        </div>
        <p className="text-[11px] text-emerald-100/90 mt-1.5 leading-tight">
          {stats.bkoNao || 0} NÃO
        </p>
      </motion.div>
    </div>
  );
};

export default KPICards;
