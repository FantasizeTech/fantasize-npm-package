export const now = () => new Date();
export const toUnix = (d: Date | number) =>
  d instanceof Date ? Math.floor(d.getTime() / 1000) : Math.floor(d / 1000);
export const fromUnix = (s: number) => new Date(s * 1000);
export const parseISO = (iso: string) => new Date(iso);
export const formatISO = (d: Date) => d.toISOString();
export const addDays = (d: Date, days: number) =>
  new Date(d.getTime() + days * 86400000);
export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const endOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
export const diffInDays = (a: Date, b: Date) =>
  Math.round((a.getTime() - b.getTime()) / 86400000);
export const isBefore = (a: Date, b: Date) => a.getTime() < b.getTime();
export const isAfter = (a: Date, b: Date) => a.getTime() > b.getTime();
export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
export function relativeTime(target: Date, base: Date = new Date()): string {
  const diffMs = target.getTime() - base.getTime();
  const abs = Math.abs(diffMs);
  const units: [number, string][] = [
    [60000, 'minute'],
    [3600000, 'hour'],
    [86400000, 'day'],
    [604800000, 'week'],
    [2592000000, 'month'],
    [31536000000, 'year'],
  ];
  if (abs < 10000) return 'just now';
  for (let i = 0; i < units.length; i++) {
    const [limit, label] = units[i];
    if (abs < limit) {
      const prev = units[i - 1];
      const baseUnit = prev ? prev[0] : 1000;
      const value = Math.floor(abs / baseUnit);
      const plural = value === 1 ? label : label + 's';
      return diffMs < 0 ? `${value} ${plural} ago` : `in ${value} ${plural}`;
    }
  }
  const years = Math.floor(abs / 31536000000);
  return diffMs < 0
    ? `${years} year${years === 1 ? '' : 's'} ago`
    : `in ${years} year${years === 1 ? '' : 's'}`;
}
