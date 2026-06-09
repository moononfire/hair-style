import { prisma } from "@/lib/prisma";
import type { Employee } from "@prisma/client";

export type AvailableSlot = {
  employee: Employee;
  date: string;       // "2026-06-09"
  startTime: string;  // "14:00"
  endTime: string;    // "15:00"
  startsAt: Date;
  endsAt: Date;
};

export async function findAvailableSlots(params: {
  durationMin: number;
  dateFrom: Date;
  dateTo: Date;
  tenantId: string | null;
  employeeId?: string;
  limit?: number;
}): Promise<AvailableSlot[]> {
  const { durationMin, dateFrom, dateTo, tenantId, employeeId, limit = 20 } = params;
  const tFilter = tenantId ? { tenantId } : {};

  const employees = await prisma.employee.findMany({
    where: {
      ...tFilter,
      active: true,
      ...(employeeId ? { id: employeeId } : {}),
    },
    include: { hours: true },
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      ...tFilter,
      startsAt: { gte: dateFrom },
      endsAt: { lte: addDays(dateTo, 1) },
      status: { not: "cancelled" },
      ...(employeeId ? { employeeId } : {}),
    },
    orderBy: { startsAt: "asc" },
  });

  const timeBlocks = await prisma.timeBlock.findMany({
    where: {
      ...tFilter,
      startsAt: { gte: dateFrom },
      endsAt: { lte: addDays(dateTo, 1) },
      ...(employeeId ? { employeeId } : {}),
    },
    orderBy: { startsAt: "asc" },
  });

  const slots: AvailableSlot[] = [];
  const durationMs = durationMin * 60 * 1000;

  for (const employee of employees) {
    let current = new Date(dateFrom);
    current.setHours(0, 0, 0, 0);

    while (current <= dateTo && slots.length < limit) {
      const dow = current.getDay();
      const workHours = employee.hours.find((h) => h.dayOfWeek === dow);
      if (!workHours) {
        current = addDays(current, 1);
        continue;
      }

      const [sh, sm] = workHours.startTime.split(":").map(Number);
      const [eh, em] = workHours.endTime.split(":").map(Number);

      const dayStart = new Date(current);
      dayStart.setHours(sh, sm, 0, 0);

      const dayEnd = new Date(current);
      dayEnd.setHours(eh, em, 0, 0);

      // zbierz zajęte przedziały tego dnia dla tego pracownika
      const busy: { start: Date; end: Date }[] = [
        ...appointments
          .filter((a) => a.employeeId === employee.id && sameDay(a.startsAt, current))
          .map((a) => ({ start: a.startsAt, end: a.endsAt })),
        ...timeBlocks
          .filter((b) => b.employeeId === employee.id && sameDay(b.startsAt, current))
          .map((b) => ({ start: b.startsAt, end: b.endsAt })),
      ].sort((a, b) => a.start.getTime() - b.start.getTime());

      // szukaj luk
      let cursor = dayStart;
      for (const block of busy) {
        if (cursor.getTime() + durationMs <= block.start.getTime()) {
          slots.push(makeSlot(employee, cursor, new Date(cursor.getTime() + durationMs)));
          if (slots.length >= limit) break;
        }
        if (block.end > cursor) cursor = block.end;
      }

      // luka po ostatnim bloku
      if (slots.length < limit && cursor.getTime() + durationMs <= dayEnd.getTime()) {
        slots.push(makeSlot(employee, cursor, new Date(cursor.getTime() + durationMs)));
      }

      current = addDays(current, 1);
    }

    if (slots.length >= limit) break;
  }

  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

function makeSlot(employee: Employee, startsAt: Date, endsAt: Date): AvailableSlot {
  return {
    employee,
    date: startsAt.toISOString().slice(0, 10),
    startTime: fmt(startsAt),
    endTime: fmt(endsAt),
    startsAt,
    endsAt,
  };
}

function fmt(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
