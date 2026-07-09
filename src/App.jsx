import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { WidthProvider, Responsive } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { fetchSheetData, formatSheetData } from './api/sheets';
import { getMonthYear, getWeekFromDate } from './utils/dateHelpers';
import sebraeLogo from './logo-sebrae.png';
import KPICards from './components/KPICards';
import WeeklyChart from './components/WeeklyChart';
import TopSubjects from './components/TopSubjects';
import PerformanceChart from './components/PerformanceChart';
import Filters from './components/Filters';
import ThemeToggle from './components/ThemeToggle';
import DataTable from './components/DataTable';
import EmissorChart from './components/EmissorChart';
import SemAutorizacaoChart from './components/SemAutorizacaoChart';
import SLAChart from './components/SLAChart';
import ProcedentesChart from './components/ProcedentesChart';
import StrategyChart from './components/StrategyChart';
import WidgetContainer from './components/WidgetContainer';
import WidgetControls from './components/WidgetControls';
import PasswordModal from './components/PasswordModal';
import EditModeIndicator from './components/EditModeIndicator';
import { 
  AlertCircle, 
  RefreshCw, 
  BarChart3, 
  Calendar, 
  Award, 
  Building2, 
  Clock, 
  CheckCircle, 
  Users,
  AlertTriangle,
  Edit2,
  Headphones
} from 'lucide-react';

// Configuração inicial do Grid
const ResponsiveGridLayout = WidthProvider(Responsive);

const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'kpis', x: 0, y: 0, w: 12, h: 2 },
    { i: 'weekly', x: 0, y: 3, w: 12, h: 4 },
    { i: 'topSubjects', x: 0, y: 8, w: 12, h: 6 },
    { i: 'emissor', x: 0, y: 15, w: 6, h: 4 },
    { i: 'sla', x: 6, y: 15, w: 6, h: 4 },
    { i: 'procedentes', x: 0, y: 20, w: 12, h: 5 },
    { i: 'strategy', x: 0, y: 26, w: 6, h: 4 },
    { i: 'performance', x: 6, y: 26, w: 6, h: 4 },
    { i: 'semAutorizacao', x: 0, y: 31, w: 12, h: 4 },
    { i: 'dataTable', x: 0, y: 36, w: 12, h: 5 },
  ],
  md: [
    { i: 'kpis', x: 0, y: 0, w: 10, h: 2 },
    { i: 'weekly', x: 0, y: 3, w: 10, h: 4 },
    { i: 'topSubjects', x: 0, y: 8, w: 10, h: 6 },
    { i: 'emissor', x: 0, y: 15, w: 5, h: 4 },
    { i: 'sla', x: 5, y: 15, w: 5, h: 4 },
    { i: 'procedentes', x: 0, y: 20, w: 10, h: 5 },
    { i: 'strategy', x: 0, y: 26, w: 5, h: 4 },
    { i: 'performance', x: 5, y: 26, w: 5, h: 4 },
    { i: 'semAutorizacao', x: 0, y: 31, w: 10, h: 4 },
    { i: 'dataTable', x: 0, y: 36, w: 10, h: 5 },
  ],
  sm: [
    { i: 'kpis', x: 0, y: 0, w: 6, h: 3 },
    { i: 'weekly', x: 0, y: 3, w: 6, h: 4 },
    { i: 'topSubjects', x: 0, y: 7, w: 6, h: 7 },
    { i: 'emissor', x: 0, y: 15, w: 6, h: 4 },
    { i: 'sla', x: 0, y: 20, w: 6, h: 4 },
    { i: 'procedentes', x: 0, y: 25, w: 6, h: 5 },
    { i: 'strategy', x: 0, y: 31, w: 6, h: 4 },
    { i: 'performance', x: 0, y: 36, w: 6, h: 4 },
    { i: 'semAutorizacao', x: 0, y: 41, w: 6, h: 4 },
    { i: 'dataTable', x: 0, y: 46, w: 6, h: 5 },
  ],
};

const getDefaultLayouts = () => JSON.parse(JSON.stringify(DEFAULT_LAYOUTS));
const DASHBOARD_LAYOUT_VERSION = '6';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [filters, setFilters] = useState({
    meses: [], semanas: [], dias: [], assuntos: [], abertopor: []
  });

  // Configuração de widgets
  const [widgets, setWidgets] = useState([
    { id: 'kpis', title: 'KPIs', icon: 'BarChart3', visible: true },
    { id: 'weekly', title: 'Evolução Semanal', icon: 'Calendar', visible: true },
    { id: 'topSubjects', title: 'Top Assuntos', icon: 'Award', visible: true },
    { id: 'emissor', title: 'Órgão Emissor', icon: 'Building2', visible: true },
    { id: 'sla', title: 'SLA - Prazo de Atendimento', icon: 'Clock', visible: true },
    { id: 'procedentes', title: 'Evolução de Procedentes', icon: 'CheckCircle', visible: true },
    { id: 'performance', title: 'Performance da Equipe', icon: 'Users', visible: true },
    { id: 'semAutorizacao', title: 'Tickets sem Autorização', icon: 'AlertTriangle', visible: true },
    { id: 'strategy', title: 'Estratégia de Atendimento', icon: 'Headphones', visible: true },
    { id: 'dataTable', title: 'Dados Detalhados', icon: 'BarChart3', visible: true },
  ]);

  // Layout do Grid (salvo no localStorage)
  const [layouts, setLayouts] = useState(() => {
    const savedVersion = localStorage.getItem('dashboard_layout_version');
    const saved = localStorage.getItem('dashboard_layouts');
    if (saved && savedVersion === DASHBOARD_LAYOUT_VERSION) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Layout padrão (12 colunas de largura total)
    return getDefaultLayouts();
  });

  const iconMap = {
    BarChart3, Calendar, Award, Building2, Clock, CheckCircle, Users, AlertTriangle, Headphones, Edit2
  };

  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const current = prev[key] || [];
      if (value === 'all') return { ...prev, [key]: [] };
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter(item => item !== value) };
      }
      return { ...prev, [key]: [...current, value] };
    });
  };

  const clearFilters = () => {
    setFilters({ meses: [], semanas: [], dias: [], assuntos: [], abertopor: [] });
  };

  const toggleWidget = (id) => {
    setWidgets(prev => {
      const newState = prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
      localStorage.setItem('widgets_state', JSON.stringify(newState.reduce((acc, w) => ({ ...acc, [w.id]: w.visible }), {})));
      return newState;
    });
  };

  const resetWidgets = () => {
    const defaultLayouts = getDefaultLayouts();
    setWidgets(prev => prev.map(w => ({ ...w, visible: true })));
    setLayouts(defaultLayouts);
    localStorage.setItem('widgets_state', JSON.stringify(widgets.reduce((acc, w) => ({ ...acc, [w.id]: true }), {})));
    localStorage.setItem('dashboard_layouts', JSON.stringify(defaultLayouts));
    localStorage.setItem('dashboard_layout_version', DASHBOARD_LAYOUT_VERSION);
  };

  // Salvar layout no localStorage sempre que mudar
  const onLayoutChange = (currentLayout, allLayouts) => {
    setLayouts(allLayouts);
    localStorage.setItem('dashboard_layouts', JSON.stringify(allLayouts));
    localStorage.setItem('dashboard_layout_version', DASHBOARD_LAYOUT_VERSION);
  };

  const openEditMode = () => setShowPasswordModal(true);
  const handlePasswordSuccess = () => {
    setIsEditMode(true);
    setShowPasswordModal(false);
  };
  const exitEditMode = () => setIsEditMode(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawData = await fetchSheetData();
      if (!rawData) throw new Error('Não foi possível carregar os dados da planilha');
      setData(formatSheetData(rawData));
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filterOptions = useMemo(() => {
    if (!data || data.length === 0) return { meses: [], semanas: [], dias: [], assuntos: [], abertopor: [] };
    const meses = new Set(), semanas = new Set(), dias = new Set(), assuntos = new Set(), abertopor = new Set();
    data.forEach(item => {
      const mesAbertura = item.mes || getMonthYear(item.dataAbertura);
      if (mesAbertura && mesAbertura !== 'NaN/NaN') meses.add(mesAbertura);
      if (item.semana && !item.semana.includes('classificação')) semanas.add(item.semana);
      if (item.dataAbertura && item.dataAbertura !== '-') dias.add(item.dataAbertura);
      if (item.assunto) assuntos.add(item.assunto);
      if (item.abertopor) abertopor.add(item.abertopor);
    });
    return {
      meses: Array.from(meses).sort(), semanas: Array.from(semanas).sort(), 
      dias: Array.from(dias).sort(), assuntos: Array.from(assuntos).sort(), abertopor: Array.from(abertopor).sort()
    };
  }, [data]);

  const filteredByAbertura = useMemo(() => {
    return data.filter(item => {
      if (filters.meses.length > 0 && !filters.meses.includes(item.mes || getMonthYear(item.dataAbertura))) return false;
      if (filters.dias.length > 0 && !filters.dias.includes(item.dataAbertura)) return false;
      if (filters.semanas.length > 0 && !filters.semanas.includes(item.semana)) return false;
      if (filters.assuntos.length > 0 && !filters.assuntos.includes(item.assunto)) return false;
      if (filters.abertopor.length > 0 && !filters.abertopor.includes(item.abertopor)) return false;
      return true;
    });
  }, [data, filters]);

  const filteredByFinalizacao = useMemo(() => {
    return data.filter(item => {
      if (!item.dataFinalizacao) return false;
      if (filters.meses.length > 0 && !filters.meses.includes(getMonthYear(item.dataFinalizacao))) return false;
      if (filters.dias.length > 0 && !filters.dias.includes(item.dataFinalizacao)) return false;
      if (filters.semanas.length > 0 && !filters.semanas.includes(getWeekFromDate(item.dataFinalizacao))) return false;
      if (filters.assuntos.length > 0 && !filters.assuntos.includes(item.assunto)) return false;
      if (filters.abertopor.length > 0 && !filters.abertopor.includes(item.abertopor)) return false;
      return true;
    });
  }, [data, filters]);

  const stats = useMemo(() => {
    const total = filteredByAbertura.length;
    const concluidos = filteredByFinalizacao.length;
    const concluidosDoPeriodoDeAbertura = filteredByAbertura.filter(item => {
      if (!item.dataFinalizacao) return false;

      const mesFinalizacao = getMonthYear(item.dataFinalizacao);
      if (!mesFinalizacao) return false;

      if (filters.meses.length > 0) {
        return filters.meses.includes(mesFinalizacao);
      }

      return mesFinalizacao === getMonthYear(item.dataAbertura);
    }).length;
    const pendentes = filteredByAbertura.filter(item => !item.dataFinalizacao).length;
    const resolucao = total > 0 ? Math.round((concluidosDoPeriodoDeAbertura / total) * 100) : 0;

    const getAnswer = (value) => String(value || '').trim().toUpperCase();
    const hasAnswer = (value) => {
      const answer = getAnswer(value);
      return answer === 'SIM' || answer === 'NÃO' || answer === 'NAO';
    };
    const isYes = (value) => getAnswer(value) === 'SIM';
    const isNo = (value) => {
      const answer = getAnswer(value);
      return answer === 'NÃO' || answer === 'NAO';
    };

    const cnrRows = filteredByFinalizacao.filter(d => hasAnswer(d.procedentesCNR));
    const cnrSim = cnrRows.filter(d => isYes(d.procedentesCNR)).length;
    const cnrNao = cnrRows.filter(d => isNo(d.procedentesCNR)).length;
    const cnrTotal = cnrRows.length;
    const percCNR = cnrTotal > 0 ? Math.round((cnrSim / cnrTotal) * 100) : 0;

    const bkoRows = filteredByFinalizacao.filter(d => hasAnswer(d.procedentesBKO));
    const bkoSim = bkoRows.filter(d => isYes(d.procedentesBKO)).length;
    const bkoNao = bkoRows.filter(d => isNo(d.procedentesBKO)).length;
    const bkoTotal = bkoRows.length;
    const percBKO = bkoTotal > 0 ? Math.round((bkoSim / bkoTotal) * 100) : 0;

    const chat = filteredByAbertura.filter(d => {
      const estrategia = (d.estrategia || '').trim().toUpperCase();
      return !estrategia || estrategia.includes('CHAT');
    }).length;
    const voz = filteredByAbertura.filter(d => (d.estrategia || '').toUpperCase().includes('VOZ')).length;

    return {
      total,
      concluidos,
      pendentes,
      resolucao,
      chat,
      voz,
      cnrSim,
      cnrNao,
      cnrTotal,
      percCNR,
      bkoSim,
      bkoNao,
      bkoTotal,
      percBKO,
    };
  }, [filteredByAbertura, filteredByFinalizacao, filters.meses]);

  const weeklyDataForChart = useMemo(() => {
    const weeksMap = {};
    filteredByAbertura.forEach(item => {
      const week = item.semana || 'Semana sem classificação';
      if (!weeksMap[week]) weeksMap[week] = { semana: week, volumetria: 0, concluidos: 0, pendentes: 0 };
      weeksMap[week].volumetria += 1;
      if (!item.dataFinalizacao) weeksMap[week].pendentes += 1;
    });
    filteredByFinalizacao.forEach(item => {
      const week = getWeekFromDate(item.dataFinalizacao);
      if (!weeksMap[week]) weeksMap[week] = { semana: week, volumetria: 0, concluidos: 0, pendentes: 0 };
      weeksMap[week].concluidos += 1;
    });
    return Object.values(weeksMap).sort((a, b) => {
      const getMonth = (s) => { const m = s.match(/\((\d{2})\//); return m ? parseInt(m[1]) : 0; };
      const getWeekNum = (s) => { const w = s.match(/Semana (\d+)/); return w ? parseInt(w[1]) : 0; };
      return getMonth(a.semana) - getMonth(b.semana) || getWeekNum(a.semana) - getWeekNum(b.semana);
    });
  }, [filteredByAbertura, filteredByFinalizacao]);

  const renderWidgetContent = (id) => {
    const map = {
      kpis: <KPICards stats={stats} />,
      weekly: <WeeklyChart data={weeklyDataForChart} />,
      topSubjects: <TopSubjects data={filteredByAbertura} />,
      emissor: <EmissorChart data={filteredByAbertura} />,
      sla: <SLAChart data={filteredByAbertura} />,
      procedentes: <ProcedentesChart data={filteredByFinalizacao} selectedMonths={filters.meses} />,
      performance: <PerformanceChart data={filteredByAbertura} />,
      semAutorizacao: <SemAutorizacaoChart data={filteredByAbertura} />,
      strategy: <StrategyChart data={filteredByAbertura} />,
      dataTable: <DataTable data={filteredByAbertura} />,
    };
    return map[id];
  };

  const visibleWidgets = widgets.filter(w => w.visible);

  // Renderiza cada widget dentro do Grid
  const renderGridItem = (widget) => {
    const IconComponent = iconMap[widget.icon] || BarChart3;
    return (
      <div key={widget.id} className="h-full w-full p-1">
        <WidgetContainer
          id={widget.id}
          title={widget.title}
          icon={IconComponent}
          isEditMode={isEditMode}
          onVisibilityChange={toggleWidget}
        >
          {renderWidgetContent(widget.id)}
        </WidgetContainer>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sebrae-orange mx-auto"></div><p className="mt-4 text-gray-600 dark:text-gray-400">Carregando dados...</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button onClick={loadData} className="bg-sebrae-orange text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <EditModeIndicator isEditMode={isEditMode} onExit={exitEditMode} />
      <PasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} onSuccess={handlePasswordSuccess} />

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        
        {/* Header */}
        <header className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <img src={sebraeLogo} alt="SEBRAE" className="h-12 w-auto object-contain" />
          </motion.div>
          <div className="flex flex-wrap items-center gap-2">
            {!isEditMode && (
              <button onClick={openEditMode} className="flex items-center gap-1.5 px-3 py-1.5 bg-sebrae-blue text-white rounded-lg hover:bg-sebrae-blue/80 transition-colors text-xs sm:text-sm">
                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Editar</span>
              </button>
            )}
            <WidgetControls widgets={widgets} onToggleWidget={toggleWidget} onResetWidgets={resetWidgets} />
            <ThemeToggle />
            <button onClick={loadData} className="flex items-center gap-1 bg-sebrae-orange text-white px-2.5 py-1.5 rounded-lg hover:bg-orange-600 transition-colors text-xs sm:text-sm">
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </header>

        {/* Filters */}
        <Filters filters={filters} setFilters={setFilters} options={filterOptions} toggleFilter={toggleFilter} clearFilters={clearFilters} />

        {/* Grid Dashboard */}
        <div className="mt-5">
          {visibleWidgets.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-md p-8 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Todos os widgets estão ocultos.
              </p>
              <button
                onClick={resetWidgets}
                className="bg-sebrae-orange text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
              >
                Restaurar widgets
              </button>
            </div>
          ) : (
            <ResponsiveGridLayout
              className="layout layout-editing"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={100}
              margin={[16, 16]}
              containerPadding={[0, 0]}
              draggableHandle=".draggable-handle"
              isDraggable
              isResizable
              resizeHandles={['se', 's', 'e']}
              onLayoutChange={onLayoutChange}
            >
              {visibleWidgets.map(widget => renderGridItem(widget))}
            </ResponsiveGridLayout>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
          {data.length} chamados carregados | {stats.cnrSim || 0} procedentes CNR ({stats.percCNR || 0}%) | Última atualização: {lastUpdate?.toLocaleString('pt-BR')}
        </footer>

      </div>
    </div>
  );
}

export default App;
