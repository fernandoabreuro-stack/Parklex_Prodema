import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ProductionOrder, MachineSpeed } from '../types';

/**
 * Fetch all orders from Supabase.
 */
export async function fetchOrdersFromSupabase(): Promise<ProductionOrder[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.warn('Error fetching orders from Supabase:', error.message);
      return null;
    }

    return (data || []).map(item => ({
      ...item,
      // Ensure correct parsing of types (e.g. bigints or numbers stored as strings/numeric)
      cantidad: Number(item.cantidad),
      createdAt: Number(item.createdAt),
      manualOrder: item.manualOrder !== null ? Number(item.manualOrder) : null,
      priority: Number(item.priority),
      manualDurationMinutes: item.manualDurationMinutes !== null ? Number(item.manualDurationMinutes) : undefined,
      calculatedDurationMinutes: item.calculatedDurationMinutes !== null ? Number(item.calculatedDurationMinutes) : undefined,
      scheduledStart: item.scheduledStart !== null ? Number(item.scheduledStart) : undefined,
      scheduledEnd: item.scheduledEnd !== null ? Number(item.scheduledEnd) : undefined,
    })) as ProductionOrder[];
  } catch (err) {
    console.warn('Network error fetching orders from Supabase:', err);
    return null;
  }
}

/**
 * Upsert/Save multiple orders to Supabase.
 */
export async function saveOrdersToSupabase(orders: ProductionOrder[]): Promise<boolean> {
  if (!isSupabaseConfigured() || orders.length === 0) return false;

  try {
    // Format records appropriately to match Postgres schema
    const formatted = orders.map(o => ({
      id: o.id,
      fechaCreacion: o.fechaCreacion,
      numeroPedido: o.numeroPedido || '',
      pedidoVentaRelacionado: o.pedidoVentaRelacionado || '',
      numeroInterno: o.numeroInterno || '',
      ordenAlmacen: o.ordenAlmacen || '',
      codProcedencia: o.codProcedencia || '',
      descripcion: o.descripcion || '',
      cantidad: o.cantidad || 0,
      numeroRuta: o.numeroRuta || '',
      codAlmacen: o.codAlmacen || '',
      paisOrigen: o.paisOrigen || '',
      fechaVencimiento: o.fechaVencimiento,
      centroProduccion: o.centroProduccion || '',
      manualOrder: o.manualOrder,
      priority: o.priority,
      status: o.status,
      createdAt: o.createdAt,
      isSpecialTask: o.isSpecialTask || false,
      manualDurationMinutes: o.manualDurationMinutes || null,
      calculatedDurationMinutes: o.calculatedDurationMinutes || null,
      scheduledStart: o.scheduledStart || null,
      scheduledEnd: o.scheduledEnd || null,
    }));

    const { error } = await supabase
      .from('orders')
      .upsert(formatted);

    if (error) {
      console.warn('Error saving orders to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error saving orders to Supabase:', err);
    return false;
  }
}

/**
 * Delete a single order from Supabase.
 */
export async function deleteOrderFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`Error deleting order ${id} from Supabase:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Network error deleting order ${id} from Supabase:`, err);
    return false;
  }
}

/**
 * Clear all orders from Supabase.
 */
export async function clearAllOrdersFromSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .neq('id', 'placeholder-non-existent-id'); // Delete everything

    if (error) {
      console.warn('Error clearing orders from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error clearing orders from Supabase:', err);
    return false;
  }
}

/**
 * Fetch all machine speeds from Supabase.
 */
export async function fetchSpeedsFromSupabase(): Promise<MachineSpeed[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('machine_speeds')
      .select('*');

    if (error) {
      console.warn('Error fetching speeds from Supabase:', error.message);
      return null;
    }

    return (data || []).map(item => ({
      codProcedencia: item.codProcedencia,
      speedMpm: Number(item.speedMpm),
      unitLength: Number(item.unitLength)
    })) as MachineSpeed[];
  } catch (err) {
    console.warn('Network error fetching speeds from Supabase:', err);
    return null;
  }
}

/**
 * Save machine speeds to Supabase.
 */
export async function saveSpeedsToSupabase(speeds: MachineSpeed[]): Promise<boolean> {
  if (!isSupabaseConfigured() || speeds.length === 0) return false;

  try {
    const formatted = speeds.map(s => ({
      codProcedencia: s.codProcedencia,
      speedMpm: s.speedMpm,
      unitLength: s.unitLength
    }));

    // Clean up existing to overwrite (or upsert)
    const { error } = await supabase
      .from('machine_speeds')
      .upsert(formatted);

    if (error) {
      console.warn('Error upserting speeds to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error saving speeds to Supabase:', err);
    return false;
  }
}
