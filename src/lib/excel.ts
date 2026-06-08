import * as XLSX from 'xlsx';
import { ProductionOrder, MachineSpeed } from '../types';

export const parseNumberValue = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  
  // Clean string from currencies, units, and spaces
  let str = String(val).trim().toLowerCase();
  str = str.replace(/[€$£%]/g, '');
  str = str.replace(/[a-z]/g, ''); // Remove common unit suffixes like 'kg', 'uds', etc.
  str = str.trim();

  // Handle Spanish/European format: 1.500,00 -> 1500
  let normalized = str;
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      normalized = str.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    const commaCount = (str.match(/,/g) || []).length;
    if (commaCount === 1) {
      normalized = str.replace(',', '.');
    } else {
      normalized = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    const parts = str.split('.');
    // If it ends in .XXX it's usually thousands in Spanish orders context
    if (parts.length > 1 && parts[parts.length - 1].length === 3 && parts[parts.length - 1].match(/^\d+$/)) {
      normalized = str.replace(/\./g, '');
    }
  }
  
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};

export const parseDateValue = (val: any): string => {
  if (!val) return new Date().toISOString().split('T')[0];
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return new Date().toISOString().split('T')[0];
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    // Excel base date is Dec 30, 1899
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
  }
  
  let dateStr = String(val).trim();
  // Remove time part if present (e.g. 2023-01-01 10:00:00)
  dateStr = dateStr.split(' ')[0];

  if (dateStr.includes('/') || dateStr.includes('-') || dateStr.includes('.')) {
    const parts = dateStr.split(/[/\-.]/);
    if (parts.length === 3) {
      // Check if it's YYYY-MM-DD
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      // Check if it's DD-MM-YYYY
      if (parts[2].length >= 2) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const yearRaw = parts[2];
        const y = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
        return `${y}-${m}-${d}`;
      }
    }
  }
  return dateStr;
};

export const getFieldValue = (row: any, possibleNames: string[]): any => {
  const keys = Object.keys(row);
  
  const clean = (s: string) => {
    return s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
      .trim();
  };
  
  const cleanedPossible = possibleNames.map(clean);

  // 1. First pass: exact clean match
  let matchingKey = keys.find(k => {
    const ck = clean(k);
    return cleanedPossible.includes(ck);
  });

  // 2. Second pass: includes match (only for longer terms to avoid false positives like 'n' or 'no')
  if (!matchingKey) {
    matchingKey = keys.find(k => {
      const ck = clean(k);
      return cleanedPossible.some(p => {
        if (p.length < 3) return ck === p; // Strict for short terms like "n"
        return ck.includes(p) || p.includes(ck);
      });
    });
  }

  if (matchingKey) return row[matchingKey];
  
  return null;
};

export const processExcelFile = async (file: File): Promise<ProductionOrder[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          reject(new Error('El archivo Excel no contiene filas de datos'));
          return;
        }

        const importedOrders: ProductionOrder[] = data.map((row, index) => {
          const rawFechaCreacion = getFieldValue(row, ['fecha creacion', 'fecha reg', 'f.reg', 'creacion', 'f pedido', 'fecha pedido', 'fecha']);
          const rawNumPedido = getFieldValue(row, ['numero pedido', 'pedido venta', 'documento', 'doc', 'pedido', 'venta', 'order']);
          const rawRelacionado = getFieldValue(row, ['n pedido venta relacionado', 'pedido relacionado', 'relacionado', 'vrelacionado', 'rel']);
          const rawNumInterno = getFieldValue(row, ['n', 'numero interno', 'num interno', 'ninterno', 'identificador', 'id']);
          const rawOrdenAlm = getFieldValue(row, ['orden almacen', 'o alm', 'alm', 'orden', 'almacenaje']);
          const rawCodProc = getFieldValue(row, ['cod procedencia mov', 'codigo procedencia mov', 'procedencia mov', 'cod procedencia', 'referencia', 'sku', 'cod art', 'ref', 'p/n']);
          const rawDesc = getFieldValue(row, ['descripcion', 'desc', 'articulo', 'nombre', 'material', 'detalle']);
          const rawCant = getFieldValue(row, ['cantidad', 'cant', 'unidades', 'uds', 'unidad', 'pieces', 'pcs', 'total']);
          const rawNRuta = getFieldValue(row, ['n ruta', 'ruta', 'nruta', 'n. ruta', 'itinerario', 'op']);
          const rawCodAlm = getFieldValue(row, ['codigo almacen', 'almacen', 'codalm', 'ubicacion', 'loc']);
          const rawPais = getFieldValue(row, ['pais origen', 'pais', 'origen', 'nacion', 'country']);
          const rawFechaVenc = getFieldValue(row, ['fecha de vencimiento', 'fecha vencimiento', 'vencimiento', 'venc', 'fechavenc', 'entrega', 'f. entrega', 'f vencim', 'limite', 'f.venc']);
          const rawCentro = getFieldValue(row, ['nombre de centro de produccion', 'centro de produccion', 'nombre centro', 'centro produccion', 'centro', 'fabrica', 'planta', 'unidad prod']);

          const isOrdenAlmFalse = !rawOrdenAlm || 
            String(rawOrdenAlm).toLowerCase() === 'false' || 
            String(rawOrdenAlm).toLowerCase() === '0' || 
            String(rawOrdenAlm).toLowerCase() === 'no';

          return {
            id: `import-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
            fechaCreacion: parseDateValue(rawFechaCreacion),
            numeroPedido: rawNumPedido ? String(rawNumPedido) : '',
            pedidoVentaRelacionado: rawRelacionado ? String(rawRelacionado) : '',
            numeroInterno: rawNumInterno ? String(rawNumInterno) : '',
            ordenAlmacen: isOrdenAlmFalse ? 'Falso' : String(rawOrdenAlm),
            codProcedencia: String(rawCodProc || ''),
            descripcion: String(rawDesc || ''),
            cantidad: parseNumberValue(rawCant),
            numeroRuta: String(rawNRuta || ''),
            codAlmacen: String(rawCodAlm || ''),
            paisOrigen: String(rawPais || ''),
            fechaVencimiento: parseDateValue(rawFechaVenc),
            centroProduccion: String(rawCentro || ''),
            manualOrder: null,
            priority: 0,
            status: 'pending',
            createdAt: Date.now(),
          };
        });

        resolve(importedOrders);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsBinaryString(file);
  });
};

export const processSpeedsExcel = async (file: File): Promise<MachineSpeed[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          reject(new Error('El archivo de velocidades no contiene filas de datos'));
          return;
        }

        const speeds: MachineSpeed[] = data.map((row) => {
          const cod = getFieldValue(row, ['codigo procedencia', 'cod procedencia', 'procedencia', 'articulo', 'codigo', 'cod. procedencia', 'ref', 'sku', 'part number']);
          const lengthMm = getFieldValue(row, ['longitud en milimetros', 'medida', 'longitud', 'unit length', 'metros unidad', 'medida unidad', 'long', 'longitud milimetros', 'milimetros', 'mm', 'formato']);
          const speed = getFieldValue(row, ['velocidad en metros por minuto', 'velocidad', 'vel', 'mpm', 'm/min', 'speed', 'velocidad metros/minuto', 'metros/minuto', 'velocidad nominal']);

          return {
            codProcedencia: String(cod || ''),
            speedMpm: parseNumberValue(speed),
            unitLength: parseNumberValue(lengthMm) / 1000, 
          };
        }).filter(s => s.codProcedencia !== '' && s.speedMpm > 0);

        resolve(speeds);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsBinaryString(file);
  });
};

export const exportToExcel = (orders: ProductionOrder[]) => {
  const data = orders.map(o => ({
    'ID Interno': o.numeroInterno,
    'Nº Pedido': o.numeroPedido,
    'Pedido Venta Relacionado': o.pedidoVentaRelacionado,
    'Cod. Procedencia': o.codProcedencia,
    'Descripción': o.descripcion,
    'Cantidad': o.cantidad,
    'Nº Ruta': o.numeroRuta,
    'Cod. Almacén': o.codAlmacen,
    'País Origen': o.paisOrigen,
    'Fecha Vencimiento': o.fechaVencimiento,
    'Centro Producción': o.centroProduccion,
    'Estado': o.status,
    'Prioridad': o.priority === 0 ? 'Sin asignar' : (o.priority === 1 ? 'URGENTE' : o.priority),
    'Duración Est. (min)': o.calculatedDurationMinutes ? Math.round(o.calculatedDurationMinutes) : '-',
    'Inicio Planificado': o.scheduledStart ? new Date(o.scheduledStart).toLocaleString('es-ES') : '-',
    'Fin Planificado': o.scheduledEnd ? new Date(o.scheduledEnd).toLocaleString('es-ES') : '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Planificación');

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Planificacion_Produccion_${dateStr}.xlsx`);
};
