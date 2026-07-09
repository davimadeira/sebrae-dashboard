import { useState } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';

const WidgetContainer = ({
  id,
  title,
  icon: Icon,
  children,
  isEditMode = false,
  onVisibilityChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 border ${
        isEditMode ? 'border-sebrae-orange/60 ring-1 ring-sebrae-orange/20' : 'border-gray-100 dark:border-gray-700'
      } h-full flex flex-col overflow-hidden`}
    >
      <div
        className="draggable-handle flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 cursor-move select-none"
        title="Arraste para mover o widget"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 text-sebrae-orange flex-shrink-0" />
          {Icon && <Icon className="w-4 h-4 text-sebrae-blue flex-shrink-0" />}
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isExpanded ? 'Recolher' : 'Expandir'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-gray-500" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {isEditMode && (
            <button
              onClick={() => onVisibilityChange(id)}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
              title="Ocultar widget"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className={`p-3 flex-1 min-h-0 ${id === 'dataTable' || id === 'topSubjects' ? 'overflow-auto' : 'overflow-hidden'} ${isExpanded ? 'min-h-[500px]' : ''}`}>
        {children}
      </div>
    </motion.div>
  );
};

export default WidgetContainer;
