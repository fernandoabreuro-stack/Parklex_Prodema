import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  FileSpreadsheet,
  Package,
  Gauge,
  Download,
  Settings
} from 'lucide-react';
import { ProductionOrder, OrderStatus, MachineSpeed } from './types';
import { INITIAL_ORDERS } from './constants';
import { processExcelFile, processSpeedsExcel, exportToExcel } from './lib/excel';
import { GanttView } from './components/GanttView';
import { Sidebar } from './components/Sidebar';
import { OrdersTable } from './components/OrdersTable';
import { AddOrderModal } from './components/AddOrderModal';
import { calculateDurations, scheduleOrders } from './lib/planner';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { 
  fetchOrdersFromSupabase, 
  saveOrdersToSupabase, 
  deleteOrderFromSupabase, 
  clearAllOrdersFromSupabase, 
  fetchSpeedsFromSupabase, 
  saveSpeedsToSupabase 
} from './lib/supabaseSync';

export default function App() {
  const [orders, setOrders] = useState<ProductionOrder[]>(() => {
    const saved = localStorage.getItem('impregnation_planner_v5');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });
  const [machineSpeeds, setMachineSpeeds] = useState<MachineSpeed[]>(() => {
    const saved = localStorage.getItem('impregnation_speeds_v5');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [activeView, setActiveView] = useState<'table' | 'gantt'>('table');
  const [importFeedback, setImportFeedback] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speedsInputRef = useRef<HTMLInputElement>(null);

  const [supabaseStatus, setSupabaseStatus] = useState<'not_configured' | 'connecting' | 'connected' | 'error'>('connecting');
  const isFirstLoad = useRef(true);

  // Load from Supabase on mount (if configured)
  useEffect(() => {
    async function loadData() {
      if (!isSupabaseConfigured()) {
        setSupabaseStatus('not_configured');
        isFirstLoad.current = false;
        return;
      }
      
      setSupabaseStatus('connecting');
      try {
        const fetchedOrders = await fetchOrdersFromSupabase();
        const fetchedSpeeds = await fetchSpeedsFromSupabase();

        if (fetchedOrders === null || fetchedSpeeds === null) {
          setSupabaseStatus('error');
          isFirstLoad.current = false;
          return;
        }

        setOrders(fetchedOrders);
        setMachineSpeeds(fetchedSpeeds);
        setSupabaseStatus('connected');
        setImportFeedback({ message: 'Conectado y sincronizado con Supabase', type: 'success' });
      } catch (err) {
        console.error('Supabase load error:', err);
        setSupabaseStatus('error');
      } finally {
        isFirstLoad.current = false;
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('impregnation_planner_v5', JSON.stringify(orders));
    
    if (isFirstLoad.current) return;

    if (isSupabaseConfigured()) {
      saveOrdersToSupabase(orders);
    }
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('impregnation_speeds_v5', JSON.stringify(machineSpeeds));
    
    if (isFirstLoad.current) return;

    if (isSupabaseConfigured()) {
      saveSpeedsToSupabase(machineSpeeds);
    }
  }, [machineSpeeds]);

  useEffect(() => {
    if (importFeedback) {
      const timer = setTimeout(() => setImportFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [importFeedback]);

  // --- Handlers ---
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await processExcelFile(file);
      setOrders(prev => [...imported, ...prev]);
      setImportFeedback({ message: `Se han importado ${imported.length} órdenes con éxito`, type: 'success' });
    } catch (error: any) {
      setImportFeedback({ message: error.message || 'Error al importar Excel', type: 'error' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportSpeeds = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedSpeeds = await processSpeedsExcel(file);
      setMachineSpeeds(importedSpeeds);
      setImportFeedback({ message: `Configuradas ${importedSpeeds.length} velocidades de máquina`, type: 'success' });
    } catch (error: any) {
      setImportFeedback({ message: error.message || 'Error al importar velocidades', type: 'error' });
    } finally {
      if (speedsInputRef.current) speedsInputRef.current.value = '';
    }
  };

  const handleAddOrder = (data: Partial<ProductionOrder>) => {
    const order: ProductionOrder = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      manualOrder: null,
      status: 'pending',
      createdAt: Date.now(),
    } as ProductionOrder;
    setOrders([order, ...orders]);
    setIsAdding(false);
  };

  const updateManualOrder = (id: string, value: string) => {
    const num = value === '' ? null : parseInt(value);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, manualOrder: num } : o));
  };

  const updatePriority = (id: string, newPriority: number) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, priority: Math.max(0, Math.min(5, newPriority)) } : o));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    if (isSupabaseConfigured()) {
      deleteOrderFromSupabase(id);
    }
  };

  const handleClearAll = () => {
    setOrders([]);
    setShowClearConfirm(false);
    if (isSupabaseConfigured()) {
      clearAllOrdersFromSupabase();
    }
  };

  const changeStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleAddSpecialTask = (type: 'Limpieza' | 'Cambio') => {
    const order: ProductionOrder = {
      id: Math.random().toString(36).substr(2, 9),
      fechaCreacion: new Date().toISOString().split('T')[0],
      numeroPedido: '',
      pedidoVentaRelacionado: '',
      numeroInterno: '',
      ordenAlmacen: 'Falso',
      codProcedencia: type.toUpperCase(),
      descripcion: type,
      cantidad: 1,
      numeroRuta: '-',
      codAlmacen: '-',
      paisOrigen: '-',
      fechaVencimiento: new Date().toISOString().split('T')[0],
      centroProduccion: orders.length > 0 ? orders[0].centroProduccion : 'PLANTA',
      manualOrder: null,
      priority: 3,
      status: 'pending',
      createdAt: Date.now(),
      isSpecialTask: true,
      manualDurationMinutes: 60, // Default 1 hour
    };
    setOrders([order, ...orders]);
  };

  const updateManualDuration = (id: string, minutes: number) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, manualDurationMinutes: minutes } : o));
  };

  // --- Core Processing Logic ---
  const processedOrders = useMemo(() => {
    // 1. Calculate durations based on machine speeds
    const withDurations = calculateDurations(orders, machineSpeeds);
    
    // 2. Sequence and schedule
    const scheduled = scheduleOrders(withDurations);

    // 3. Filter by search term
    return scheduled.filter(o => 
      o.numeroPedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.numeroRuta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.codProcedencia.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, machineSpeeds, searchTerm]);

  return (
    <div className="flex flex-col p-6 h-screen overflow-hidden bg-[#0f172a]">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Package className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase">Planificador de Tareas</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-[0.2em] flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> SISTEMA OPERATIVO
              <span className="text-slate-600 text-[10px]">|</span>
              {supabaseStatus === 'not_configured' && (
                <span className="text-[9px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700 uppercase tracking-widest flex items-center gap-1.5" title="Guardando localmente en LocalStorage. Configura las variables para usar Supabase.">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> LOCAL (OFFLINE)
                </span>
              )}
              {supabaseStatus === 'connecting' && (
                <span className="text-[9px] text-blue-400 font-bold bg-blue-950/45 px-2 py-0.5 rounded border border-blue-800/50 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> CONECTANDO BD...
                </span>
              )}
              {supabaseStatus === 'connected' && (
                <span className="text-[9px] text-green-400 font-bold bg-green-950/45 px-2 py-0.5 rounded border border-green-800/50 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.7)] animate-pulse" /> SUPABASE ONLINE
                </span>
              )}
              {supabaseStatus === 'error' && (
                <span className="text-[9px] text-red-400 font-bold bg-red-950/45 px-2 py-0.5 rounded border border-red-800/50 uppercase tracking-widest flex items-center gap-1.5" title="Error de conexión o tablas no creadas en Supabase.">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> ERROR SUPABASE
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700/50 mr-2">
            {['table', 'gantt'].map((view) => (
              <button 
                key={view}
                onClick={() => setActiveView(view as any)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase ${activeView === view ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {view}
              </button>
            ))}
          </div>
          <div className="relative group mr-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/50 rounded-lg focus:border-blue-500 outline-none transition-all text-[12px] w-48 text-white focus:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => exportToExcel(processedOrders)}
            className="p-2.5 bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white rounded-lg border border-green-500/30 transition-all flex items-center gap-2"
            title="Exportar Planificación a Excel"
          >
            <Download size={18} />
            <span className="text-[10px] font-bold uppercase hidden xl:inline">Exportar</span>
          </button>
          <button 
            onClick={() => handleAddSpecialTask('Limpieza')}
            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 active:scale-95 uppercase tracking-widest shadow-lg shadow-purple-900/30"
          >
            <Settings size={14} /> Limpieza
          </button>
          <button 
            onClick={() => handleAddSpecialTask('Cambio')}
            className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 active:scale-95 uppercase tracking-widest shadow-lg shadow-amber-900/30"
          >
            <Settings size={14} /> Cambio
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 active:scale-95 uppercase tracking-widest shadow-lg shadow-blue-900/30"
          >
            <Plus size={16} /> Nueva Orden
          </button>
          <button 
            onClick={() => speedsInputRef.current?.click()}
            className="p-2.5 bg-slate-700/50 hover:bg-orange-500/20 text-slate-300 hover:text-orange-400 rounded-lg border border-slate-600/50 hover:border-orange-500/50 transition-all flex items-center gap-2"
            title="Importar Velocidades de Máquina"
          >
            <Gauge size={18} />
            <span className="text-[10px] font-bold uppercase hidden xl:inline">Velocidades</span>
            <input type="file" ref={speedsInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImportSpeeds} />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600/50 transition-colors relative"
            title="Importar Excel de Órdenes"
          >
            <FileSpreadsheet size={18} />
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowClearConfirm(!showClearConfirm)}
              className={`p-2.5 rounded-lg border transition-all shadow-lg flex items-center gap-2 ${
                showClearConfirm ? 'bg-red-600 border-red-500 text-white' : 'bg-red-950/20 border-red-900/30 text-red-500 hover:bg-red-600 hover:text-white'
              }`}
              title="Borrar todas las órdenes"
            >
              <Trash2 size={18} />
              <span className="text-[10px] font-bold uppercase hidden xl:inline">Limpiar</span>
            </button>
            {showClearConfirm && (
              <>
                <div 
                  className="fixed inset-0 z-[65]" 
                  onClick={() => setShowClearConfirm(false)} 
                />
                <div className="absolute top-12 right-0 bg-slate-900 border border-red-500/50 p-3 rounded-lg shadow-2xl z-[70] min-w-[200px] animate-in fade-in zoom-in duration-200">
                  <p className="text-[10px] text-slate-300 mb-3 font-bold uppercase tracking-tight">¿Borrar todas las órdenes?</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleClearAll}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white text-[9px] font-black py-2.5 px-3 rounded uppercase transition-all shadow-lg active:scale-95"
                    >
                      SÍ, TODO
                    </button>
                    <button 
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-black py-2.5 px-3 rounded uppercase transition-all active:scale-95"
                    >
                      NO
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Notifications */}
      <AnimatePresence>
        {importFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-6 z-[60] px-6 py-3 rounded-xl border shadow-2xl flex items-center gap-3 backdrop-blur-md ${
              importFeedback.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
            }`}
          >
            {importFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="text-xs font-bold uppercase tracking-widest">{importFeedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        <Sidebar orders={processedOrders} speedsCount={machineSpeeds.length} />

        <div className="col-span-12 lg:col-span-9 bg-slate-800/40 rounded-xl border border-slate-700/50 flex flex-col overflow-hidden shadow-2xl backdrop-blur-sm relative">
          <AnimatePresence mode="wait">
            {activeView === 'table' ? (
              <motion.div key="table" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 overflow-hidden flex flex-col">
                <OrdersTable 
                  orders={processedOrders} 
                  onUpdateManualOrder={updateManualOrder}
                  onUpdatePriority={updatePriority}
                  onUpdateManualDuration={updateManualDuration}
                  onChangeStatus={changeStatus}
                  onDelete={deleteOrder}
                />
              </motion.div>
            ) : (
              <motion.div key="gantt" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 overflow-hidden flex flex-col">
                <GanttView 
                  orders={processedOrders} 
                  onReorder={(newOrders) => {
                    // Update the base orders with new manualOrder based on the drag-and-drop result
                    // This makes the manual ordering persistent across re-scheduling
                    const updatedOrders = orders.map(o => {
                      const newIndex = newOrders.findIndex(no => no.id === o.id);
                      if (newIndex !== -1) {
                        return { ...o, manualOrder: newIndex + 1 };
                      }
                      return o;
                    });
                    setOrders(updatedOrders);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {isAdding && <AddOrderModal onClose={() => setIsAdding(false)} onSubmit={handleAddOrder} />}
    </div>
  );
}
