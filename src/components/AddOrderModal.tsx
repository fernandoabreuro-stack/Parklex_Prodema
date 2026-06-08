import React from 'react';
import { Calendar, Hash, Package, Globe, MapPin, Search, Settings } from 'lucide-react';
import { ProductionOrder } from '../types';

interface AddOrderModalProps {
  onClose: () => void;
  onSubmit: (order: Partial<ProductionOrder>) => void;
}

export function AddOrderModal({ onClose, onSubmit }: AddOrderModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<ProductionOrder> = {
      numeroPedido: formData.get('numeroPedido') as string,
      descripcion: formData.get('descripcion') as string,
      cantidad: Number(formData.get('cantidad')),
      fechaCreacion: formData.get('fechaCreacion') as string,
      fechaVencimiento: formData.get('fechaVencimiento') as string,
      numeroInterno: formData.get('numeroInterno') as string,
      pedidoVentaRelacionado: formData.get('pedidoVentaRelacionado') as string,
      ordenAlmacen: formData.get('ordenAlmacen') as string,
      codProcedencia: formData.get('codProcedencia') as string,
      numeroRuta: formData.get('numeroRuta') as string,
      codAlmacen: formData.get('codAlmacen') as string,
      paisOrigen: formData.get('paisOrigen') as string,
      centroProduccion: formData.get('centroProduccion') as string,
      priority: Number(formData.get('priority')) || 0,
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Nueva Orden de Producción</h2>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Formulario de Registro de Tarea</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Main info */}
          <div className="col-span-2 grid grid-cols-2 gap-6 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30 mb-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Hash size={12} className="text-blue-500" /> Nº Pedido Sale
              </label>
              <input name="numeroPedido" required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 outline-none focus:border-blue-500 transition-all font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Package size={12} className="text-blue-500" /> Cantidad
              </label>
              <input name="cantidad" required type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 outline-none focus:border-blue-500 transition-all font-mono text-sm" />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Search size={12} className="text-blue-500" /> Descripción Técnica
              </label>
              <input name="descripcion" required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 outline-none focus:border-blue-500 transition-all font-mono text-sm" />
            </div>
          </div>

          {/* Logistics */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 italic">Nº Venta Relacionado</label>
            <input name="pedidoVentaRelacionado" type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 outline-none focus:border-blue-500 transition-all text-xs" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nº Interno</label>
            <input name="numeroInterno" type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 outline-none focus:border-blue-500 transition-all text-xs" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Orden Almacén</label>
            <input name="ordenAlmacen" type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 outline-none focus:border-blue-500 transition-all text-xs" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Cód. Procedencia</label>
            <input name="codProcedencia" type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 outline-none focus:border-blue-500 transition-all text-xs" />
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
              <Calendar size={12} className="text-orange-500" /> Fecha Creación
            </label>
            <input name="fechaCreacion" required type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-blue-500 transition-all text-xs" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
              <Calendar size={12} className="text-red-500" /> Vencimiento
            </label>
            <input name="fechaVencimiento" required type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-blue-500 transition-all text-xs" />
          </div>

          {/* Meta */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
              <Settings size={12} className="text-slate-500" /> Prioridad (1-5)
            </label>
            <input name="priority" type="number" min="0" max="5" defaultValue="0" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-blue-500 transition-all text-xs" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
              <Globe size={12} className="text-slate-500" /> País de Origen
            </label>
            <input name="paisOrigen" type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 outline-none focus:border-blue-500 transition-all text-xs" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
              <MapPin size={12} className="text-slate-500" /> Centro Producción
            </label>
            <input name="centroProduccion" type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 outline-none focus:border-blue-500 transition-all text-xs" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nº Ruta</label>
            <input name="numeroRuta" type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-400 outline-none focus:border-blue-500 transition-all text-xs" />
          </div>

          <div className="col-span-2 pt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest shadow-lg shadow-blue-900/30">
              Registrar Orden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
