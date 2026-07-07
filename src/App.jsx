import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { fetchSheetData, formatSheetData, getMonthYear } from './api/sheets';
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
  Edit2
} from 'lucide-react';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [filters, setFilters] = useState({
    meses: [],
    semanas: [],
    dias: [],
    assuntos: [],
    abertopor: []
  });

  const [widgets, setWidgets] = useState([
    { id: 'kpis', title: 'KPIs', icon: 'BarChart3', visible: true },
    { id: 'weekly', title: 'Evolução Semanal', icon: 'Calendar', visible: true },
    { id: 'topSubjects', title: 'Top Assuntos', icon: 'Award', visible: true },
    { id: 'emissor', title: 'Órgão Emissor', icon: 'Building2', visible: true },
    { id: 'sla', title: 'SLA - Prazo de Atendimento', icon: 'Clock', visible: true },
    { id: 'procedentes', title: 'Evolução de Procedentes', icon: 'CheckCircle', visible: true },
    { id: 'performance', title: 'Performance da Equipe', icon: 'Users', visible: true },
    { id: 'semAutorizacao', title: 'Tickets sem Autorização', icon: 'AlertTriangle', visible: true },
    { id: 'dataTable', title: 'Dados Detalhados', icon: 'BarChart3', visible: true },
  ]);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const current = prev[key] || [];
      if (value === 'all') {
        return { ...prev, [key]: [] };
      }
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      meses: [],
      semanas: [],
      dias: [],
      assuntos: [],
      abertopor: []
    });
  };

  const toggleWidget = (id) => {
    setWidgets(prev => {
      const newState = prev.map(w => 
        w.id === id ? { ...w, visible: !w.visible } : w
      );
      const stateMap = {};
      newState.forEach(w => { stateMap[w.id] = w.visible; });
      localStorage.setItem('widgets_state', JSON.stringify(stateMap));
      return newState;
    });
  };

  const resetWidgets = () => {
    setWidgets(prev => prev.map(w => ({ ...w, visible: true })));
    const stateMap = {};
    widgets.forEach(w => { stateMap[w.id] = true; });
    localStorage.setItem('widgets_state', JSON.stringify(stateMap));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('widgets_order', JSON.stringify(newOrder.map(w => w.id)));
        return newOrder;
      });
    }
  };

  const openEditMode = () => setShowPasswordModal(true);
  const handlePasswordSuccess = () => {
    setIsEditMode(true);
    setShowPasswordModal(false);
  };
  const exitEditMode = () => setIsEditMode(false);

  const getWidgetVisibility = (id) => {
    const widget = widgets.find(w => w.id === id);
    return widget ? widget.visible : true;
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawData = await fetchSheetData();
      if (!rawData) {
        throw new Error('Não foi possível carregar os dados da planilha');
      }
      const formattedData = formatSheetData(rawData);
      console.log('📊 TOTAL CARREGADO:', formattedData.length);
      setData(formattedData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('widgets_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWidgets(prev => prev.map(w => ({
          ...w,
          visible: parsed[w.id] !== undefined ? parsed[w.id] : w.visible
        })));
      } catch (e) {}
    }
    const savedOrder = localStorage.getItem('widgets_order');
    if (savedOrder) {
      try {
        const order = JSON.parse(savedOrder);
        setWidgets(prev => {
          const ordered = [];
          order.forEach(id => {
            const found = prev.find(w => w.id === id);
            if (found) ordered.push(found);
          });
          prev.forEach(w => {
            if (!ordered.find(o => o.id === w.id)) {
              ordered.push(w);
            }
          });
          return ordered;
        });
      } catch (e) {}
    }
  }, []);

  // 🔥 FILTER OPTIONS
  const filterOptions = useMemo(() => {
    const meses = new Set();
    const semanas = new Set();
    const dias = new Set();
    const assuntos = new Set();
    const abertopor = new Set();

    if (!data || data.length === 0) {
      return {
        meses: [],
        semanas: [],
        dias: [],
        assuntos: [],
        abertopor: []
      };
    }

    data.forEach(item => {
      const mesAbertura = item.mes || getMonthYear(item.dataAbertura);
      if (mesAbertura && mesAbertura !== 'NaN/NaN') meses.add(mesAbertura);
      
      const mesFinalizacao = getMonthYear(item.dataFinalizacao);
      if (mesFinalizacao && mesFinalizacao !== 'NaN/NaN') meses.add(mesFinalizacao);
      
      if (item.semana && !item.semana.includes('classificação')) semanas.add(item.semana);
      if (item.dataAbertura && item.dataAbertura !== '-') dias.add(item.dataAbertura);
      if (item.assunto) assuntos.add(item.assunto);
      if (item.abertopor) abertopor.add(item.abertopor);
    });

    return {
      meses: Array.from(meses).sort((a, b) => {
        try {
          const [mesA, anoA] = a.split('/').map(Number);
          const [mesB, anoB] = b.split('/').map(Number);
          if (isNaN(mesA) || isNaN(anoA)) return 0;
          if (isNaN(mesB) || isNaN(anoB)) return 0;
          if (anoA !== anoB) return anoA - anoB;
          return mesA - mesB;
        } catch (e) {
          return 0;
        }
      }),
      semanas: Array.from(semanas).sort((a, b) => {
        try {
          const numA = parseInt(a.split(' ')[1]) || 0;
          const numB = parseInt(b.split(' ')[1]) || 0;
          const monthA = a.match(/\((\d{2})\//);
          const monthB = b.match(/\((\d{2})\//);
          const monthNumA = monthA ? parseInt(monthA[1]) : 0;
          const monthNumB = monthB ? parseInt(monthB[1]) : 0;
          if (monthNumA !== monthNumB) return monthNumA - monthNumB;
          return numA - numB;
        } catch (e) {
          return 0;
        }
      }),
      dias: Array.from(dias)
        .filter(d => d && d !== '-' && d.includes('/') && !d.includes('NaN'))
        .sort((a, b) => {
          try {
            const [diaA, mesA, anoA] = a.split('/').map(Number);
            const [diaB, mesB, anoB] = b.split('/').map(Number);
            if (isNaN(diaA) || isNaN(mesA) || isNaN(anoA)) return 0;
            if (isNaN(diaB) || isNaN(mesB) || isNaN(anoB)) return 0;
            if (anoA !== anoB) return anoA - anoB;
            if (mesA !== mesB) return mesA - mesB;
            return diaA - diaB;
          } catch (e) {
            return 0;
          }
        }),
      assuntos: Array.from(assuntos).sort(),
      abertopor: Array.from(abertopor).sort()
    };
  }, [data]);

  // 🔥 FILTRO POR ABERTURA
// 🔥 FILTRO POR ABERTURA
const filteredByAbertura = useMemo(() => {
  const result = data.filter(item => {
    if (filters.meses.length > 0) {
      const itemMes = item.mes || getMonthYear(item.dataAbertura);
      if (!filters.meses.includes(itemMes)) return false;
    }
    if (filters.dias.length > 0) {
      if (!filters.dias.includes(item.dataAbertura)) return false;
    }
    if (filters.semanas.length > 0) {
      if (!filters.semanas.includes(item.semana)) return false;
    }
    if (filters.assuntos.length > 0) {
      if (!filters.assuntos.includes(item.assunto)) return false;
    }
    if (filters.abertopor.length > 0) {
      if (!filters.abertopor.includes(item.abertopor)) return false;
    }
    return true;
  });
  console.log('🔍 filteredByAbertura - TOTAL:', result.length);
  console.log('🔍 filteredByAbertura - PRIMEIRO:', result[0]);
  console.log('🔍 filteredByAbertura - ASSUNTOS:', Array.from(new Set(result.map(d => d.assunto))).slice(0, 10));
  return result;
}, [data, filters]);

  // 🔥 FILTRO POR FINALIZAÇÃO
  const filteredByFinalizacao = useMemo(() => {
    return data.filter(item => {
      if (!item.dataFinalizacao || item.dataFinalizacao === '') return false;
      
      if (filters.meses.length > 0) {
        const mesFinalizacao = getMonthYear(item.dataFinalizacao);
        if (!filters.meses.includes(mesFinalizacao)) return false;
      }
      if (filters.dias.length > 0) {
        if (!filters.dias.includes(item.dataFinalizacao)) return false;
      }
      // Para semanas, usamos a semana de finalização
      if (filters.semanas.length > 0) {
        const semanaFinalizacao = getWeekFromDate(item.dataFinalizacao);
        if (!filters.semanas.includes(semanaFinalizacao)) return false;
      }
      if (filters.assuntos.length > 0) {
        if (!filters.assuntos.includes(item.assunto)) return false;
      }
      if (filters.abertopor.length > 0) {
        if (!filters.abertopor.includes(item.abertopor)) return false;
      }
      return true;
    });
  }, [data, filters]);

  // 🔥 FUNÇÃO AUXILIAR PARA GERAR SEMANA
  function getWeekFromDate(dateStr) {
    if (!dateStr) return 'Semana sem classificação';
    try {
      let date;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          if (year > 2000) {
            date = new Date(year, month - 1, day);
          } else {
            date = new Date(parts[2], parts[1] - 1, parts[0]);
          }
        }
      } else {
        date = new Date(dateStr);
      }
      if (isNaN(date.getTime())) return 'Semana sem classificação';
      const dayOfMonth = date.getDate();
      let weekNumber = Math.ceil(dayOfMonth / 7);
      if (dayOfMonth === 31) weekNumber = 4;
      const startDay = (weekNumber - 1) * 7 + 1;
      const endDay = Math.min(weekNumber * 7, 30);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `Semana ${weekNumber} (${String(startDay).padStart(2, '0')}/${month} a ${String(endDay).padStart(2, '0')}/${month})`;
    } catch (e) {
      return 'Semana sem classificação';
    }
  }

  // 🔥 ESTATÍSTICAS
  const stats = useMemo(() => {
    const total = filteredByAbertura.length;
    const concluidos = filteredByFinalizacao.length;
    const pendentes = filteredByAbertura.filter(item => {
      return !item.dataFinalizacao || item.dataFinalizacao === '';
    }).length;
    
    const resolucao = total > 0 ? Math.round((concluidos / total) * 100) : 0;

    const cnrSim = filteredByFinalizacao.filter(d => {
      const val = d.procedentesCNR || d.procedentes || '';
      return val.toUpperCase() === 'SIM';
    }).length;
    
    const cnrNao = filteredByFinalizacao.filter(d => {
      const val = d.procedentesCNR || d.procedentes || '';
      return val.toUpperCase() === 'NÃO';
    }).length;
    
    const cnrTotalComDados = cnrSim + cnrNao;
    const percCNR = cnrTotalComDados > 0 ? Math.round((cnrSim / cnrTotalComDados) * 100) : 0;

    const bkoSim = filteredByFinalizacao.filter(d => {
      const val = d.procedentesBKO || '';
      return val.toUpperCase() === 'SIM' || val === '';
    }).length;
    
    const bkoNao = filteredByFinalizacao.filter(d => {
      const val = d.procedentesBKO || '';
      return val.toUpperCase() === 'NÃO';
    }).length;
    
    const bkoTotalComDados = bkoSim + bkoNao;
    const percBKO = bkoTotalComDados > 0 ? Math.round((bkoSim / bkoTotalComDados) * 100) : 0;

    const chat = filteredByAbertura.filter(d => {
      const estrategia = d.estrategia || d.Estratégia || '';
      return estrategia.toUpperCase().includes('CHAT');
    }).length;

    const voz = filteredByAbertura.filter(d => {
      const estrategia = d.estrategia || d.Estratégia || '';
      return estrategia.toUpperCase().includes('VOZ');
    }).length;

    const usouMascara = filteredByAbertura.filter(d =>
      d.usouMascara && d.usouMascara.toUpperCase() === 'SIM'
    ).length;

    const semAutorizacao = filteredByAbertura.filter(d =>
      d.autorizadoPor && d.autorizadoPor.toUpperCase().includes('SEM AUTORIZAÇÃO')
    ).length;

    return {
      total,
      concluidos,
      pendentes,
      resolucao,
      cnrSim,
      cnrNao,
      cnrTotal: cnrTotalComDados,
      percCNR,
      bkoSim,
      bkoNao,
      bkoTotal: bkoTotalComDados,
      percBKO,
      chat,
      voz,
      usouMascara,
      semAutorizacao
    };
  }, [filteredByAbertura, filteredByFinalizacao]);

  // 🔥 DADOS PARA O GRÁFICO SEMANAL
// 🔥 DADOS PARA O GRÁFICO SEMANAL
const weeklyDataForChart = useMemo(() => {
  const weeksMap = {};

  filteredByAbertura.forEach(item => {
    const week = item.semana || 'Semana sem classificação';
    if (!weeksMap[week]) {
      weeksMap[week] = { semana: week, volumetria: 0, concluidos: 0, pendentes: 0 };
    }
    weeksMap[week].volumetria += 1;
    if (!item.dataFinalizacao || item.dataFinalizacao === '') {
      weeksMap[week].pendentes += 1;
    }
  });

    // Concluídos: baseado na data de finalização
  filteredByFinalizacao.forEach(item => {
    const week = getWeekFromDate(item.dataFinalizacao);
    if (!weeksMap[week]) {
      weeksMap[week] = { semana: week, volumetria: 0, concluidos: 0, pendentes: 0 };
    }
    weeksMap[week].concluidos += 1;
  });

  const result = Object.values(weeksMap);
  console.log('📊 weeklyDataForChart - RESULTADO:', result);
  return result.sort((a, b) => {
    // ordenação...
  });
}, [filteredByAbertura, filteredByFinalizacao]);
  // 🔥 DADOS PARA OS COMPONENTES
  const subjectsData = filteredByAbertura; // Top Assuntos usa data de abertura
  const procedentesData = filteredByFinalizacao; // Procedentes usa data de finalização
  const performanceData = filteredByAbertura; // Performance usa data de abertura
  const tableData = filteredByAbertura; // Tabela usa data de abertura
  const emissorData = filteredByAbertura;
  const slaData = filteredByAbertura;
  const semAutorizacaoData = filteredByAbertura;

  const renderWidgetContent = (id) => {
    const map = {
      kpis: <KPICards stats={stats} />,
      weekly: <WeeklyChart data={weeklyDataForChart} />,
      topSubjects: <TopSubjects data={subjectsData} />,
      emissor: <EmissorChart data={emissorData} />,
      sla: <SLAChart data={slaData} />,
      topSubjects: <TopSubjects data={subjectsData} />,
      procedentes: <ProcedentesChart data={procedentesData} />,
      performance: <PerformanceChart data={performanceData} />,
      semAutorizacao: <SemAutorizacaoChart data={semAutorizacaoData} />,
      dataTable: <DataTable data={tableData} />,
    };
    return map[id];
  };

  const renderWidget = (id) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget || !widget.visible) return null;

    const titles = {
      kpis: 'KPIs',
      weekly: 'Evolução Semanal',
      topSubjects: 'Top Assuntos',
      emissor: 'Órgão Emissor',
      sla: 'SLA - Prazo de Atendimento',
      procedentes: 'Evolução de Procedentes',
      performance: 'Performance da Equipe',
      semAutorizacao: 'Tickets sem Autorização',
      dataTable: 'Dados Detalhados',
    };

    const IconComponent = iconMap[widget.icon] || BarChart3;

    return (
      <WidgetContainer
        key={widget.id}
        id={widget.id}
        title={titles[widget.id] || widget.id}
        icon={IconComponent}
        isEditMode={isEditMode}
        onVisibilityChange={toggleWidget}
      >
        {renderWidgetContent(widget.id)}
      </WidgetContainer>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sebrae-orange mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando dados da planilha...</p>
        </div>
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
          <button
            onClick={loadData}
            className="bg-sebrae-orange text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const visibleWidgets = widgets.filter(w => w.visible);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      
      <EditModeIndicator isEditMode={isEditMode} onExit={exitEditMode} />

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">

        <header className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img src="/logo-sebrae.png" alt="SEBRAE" className="h-12 w-auto" />
          </motion.div>

          <div className="flex flex-wrap items-center gap-2">
            {!isEditMode && (
              <button
                onClick={openEditMode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sebrae-blue text-white rounded-lg hover:bg-sebrae-blue/80 transition-colors text-xs sm:text-sm"
              >
                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Editar</span>
                <span className="sm:hidden">✎</span>
              </button>
            )}
            
            <WidgetControls 
              widgets={widgets} 
              onToggleWidget={toggleWidget}
              onResetWidgets={resetWidgets}
            />
            <ThemeToggle />
            {lastUpdate && (
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden md:inline">
                {lastUpdate.toLocaleString('pt-BR')}
              </span>
            )}
            <button
              onClick={loadData}
              className="flex items-center gap-1 bg-sebrae-orange text-white px-2.5 py-1.5 rounded-lg hover:bg-orange-600 transition-colors text-xs sm:text-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </header>

        {data && data.length > 0 && filterOptions && filterOptions.meses && filterOptions.meses.length > 0 ? (
          <Filters
            filters={filters}
            setFilters={setFilters}
            options={filterOptions}
            toggleFilter={toggleFilter}
            clearFilters={clearFilters}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.length === 0 ? 'Carregando dados...' : 'Nenhum filtro disponível'}
            </p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleWidgets.map(w => w.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-5 mt-5">
              
              {widgets.find(w => w.id === 'kpis')?.visible && (
                <div className="w-full">
                  {renderWidget('kpis')}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {widgets.find(w => w.id === 'weekly')?.visible && (
                  <div className="lg:col-span-2">
                    {renderWidget('weekly')}
                  </div>
                )}
                {widgets.find(w => w.id === 'topSubjects')?.visible && (
                  <div className="lg:col-span-1">
                    {renderWidget('topSubjects')}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {widgets.find(w => w.id === 'emissor')?.visible && (
                  <div>{renderWidget('emissor')}</div>
                )}
                {widgets.find(w => w.id === 'sla')?.visible && (
                  <div>{renderWidget('sla')}</div>
                )}
              </div>

              {widgets.find(w => w.id === 'procedentes')?.visible && (
                <div className="w-full">
                  {renderWidget('procedentes')}
                </div>
              )}

              {widgets.find(w => w.id === 'performance')?.visible && (
                <div className="w-full">
                  {renderWidget('performance')}
                </div>
              )}

              {widgets.find(w => w.id === 'semAutorizacao')?.visible && (
                <div className="w-full">
                  {renderWidget('semAutorizacao')}
                </div>
              )}

              {widgets.find(w => w.id === 'dataTable')?.visible && (
                <div className="w-full">
                  {renderWidget('dataTable')}
                </div>
              )}

            </div>
          </SortableContext>
        </DndContext>

        <footer className="mt-8 text-center text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
          {data.length} chamados carregados | 
          {stats.cnrSim || 0} procedentes CNR ({stats.percCNR || 0}%) | 
          {stats.bkoSim || 0} procedentes BKO ({stats.percBKO || 0}%) | 
          Última atualização: {lastUpdate?.toLocaleString('pt-BR')}
        </footer>

      </div>
    </div>
  );
}

export default App;