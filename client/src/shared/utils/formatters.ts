export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(num);
};

export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export const calculateDaysRemaining = (dueDateStr?: string | null): number => {
  if (!dueDateStr) return 0;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cleanStr = dueDateStr.includes('T') ? dueDateStr.split('T')[0] : dueDateStr;
    const [y, m, d] = cleanStr.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

export const getDayName = (dayNumber: number): string => {
  const days: Record<number, string> = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo'
  };
  return days[dayNumber] || `Día ${dayNumber}`;
};

export const formatDaysList = (daysJsonOrArray?: number[] | string | null): string => {
  if (!daysJsonOrArray) return 'Sin días asignados';
  let days: number[] = [];
  try {
    days = typeof daysJsonOrArray === 'string' ? JSON.parse(daysJsonOrArray) : daysJsonOrArray;
  } catch {
    return 'L a V';
  }
  if (!Array.isArray(days) || days.length === 0) return 'Sin asignar';
  if (days.length === 5 && [1, 2, 3, 4, 5].every(d => days.includes(d))) return 'Lunes a Viernes';
  if (days.length === 3 && [1, 3, 5].every(d => days.includes(d))) return 'Lun / Mié / Vie';
  if (days.length === 2 && [2, 4].every(d => days.includes(d))) return 'Mar / Jue';
  return days.map(d => getDayName(d).slice(0, 3)).join(' • ');
};
