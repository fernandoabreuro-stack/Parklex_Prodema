import { ProductionOrder, MachineSpeed } from '../types';
import { isWorkingTime, getNextWorkingTime } from './workingHours';

export const calculateDurations = (orders: ProductionOrder[], machineSpeeds: MachineSpeed[]): ProductionOrder[] => {
  return orders.map(order => {
    if (order.isSpecialTask && order.manualDurationMinutes !== undefined) {
      return { ...order, calculatedDurationMinutes: order.manualDurationMinutes };
    }

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const orderProc = normalize(order.codProcedencia);
    
    const config = machineSpeeds.find(s => {
      const sProc = normalize(s.codProcedencia);
      return sProc === orderProc || sProc.includes(orderProc) || orderProc.includes(sProc);
    });

    if (config && config.speedMpm > 0 && config.unitLength > 0) {
      // Duration in minutes = (Quantity * Length per unit) / Speed
      const duration = (order.cantidad * config.unitLength) / config.speedMpm;
      return { ...order, calculatedDurationMinutes: duration };
    }
    return { ...order, calculatedDurationMinutes: undefined };
  });
};

export const scheduleOrders = (orders: ProductionOrder[]): ProductionOrder[] => {
  const sorted = [...orders].sort((a, b) => {
    const ordA = a.manualOrder === null ? 999999 : a.manualOrder;
    const ordB = b.manualOrder === null ? 999999 : b.manualOrder;
    if (ordA !== ordB) return ordA - ordB;

    const pA = a.priority === 0 ? 999 : a.priority;
    const pB = b.priority === 0 ? 999 : b.priority;
    if (pA !== pB) return pA - pB;

    const dateA = new Date(a.fechaVencimiento).getTime();
    const dateB = new Date(b.fechaVencimiento).getTime();
    if (dateA !== dateB) return dateA - dateB;

    return a.createdAt - b.createdAt;
  });

  const addWorkingTime = (startTs: number, durationMs: number): number => {
    let remainingMs = durationMs;
    let currentTs = startTs;

    while (remainingMs > 0) {
      currentTs = getNextWorkingTime(currentTs);
      
      const date = new Date(currentTs);
      const day = date.getDay();
      
      // Calculate next non-working boundary (Saturday at 06:00)
      const nextStop = new Date(currentTs);
      const daysToSat = (6 - day + 7) % 7;
      
      if (daysToSat === 0 && date.getHours() < 6) {
        nextStop.setHours(6, 0, 0, 0);
      } else {
        nextStop.setDate(nextStop.getDate() + (daysToSat === 0 ? 7 : daysToSat));
        nextStop.setHours(6, 0, 0, 0);
      }
      nextStop.setMinutes(0, 0, 0);
      
      const timeAvailable = nextStop.getTime() - currentTs;
      const timeToAdd = Math.min(remainingMs, timeAvailable);
      
      currentTs += timeToAdd;
      remainingMs -= timeToAdd;

      if (remainingMs > 0) {
        currentTs = getNextWorkingTime(currentTs + 1000); 
      }
    }
    
    return currentTs;
  };

  let currentTime = getNextWorkingTime(Date.now());

  return sorted.map(order => {
    if (order.status === 'completed') {
      return { ...order, scheduledStart: undefined, scheduledEnd: undefined };
    }

    const durationMs = (order.calculatedDurationMinutes || 0) * 60 * 1000;
    if (durationMs === 0) {
       return { ...order, scheduledStart: undefined, scheduledEnd: undefined };
    }

    const start = getNextWorkingTime(currentTime);
    const end = addWorkingTime(start, durationMs);
    
    currentTime = end;

    return {
      ...order,
      scheduledStart: start,
      scheduledEnd: end
    };
  });
};


export const formatDuration = (minutes?: number): string => {
  if (!minutes || minutes <= 0) return '--';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};
