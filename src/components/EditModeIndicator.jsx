import { motion } from 'framer-motion';
import { Edit2, Lock } from 'lucide-react';

const EditModeIndicator = ({ isEditMode, onExit }) => {
  if (!isEditMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-0 left-0 right-0 z-[9998] bg-sebrae-blue text-white px-4 py-2 flex items-center justify-between shadow-lg"
    >
      <div className="flex items-center gap-3">
        <Edit2 className="w-4 h-4" />
        <span className="text-sm font-medium">🔓 Modo Edição Ativado</span>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
          Arraste os widgets para reorganizar
        </span>
      </div>
      <button
        onClick={onExit}
        className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
      >
        Sair do modo edição
      </button>
    </motion.div>
  );
};

export default EditModeIndicator;