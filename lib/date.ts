export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const diff = day === 0 ? -6 : 1 - day; // poniedziałek = start tygodnia
  r.setDate(r.getDate() + diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  const r = new Date(start);
  r.setDate(r.getDate() + 6);
  r.setHours(23, 59, 59, 999);
  return r;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

export function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatDayName(d: Date): string {
  return d.toLocaleDateString("pl-PL", { weekday: "short" });
}

export function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function combineDateAndTime(date: Date, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const r = new Date(date);
  r.setHours(h, m, 0, 0);
  return r;
}
