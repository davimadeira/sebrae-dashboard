import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  X, 
  RotateCcw,
  BarChart3,
  Calendar,
  Award,
  Building2,
  Clock,
  CheckCircle,
  Users,
  AlertTriangle
} from 'lucide-react';

// 🔥 MAPEAMENTO DE ÍCONES (DEPOIS DOS IMPORTS)
const iconMap = {
  BarChart3: BarChart3,
  Calendar: Calendar,
  Award: Award,
  Building2: Building2,
  Clock: Clock,
  CheckCircle: CheckCircle,
  Users: Users,
  AlertTriangle: AlertTriangle,
};

const WidgetControls = ({ widgets, onToggleWidget, onResetWidgets }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hiddenCount = widgets.filter(w => !w.visible).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-sebrae-blue text-white rounded-lg hover:bg-sebrae-blue/80 transition-colors text-sm"
      >
        <Settings className="w-4 h-4" />
        <span>Widgets</span>
        {hiddenCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {hiddenCount}
          </span>
        )}
        <span className="bg-white/20 text-xs rounded-full px-2 py-0.5">
          {widgets.filter(w => w.visible).length}/{widgets.length}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-sebrae-lg border border-gray-200 dark:border-gray-700 p-4 z-50 min-w-[250px]"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Gerenciar Widgets
              </h4>
              <div className="flex items-center gap-1">
                {hiddenCount > 0 && (
                  <button
                    onClick={onResetWidgets}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs text-sebrae-blue flex items-center gap-1"
                    title="Restaurar todos os widgets"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {widgets.map(widget => {
                const IconComponent = iconMap[widget.icon];
                
                return (
                  <label
                    key={widget.id}
                    className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                      !widget.visible ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {IconComponent && <IconComponent className="w-4 h-4 text-sebrae-blue" />}
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {widget.title}
                      </span>
                    </div>
                    <button
                      onClick={() => onToggleWidget(widget.id)}
                      className={`p-1 rounded transition-colors ${
                        widget.visible
                          ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {widget.visible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </label>
                );
              })}
            </div>

            {hiddenCount > 0 && (
              <button
                onClick={() => {
                  onResetWidgets();
                  setIsOpen(false);
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-sebrae-orange/10 text-sebrae-orange rounded-lg hover:bg-sebrae-orange/20 transition-colors text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar todos os {hiddenCount} widget(s) ocultos
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WidgetControls;