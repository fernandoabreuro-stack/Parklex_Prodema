import { OrderStatus, ProductionOrder } from "./types";

export const INITIAL_ORDERS: ProductionOrder[] = [
  {
    id: "1",
    fechaCreacion: "2026-04-20",
    numeroPedido: "PED-2026-001",
    pedidoVentaRelacionado: "PV-XL-009",
    numeroInterno: "INT-8832",
    ordenAlmacen: "Falso",
    codProcedencia: "MOV-77-AA",
    descripcion: "Papel Impregnado Melamina 80gr",
    cantidad: 2500,
    numeroRuta: "RUTA-NORTE-1",
    codAlmacen: "ALM-PRINCIPAL",
    paisOrigen: "España",
    fechaVencimiento: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    centroProduccion: "Unidad Impregnación 1",
    manualOrder: 1,
    priority: 1,
    status: "in_progress",
    createdAt: Date.now(),
  },
  {
    id: "2",
    fechaCreacion: "2026-04-21",
    numeroPedido: "PED-2026-005",
    pedidoVentaRelacionado: "PV-XL-012",
    numeroInterno: "INT-8840",
    ordenAlmacen: "Falso",
    codProcedencia: "MOV-77-BB",
    descripcion: "Papel Kraft Impregnado 120gr",
    cantidad: 5000,
    numeroRuta: "RUTA-NORTE-2",
    codAlmacen: "ALM-SECUNDARIO",
    paisOrigen: "España",
    fechaVencimiento: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    centroProduccion: "Unidad Impregnación 1",
    manualOrder: 2,
    priority: 2,
    status: "pending",
    createdAt: Date.now() + 1000,
  }
];

export const STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Programado", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  in_progress: { label: "En Proceso", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  completed: { label: "Terminado", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  on_hold: { label: "En Pausa", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
};
