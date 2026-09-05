export function naira(value) {
  return '₦' + Number(value || 0).toLocaleString('en-NG');
}

export function minutesLabel(mins) {
  const m = Math.round(Number(mins) || 0);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function clockTime(date) {
  return new Date(date).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

export const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-800',
  preparing: 'bg-blue-100 text-blue-800',
  served: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-sand text-muted',
  cancelled: 'bg-red-100 text-red-700',
};
