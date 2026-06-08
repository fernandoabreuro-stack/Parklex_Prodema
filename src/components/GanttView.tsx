import { useMemo } from 'react';
import { motion, Reorder, useDragControls } from 'motion/react';
import { ProductionOrder } from '../types';
import { Clock, PlayCircle, GripVertical } from 'lucide-react';
import { formatDuration } from '../lib/planner';
import { getWorkingSegments } from '../lib/workingHours';

interface GanttViewProps {
  orders: ProductionOrder[];
  onReorder?: (newOrders: ProductionOrder[]) => void;
}

interface GanttRowProps {
  key?: string;
  order: ProductionOrder;
  days: Date[];
  totalDays: number;
  minDate: Date;
  getPosByTs: (ts?: number) => number;
  getPriorityColor: (o: ProductionOrder) => string;
}

function GanttRow({ 
  order, 
  days, 
  totalDays, 
  minDate, 
  getPosByTs, 
  getPriorityColor 
}: GanttRowProps) {
  const dragControls = useDragControls();

  if (!order.scheduledStart || !order.scheduledEnd) return null;

  const segments = getWorkingSegments(order.scheduledStart, order.scheduledEnd);
  const deadlineTs = new Date(order.fechaVencimiento).getTime();
  const deadlinePos = getPosByTs(deadlineTs);

  return (
    <Reorder.Item 
      value={order}
      dragListener={false}
      dragControls={dragControls}
      className="flex border-b border-slate-800/50 group h-14 bg-slate-900/10 hover:bg-slate-800/40 transition-colors"
    >
      {/* Labels */}
      <div className="w-64 p-2 px-3 shrink-0 border-r border-slate-700/30 bg-slate-800/80 sticky left-0 z-20 flex flex-col justify-center leading-tight">
        <div className="flex justify-between items-center mb-0.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-slate-700 rounded transition-colors shrink-0"
            >
              <GripVertical size={12} className="text-slate-500 group-hover:text-blue-400" />
            </div>
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter truncate">
              Nº: {order.numeroInterno || '--'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-orange-400 shrink-0">
            <Clock size={10} />
            <span className="text-[9px] font-black uppercase">
              {formatDuration(order.calculatedDurationMinutes)}
            </span>
          </div>
        </div>
        <span className="text-[9px] font-black text-slate-100 truncate uppercase pl-5">
          {order.codProcedencia || 'SIN PROC.'}
        </span>
        <span className="text-[7px] text-slate-500 truncate uppercase font-mono mt-0.5 pl-5">
          {order.descripcion}
        </span>
      </div>

      {/* Timeline Grid */}
      <div className="relative flex flex-1 items-center bg-slate-900/20">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex pointer-events-none">
          {days.map((day, i) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div key={i} className={`w-16 border-r border-slate-700/10 shrink-0 h-full ${isWeekend ? 'bg-slate-950/40' : ''}`} />
            );
          })}
        </div>

        {/* Deadline Marker */}
        <div 
          style={{ left: `${deadlinePos}%` }}
          className="absolute h-full w-[2px] bg-red-500/30 z-0 border-l border-red-500/10"
          title={`Vencimiento: ${order.fechaVencimiento}`}
        />

        {/* Scheduled Task Bar(s) */}
        {segments.map((seg, idx) => {
          const startPos = getPosByTs(seg.start);
          const endPos = getPosByTs(seg.end);
          const widthLimit = Math.max(0.2, endPos - startPos);

          return (
            <motion.div
              key={idx}
              layoutId={`${order.id}-seg-${idx}`}
              style={{ left: `${startPos}%`, width: `${widthLimit}%`, position: 'absolute' }}
              className={`h-7 rounded-md flex items-center px-2 z-10 overflow-hidden ${getPriorityColor(order)} transition-transform hover:scale-[1.01]`}
              title={`Cod. Proc: ${order.codProcedencia || 'N/A'}\nInicio: ${new Date(order.scheduledStart!).toLocaleString()}\nFin: ${new Date(order.scheduledEnd!).toLocaleString()}`}
            >
              <div className="flex items-center gap-2 w-full overflow-hidden">
                {idx === 0 && <PlayCircle size={10} className="shrink-0 text-white/50" />}
                <span className="text-[8px] font-black text-white uppercase whitespace-nowrap drop-shadow-md truncate">
                  {order.priority === 1 ? '🔥 URGENTE' : (order.isSpecialTask ? `⚡ ${order.descripcion}` : (order.codProcedencia || 'S/P'))}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Reorder.Item>
  );
}

export function GanttView({ orders, onReorder }: GanttViewProps) {
  // 1. Calculate time range based on scheduled production dates
  const { minDate, totalDays } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (orders.length === 0) {
      return { minDate: now, totalDays: 14 };
    }

    const scheduledOrders = orders.filter(o => o.scheduledStart && o.scheduledEnd);
    if (scheduledOrders.length === 0) {
      return { minDate: now, totalDays: 14 };
    }

    const starts = scheduledOrders.map(o => o.scheduledStart!);
    const ts = Math.min(...starts, now.getTime());
    const min = new Date(ts);
    min.setHours(0, 0, 0, 0);

    return { minDate: min, totalDays: 14 }; 
  }, [orders]);

  // Generate day headers
  const days = useMemo(() => {
    const result = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(minDate.getTime() + i * 86400000);
      result.push(d);
    }
    return result;
  }, [minDate, totalDays]);

  const getPosByTs = (ts?: number) => {
    if (!ts) return 0;
    const diff = (ts - minDate.getTime()) / (1000 * 60 * 60 * 24);
    return (diff / totalDays) * 100;
  };

  const getPriorityColor = (order: ProductionOrder) => {
    if (order.status === 'completed') return 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]';
    if (order.isSpecialTask) {
      if (order.descripcion === 'Limpieza') return 'bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.4)]';
      if (order.descripcion === 'Cambio') return 'bg-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.4)]';
    }
    if (order.priority === 1) return 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]';
    if (order.priority > 0 && order.priority < 3) return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]';
    return 'bg-slate-600';
  };

  if (orders.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
        <p className="text-sm font-mono uppercase tracking-[0.2em]">No hay datos para generar el diagrama</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50">
      {/* Time Header */}
      <div className="flex border-b border-slate-700/50 min-w-max sticky top-0 bg-slate-800 z-30">
        <div className="w-64 p-4 shrink-0 border-r border-slate-700/50 bg-slate-800/80 backdrop-blur-md flex items-center gap-2">
          <GripVertical size={14} className="text-slate-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secuencia (Grip para mover)</span>
        </div>
        <div className="flex">
          {days.map((day, i) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div 
                key={i} 
                className={`w-16 p-3 border-r border-slate-700/30 text-center shrink-0 flex flex-col items-center justify-center ${isWeekend ? 'bg-slate-900/50' : ''}`}
              >
                <span className={`text-[8px] uppercase font-bold ${isWeekend ? 'text-slate-600' : 'text-slate-500'}`}>{day.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                <span className={`text-[10px] font-black ${day.toDateString() === new Date().toDateString() ? 'text-blue-400' : (isWeekend ? 'text-slate-600' : 'text-slate-300')}`}>
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gantt Rows */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <Reorder.Group 
          axis="y" 
          values={orders} 
          onReorder={onReorder || (() => {})} 
          className="min-w-max w-full"
        >
          {orders.map((order) => (
            <GanttRow 
              key={order.id} 
              order={order} 
              days={days} 
              totalDays={totalDays} 
              minDate={minDate} 
              getPosByTs={getPosByTs} 
              getPriorityColor={getPriorityColor} 
            />
          ))}
        </Reorder.Group>
      </div>
    </div>
  );
}

