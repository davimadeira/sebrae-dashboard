import { motion } from 'framer-motion';
import { Edit2 } from 'lucide-react';

const EditModeIndicator = ({ isEditMode, onExit }) => {
  if (!isEditMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-50 bg-sebrae-blue text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3"
    >
      <Edit2 className="w-4 h-4" />
      <span className="text-sm font-medium">Modo edição</span>
      <button
        onClick={onExit}
        className="bg-white/20 text-white px-3 py-1 rounded-lg hover:bg-white/30 transition-colors text-xs"
      >
        Sair
      </button>
    </motion.div>
  );
};

export default EditModeIndicator;
