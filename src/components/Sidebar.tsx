import { AlertCircle, Clock, Settings } from 'lucide-react';
import { ProductionOrder } from '../types';

interface SidebarProps {
  orders: ProductionOrder[];
  speedsCount: number;
}

export function Sidebar({ orders, speedsCount }: SidebarProps) {
  const pendingOrders = orders.filter(o => o.status !== 'completed');
  const urgentCount = pendingOrders.filter(
    o => new Date(o.fechaVencimiento).getTime() < Date.now() + 86400000 * 3
  ).length;

  const totalMinutes = pendingOrders.reduce((acc, o) => acc + (o.calculatedDurationMinutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = Math.round(totalMinutes % 60);
  
  // Workload estimate (assuming 24h work day but only Mon-Fri)
  const workloadDays = (totalMinutes / (24 * 60)).toFixed(1);

  return (
    <aside className="col-span-12 lg:col-span-3 flex flex-col gap-3">
      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 h-full flex flex-col shadow-inner">
        <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 border-b border-slate-700/50 pb-2">
          Estado de Producción
        </h2>
        
        <div className="space-y-3 flex-1">
          {/* Workload Card */}
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all">
            <p className="text-[9px] text-blue-400 uppercase font-bold tracking-[0.1em] mb-2 flex items-center gap-1.5">
              <Clock size={10} /> Carga Trabajo
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">{totalHours}</span>
              <span className="text-xs font-bold text-blue-400">h</span>
              <span className="text-sm font-bold text-slate-400 ml-0.5">{remainingMins}m</span>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-500/10">
              <p className="text-[9px] text-slate-400 leading-tight uppercase">
                ≈ <span className="text-blue-300 font-bold">{workloadDays} d</span> laborables
              </p>
            </div>
          </div>
          
          {/* Urgent Card */}
          <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/20 shadow-sm">
            <p className="text-[9px] text-orange-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
               <AlertCircle size={10} /> Urgentes (Venc.)
            </p>
            <p className="text-xl font-bold flex items-baseline gap-1.5 text-slate-100">
              {urgentCount}
              <span className="text-[9px] font-normal text-slate-500 uppercase">Órdenes</span>
            </p>
          </div>

          <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-700/30 flex justify-between items-center">
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-widest">Maquinas</span>
            <span className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded ${speedsCount > 0 ? 'text-green-400 bg-green-500/10' : 'text-slate-500 bg-slate-800'}`}>
              {speedsCount}
            </span>
          </div>

          {speedsCount === 0 && (
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-[8px] text-red-400 leading-tight font-bold uppercase">
                ⚠️ Importe velocidades
              </p>
            </div>
          )}

          <div className="mt-4 p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:opacity-10 transition-opacity">
              <Settings size={30} className="animate-spin-slow" />
            </div>
            <p className="text-[10px] text-slate-400 leading-snug mb-2 font-black uppercase tracking-widest text-[#94a3b8]">
                Cálculo de Tiempo
            </p>
            <p className="text-[10px] text-slate-500 leading-snug">
              T = (Cant. × Largo Unit.) / Velocidad
            </p>
            <p className="text-[9px] text-slate-600 mt-2 italic font-mono uppercase tracking-tighter">
              El tiempo se planifica solo en días laborables (Lun 06h a Sáb 06h).
            </p>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">
            <span>Eficiencia</span>
            <span className="text-blue-400">92%</span>
          </div>
          <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.5)]" style={{ width: '92%' }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
