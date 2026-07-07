import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  Calendar, 
  CalendarDays, 
  CalendarClock, 
  FolderOpen, 
  Users 
} from 'lucide-react';

const Filters = ({ filters = {}, setFilters = () => {}, options = {}, toggleFilter = () => {}, clearFilters = () => {} }) => {
  const [openFilters, setOpenFilters] = useState({
    meses: false,
    semanas: false,
    dias: false,
    assuntos: false,
    abertopor: false
  });

  const toggleDropdown = (key) => {
    setOpenFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 🔥 PEGA AS OPÇÕES DO FILTRO
  const {
    meses = [],
    semanas = [],
    dias = [],
    assuntos = [],
    abertopor = []
  } = options || {};

  // 🔥 CONTA QUANTOS FILTROS ESTÃO ATIVOS
  const totalActive = 
    (filters?.meses?.length || 0) + 
    (filters?.semanas?.length || 0) + 
    (filters?.dias?.length || 0) + 
    (filters?.assuntos?.length || 0) + 
    (filters?.abertopor?.length || 0);

  const renderMultiSelect = (key, items, label, IconComponent) => {
    const selected = filters?.[key] || [];
    const isOpen = openFilters[key] || false;

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(key)}
          className={`px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm flex items-center gap-2 hover:border-sebrae-orange transition-colors ${
            selected.length > 0 ? 'border-sebrae-orange bg-sebrae-orange/5' : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <IconComponent className="w-4 h-4" />
          <span>{label}</span>
          {selected.length > 0 && (
            <span className="bg-sebrae-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selected.length}
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[200px] max-h-60 overflow-y-auto p-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selected.length} selecionados
              </span>
              {selected.length > 0 && (
                <button
                  onClick={() => toggleFilter(key, 'all')}
                  className="text-xs text-sebrae-orange hover:text-orange-600"
                >
                  Limpar
                </button>
              )}
            </div>
            {items && items.length > 0 ? (
              items.map(item => (
                <label key={item} className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(item)}
                    onChange={() => toggleFilter(key, item)}
                    className="w-4 h-4 text-sebrae-orange rounded border-gray-300 focus:ring-sebrae-orange"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{item}</span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-400 p-2">Nenhuma opção disponível</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          <span className="mr-1">🔍</span> Filtros:
        </span>
        
        {renderMultiSelect('meses', meses, 'Meses', Calendar)}
        {renderMultiSelect('semanas', semanas, 'Semanas', CalendarDays)}
        {renderMultiSelect('dias', dias, 'Dias', CalendarClock)}
        {renderMultiSelect('assuntos', assuntos, 'Assuntos', FolderOpen)}
        {renderMultiSelect('abertopor', abertopor, 'Abertos Por', Users)}

        {totalActive > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Limpar todos ({totalActive})
          </button>
        )}
      </div>

      {totalActive > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {Object.entries(filters || {}).map(([key, values]) => 
            (values || []).map(value => (
              <span key={`${key}-${value}`} className="bg-sebrae-orange/10 text-sebrae-orange text-xs px-2 py-1 rounded-full flex items-center gap-1">
                {value}
                <button
                  onClick={() => toggleFilter(key, value)}
                  className="hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Filters;