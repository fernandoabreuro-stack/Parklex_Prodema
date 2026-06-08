export const isWorkingTime = (ts: number): boolean => {
  const d = new Date(ts);
  const day = d.getDay(); // 0 Sun, 1 Mon, ..., 6 Sat
  const totalMinutes = d.getHours() * 60 + d.getMinutes();
  
  if (day === 0) return false; // Sunday - always OFF
  if (day === 1 && totalMinutes < 6 * 60) return false; // Monday before 6am - OFF
  if (day === 6 && totalMinutes >= 6 * 60) return false; // Saturday after 6am - OFF
  return true;
};

export const getNextWorkingTime = (ts: number): number => {
  if (isWorkingTime(ts)) return ts;

  const d = new Date(ts);
  const day = d.getDay(); // 0 Sun, 1 Mon, ..., 6 Sat
  const hour = d.getHours();

  // If Sunday (0), move to next Monday 6am
  // If Saturday (6) and >= 6am, move to next Monday 6am
  // If Monday (1) and < 6am, move to today 6am
  
  let daysToAdd = (1 - day + 7) % 7;
  if (daysToAdd === 0 && (day !== 1 || hour >= 6)) {
      daysToAdd = 7;
  }
  
  const nextMonday = new Date(ts);
  nextMonday.setDate(nextMonday.getDate() + daysToAdd);
  nextMonday.setHours(6, 0, 0, 0);
  nextMonday.setMinutes(0, 0, 0);
  return nextMonday.getTime();
};

export const getWorkingSegments = (start: number, end: number): { start: number; end: number }[] => {
  const segments: { start: number; end: number }[] = [];
  let cur = start;
  while (cur < end) {
    if (isWorkingTime(cur)) {
      const d = new Date(cur);
      const day = d.getDay();
      const nextSat6 = new Date(cur);
      const daysToSat = (6 - day + 7) % 7;
      
      if (daysToSat === 0 && d.getHours() < 6) {
        nextSat6.setHours(6, 0, 0, 0);
      } else {
        nextSat6.setDate(nextSat6.getDate() + (daysToSat === 0 ? 7 : daysToSat));
        nextSat6.setHours(6, 0, 0, 0);
      }
      nextSat6.setMinutes(0, 0, 0);
      
      const segEnd = Math.min(end, nextSat6.getTime());
      segments.push({ start: cur, end: segEnd });
      cur = segEnd;
    } else {
      cur = getNextWorkingTime(cur);
    }
  }
  return segments;
};
