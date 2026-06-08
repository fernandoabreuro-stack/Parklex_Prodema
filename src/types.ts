/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold';

export interface ProductionOrder {
  id: string;
  fechaCreacion: string;
  numeroPedido: string;
  pedidoVentaRelacionado: string;
  numeroInterno: string;
  ordenAlmacen: string;
  codProcedencia: string;
  descripcion: string;
  cantidad: number;
  numeroRuta: string;
  codAlmacen: string;
  paisOrigen: string;
  fechaVencimiento: string; // The primary date for auto-sorting
  centroProduccion: string;
  
  // App specific fields
  manualOrder: number | null; // User defined sequence
  priority: number; // 1-5, where 1 is highest. 0 is unassigned.
  status: OrderStatus;
  createdAt: number;

  // Manual tasks
  isSpecialTask?: boolean;
  manualDurationMinutes?: number;

  // Calculation fields
  calculatedDurationMinutes?: number;
  scheduledStart?: number;
  scheduledEnd?: number;
}

export interface MachineSpeed {
  codProcedencia: string;
  speedMpm: number; // Velocidad en Metros por Minuto
  unitLength: number; // Longitud en metros de cada unidad (cantidad)
}

export interface PlannerState {
  orders: ProductionOrder[];
}
