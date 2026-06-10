import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "@/lib/date";
import { getTenantId, tf } from "@/lib/tenant-server";
import CalendarView from "@/components/calendar/CalendarView";
import type { AppointmentSerialized, EmployeeSerialized } from "@/components/calendar/CalendarView";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const { date, view } = await searchParams;
  const calView = view === "week" ? "week" : "day";

  const currentDate = date ? new Date(date + "T12:00:00") : new Date();
  const dateStr = currentDate.toISOString().slice(0, 10);

  const from = calView === "week" ? startOfWeek(currentDate) : startOfDay(currentDate);
  const to = calView === "week" ? endOfWeek(currentDate) : endOfDay(currentDate);

  const tenantId = await getTenantId();

  const [employees, appointments] = await Promise.all([
    prisma.employee.findMany({
      where: { ...tf(tenantId), active: true },
      orderBy: { name: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        ...tf(tenantId),
        startsAt: { gte: from },
        endsAt: { lte: to },
        status: { not: "cancelled" },
      },
      include: { client: true, employee: true, service: true },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const serializedEmployees: EmployeeSerialized[] = employees.map((e) => ({
    id: e.id,
    name: e.name,
    color: e.color,
  }));

  const serializedAppointments: AppointmentSerialized[] = appointments.map((a) => ({
    id: a.id,
    clientName: a.client?.name ?? null,
    clientPhone: a.client?.phone ?? null,
    employeeId: a.employeeId,
    employeeName: a.employee.name,
    employeeColor: a.employee.color,
    serviceName: a.service.name,
    serviceColor: a.service.color ?? null,
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt.toISOString(),
    status: a.status,
    notes: a.notes ?? null,
    source: a.source,
  }));

  return (
    <CalendarView
      employees={serializedEmployees}
      appointments={serializedAppointments}
      initialDate={dateStr}
      initialView={calView}
    />
  );
}
