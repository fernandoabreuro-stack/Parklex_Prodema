import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { ProductionOrder, OrderStatus } from '../types';
import { STATUS_LABELS } from '../constants';
import { formatDuration } from '../lib/planner';

interface OrdersTableProps {
  orders: ProductionOrder[];
  onUpdateManualOrder: (id: string, value: string) => void;
  onUpdatePriority: (id: string, value: number) => void;
  onUpdateManualDuration?: (id: string, minutes: number) => void;
  onChangeStatus: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
}

export function OrdersTable({ 
  orders, 
  onUpdateManualOrder, 
  onUpdatePriority, 
  onUpdateManualDuration,
  onChangeStatus, 
  onDelete 
}: OrdersTableProps) {
  return (
    <div className="flex-1 overflow-auto custom-scrollbar">
      <table className="w-full text-left border-collapse table-fixed">
        <thead className="bg-slate-800 sticky top-0 z-10 backdrop-blur-md">
          <tr className="text-slate-500 text-[9px] uppercase tracking-[0.2em] font-black border-b border-slate-700">
            <th className="p-4 w-16">ORD</th>
            <th className="p-4 w-16">PRI</th>
            <th className="p-4 w-28">Fecha Creación</th>
            <th className="p-4 w-28">Nº Pedido</th>
            <th className="p-4 w-28">Pedido Rel.</th>
            <th className="p-4 w-20">Nº</th>
            <th className="p-4 w-28">Orden Alm.</th>
            <th className="p-4 w-32">Cod. Procedencia</th>
            <th className="p-4 w-40">Descripción</th>
            <th className="p-4 w-24">Cantidad</th>
            <th className="p-4 w-28 text-orange-400">Tiempo Est.</th>
            <th className="p-4 w-40 text-blue-400">Planificación Prod.</th>
            <th className="p-4 w-24">Nº Ruta</th>
            <th className="p-4 w-28">Cod. Almacén</th>
            <th className="p-4 w-28">País Origen</th>
            <th className="p-4 w-28 text-center">Vencimiento</th>
            <th className="p-4 w-32">Nombre Centro</th>
            <th className="p-4 w-32">Estado</th>
            <th className="p-4 w-24 text-right pr-6">Op</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/40 font-mono text-xs">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => (
              <motion.tr
                layout
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`group hover:bg-slate-700/20 transition-all ${order.priority === 1 ? 'bg-orange-500/[0.07] border-l-2 border-l-orange-500' : ''}`}
              >
                <td className="p-4">
                  <input 
                    type="number" 
                    placeholder="--"
                    value={order.manualOrder === null ? '' : order.manualOrder}
                    onChange={(e) => onUpdateManualOrder(order.id, e.target.value)}
                    className="w-10 bg-slate-900 border border-slate-700 rounded text-center py-1 font-black text-blue-400 focus:border-blue-500 outline-none transition-all"
                  />
                </td>
                <td className="p-4">
                  <input 
                    type="number" 
                    min="0"
                    max="5"
                    value={order.priority}
                    onChange={(e) => onUpdatePriority(order.id, parseInt(e.target.value) || 0)}
                    className={`w-10 bg-slate-900 border rounded text-center py-1 font-black transition-all ${
                      order.priority === 1 ? 'border-orange-500 text-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]' : 
                      order.priority > 0 ? 'border-blue-500 text-blue-500' : 'border-slate-700 text-slate-500 opacity-30 hover:opacity-100'
                    }`}
                  />
                </td>
                <td className="p-4 text-slate-400 text-[10px]">
                  {new Date(order.fechaCreacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </td>
                <td className="p-4">
                  <span className="font-black text-slate-50 uppercase text-[10px] tracking-wider">{order.numeroPedido}</span>
                </td>
                <td className="p-4 text-slate-400">{order.pedidoVentaRelacionado}</td>
                <td className="p-4 text-blue-400 font-bold">{order.numeroInterno}</td>
                <td className="p-4 text-slate-500">{order.ordenAlmacen}</td>
                <td className="p-4 text-slate-300 font-bold">{order.codProcedencia}</td>
                <td className="p-4 text-slate-400 truncate max-w-[160px]" title={order.descripcion}>{order.descripcion}</td>
                <td className="p-4 text-slate-100 font-black">
                  {order.isSpecialTask ? '--' : order.cantidad.toLocaleString()}
                </td>
                <td className="p-4 text-orange-400/80 font-black">
                  {order.isSpecialTask && onUpdateManualDuration ? (
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        min="0"
                        value={Math.floor((order.manualDurationMinutes || 0) / 60)}
                        onChange={(e) => {
                          const h = parseInt(e.target.value) || 0;
                          const m = (order.manualDurationMinutes || 0) % 60;
                          onUpdateManualDuration(order.id, h * 60 + m);
                        }}
                        className="w-10 bg-slate-900 border border-slate-700 rounded text-center py-0.5 text-[10px] font-black text-orange-400 focus:border-orange-500 outline-none"
                        title="Horas"
                      />
                      <span className="text-[9px] text-slate-600">h</span>
                      <input 
                        type="number" 
                        min="0"
                        max="59"
                        value={(order.manualDurationMinutes || 0) % 60}
                        onChange={(e) => {
                          const h = Math.floor((order.manualDurationMinutes || 0) / 60);
                          const m = parseInt(e.target.value) || 0;
                          onUpdateManualDuration(order.id, h * 60 + m);
                        }}
                        className="w-10 bg-slate-900 border border-slate-700 rounded text-center py-0.5 text-[10px] font-black text-orange-400 focus:border-orange-500 outline-none"
                        title="Minutos"
                      />
                      <span className="text-[9px] text-slate-600">m</span>
                    </div>
                  ) : (
                    formatDuration(order.calculatedDurationMinutes)
                  )}
                </td>
                <td className="p-4">
                  {order.scheduledStart && order.scheduledEnd ? (
                    <div className="flex flex-col text-[9px] leading-tight font-black uppercase text-blue-300">
                      <span>In: {new Date(order.scheduledStart).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - {new Date(order.scheduledStart).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-slate-500">Out: {new Date(order.scheduledEnd).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - {new Date(order.scheduledEnd).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ) : '--'}
                </td>
                <td className="p-4 text-slate-500">{order.isSpecialTask ? '--' : order.numeroRuta}</td>
                <td className="p-4 text-slate-500">{order.isSpecialTask ? '--' : order.codAlmacen}</td>
                <td className="p-4 text-slate-500 uppercase">{order.isSpecialTask ? '--' : order.paisOrigen}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-[10px] font-black ${
                    Math.ceil((new Date(order.fechaVencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 2 && order.status !== 'completed'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}>
                    {new Date(order.fechaVencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                  </span>
                </td>
                <td className="p-4 text-slate-500 truncate max-w-[120px]">{order.centroProduccion}</td>
                <td className="p-4">
                  <select 
                    value={order.status}
                    onChange={(e) => onChangeStatus(order.id, e.target.value as OrderStatus)}
                    className={`text-[10px] uppercase font-black px-2 py-1 rounded-md border outline-none cursor-pointer transition-all ${STATUS_LABELS[order.status].color}`}
                  >
                    {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                      <option key={val} value={val} className="bg-slate-900 text-white font-mono">{label}</option>
                    ))}
                  </select>
                </td>
                <td className="p-4 text-right pr-6">
                  <button 
                    onClick={() => onDelete(order.id)}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all active:scale-90"
                    title="Eliminar orden"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
