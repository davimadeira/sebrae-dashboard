import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';

const WidgetContainer = ({ 
  id, 
  title, 
  icon: Icon, 
  children, 
  defaultVisible = true,
  onVisibilityChange,
  isEditMode = false,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    const saved = localStorage.getItem(`widget_${id}_visible`);
    if (saved !== null) {
      setIsVisible(saved === 'true');
    }
  }, [id]);

  const toggleVisibility = () => {
    if (!isEditMode) return;
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem(`widget_${id}_visible`, String(newState));
    if (onVisibilityChange) onVisibilityChange(id, newState);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-sebrae-lg transition-all duration-300 border ${
        isEditMode ? 'border-sebrae-orange/50 hover:border-sebrae-orange' : 'border-gray-100 dark:border-gray-700'
      } ${isExpanded ? 'col-span-full' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {isEditMode && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-gray-400 hover:text-sebrae-orange transition-colors" />
            </div>
          )}
          {Icon && <Icon className="w-4 h-4 text-sebrae-blue" />}
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {title}
          </h3>
          {isEditMode && (
            <span className="text-[8px] bg-sebrae-orange/10 text-sebrae-orange px-1.5 py-0.5 rounded-full uppercase font-bold">
              Editar
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={toggleExpand}
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
              onClick={toggleVisibility}
              className={`p-1 rounded transition-colors ${
                isHovered 
                  ? 'hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500' 
                  : 'text-gray-400 hover:text-red-500'
              }`}
              title="Ocultar widget (modo edição)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {children}
      </div>
    </motion.div>
  );
};

export default WidgetContainer;