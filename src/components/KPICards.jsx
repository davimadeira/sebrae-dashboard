import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Percent, 
  ThumbsUp,
  ShieldCheck
} from 'lucide-react';

const KPICards = ({ stats }) => {
  const cards = [
    { 
      title: 'Total de Chamados', 
      value: stats.total, 
      icon: TrendingUp, 
      color: 'bg-sebrae-blue',
      description: `Chat: ${stats.chat || 0} | Voz: ${stats.voz || 0}`
    },
    { 
      title: 'ConcluÃ­dos', 
      value: stats.concluidos, 
      icon: CheckCircle, 
      color: 'bg-emerald-500',
      description: `${stats.resolucao}% de resoluÃ§Ã£o`
    },
    { 
      title: 'Pendentes', 
      value: stats.pendentes, 
      icon: Clock, 
      color: 'bg-amber-500',
      description: 'Aguardando aÃ§Ã£o'
    },
    { 
      title: '% ResoluÃ§Ã£o', 
      value: `${stats.resolucao}%`, 
      icon: Percent, 
      color: 'bg-violet-500',
      description: 'Taxa de conclusÃ£o'
    }
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
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {card.title}
              </p>
              <p className="text-xl font-bold text-gray-800 dark:text-white mt-0.5 truncate">
                {card.value}
              </p>
              {card.description && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{card.description}</p>
              )}
            </div>
            <div className={`${card.color} p-2 rounded-xl flex-shrink-0 ml-2`}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
          </div>
        </motion.div>
      ))}

      {/* ===== CARD: PROCEDENTES CNR ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-4 border-2 border-blue-400 dark:border-blue-500/50"
        style={{
          background: 'linear-gradient(135deg, #005A9C 0%, #003D6B 100%)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-100">Procedentes CNR</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {stats.cnrSim || 0}
            </p>
            <p className="text-[10px] text-blue-200 mt-0.5">
              {stats.percCNR || 0}% de {stats.cnrTotal || 0} com dados
            </p>
          </div>
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <ThumbsUp className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 bg-white text-blue-600 text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
              {stats.percCNR || 0}%
            </div>
          </div>
        </div>
        <div className="mt-2 w-full bg-white/30 rounded-full h-1">
          <div 
            className="bg-white h-1 rounded-full transition-all duration-1000"
            style={{ width: `${stats.percCNR || 0}%` }}
          />
        </div>
        <p className="text-[10px] text-blue-200 mt-0.5">
          {stats.cnrNao || 0} NÃO
        </p>
      </motion.div>

      {/* ===== CARD: PROCEDENTES BKO ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 p-4 border-2 border-emerald-400 dark:border-emerald-500/50"
        style={{
          background: 'linear-gradient(135deg, #065F46 0%, #022C22 100%)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-100">Procedentes BKO</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {stats.bkoSim || 0}
            </p>
            <p className="text-[10px] text-emerald-200 mt-0.5">
              {stats.percBKO || 0}% de {stats.bkoTotal || 0} com dados
            </p>
          </div>
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 bg-white text-emerald-600 text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
              {stats.percBKO || 0}%
            </div>
          </div>
        </div>
        <div className="mt-2 w-full bg-white/30 rounded-full h-1">
          <div 
            className="bg-white h-1 rounded-full transition-all duration-1000"
            style={{ width: `${stats.percBKO || 0}%` }}
          />
        </div>
        <p className="text-[10px] text-emerald-200 mt-0.5">
          {stats.bkoNao || 0} NÃO
        </p>
      </motion.div>
    </div>
  );
};

export default KPICards;

