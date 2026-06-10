import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, formatDate } from "@/lib/date";
import { getTenantId, tf } from "@/lib/tenant-server";
import TodayCard from "@/components/appointments/TodayCard";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const tenantId = await getTenantId();

  const appointments = await prisma.appointment.findMany({
    where: {
      ...tf(tenantId),
      startsAt: { gte: dayStart, lte: dayEnd },
      status: { not: "cancelled" },
    },
    include: { client: true, employee: true, service: true },
    orderBy: { startsAt: "asc" },
  });

  // Group by employee
  const byEmployee = new Map<
    string,
    { employee: { id: string; name: string; color: string }; appointments: typeof appointments }
  >();

  for (const a of appointments) {
    if (!byEmployee.has(a.employeeId)) {
      byEmployee.set(a.employeeId, { employee: a.employee, appointments: [] });
    }
    byEmployee.get(a.employeeId)!.appointments.push(a);
  }

  const completed = appointments.filter((a) =>
    ["completed", "no_show"].includes(a.status)
  ).length;

  const active = appointments.filter((a) =>
    ["in_progress", "arrived"].includes(a.status)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dzisiaj</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {formatDate(now)}
          </p>
        </div>
        <Link
          href="/appointments/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nowa wizyta
        </Link>
      </div>

      {appointments.length > 0 && (
        <div className="flex gap-4">
          <StatChip label="Wszystkich" value={appointments.length} />
          <StatChip label="W trakcie / czekają" value={active} color="orange" />
          <StatChip label="Zakończonych" value={completed} color="green" />
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">Brak wizyt na dziś.</p>
          <Link
            href="/appointments/new"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Dodaj pierwszą wizytę
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {[...byEmployee.values()].map(({ employee, appointments: appts }) => (
            <section key={employee.id}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: employee.color }}
                />
                <h2 className="text-sm font-semibold">{employee.name}</h2>
                <span className="text-xs text-muted-foreground">
                  {appts.length} {appts.length === 1 ? "wizyta" : "wizyty"}
                </span>
              </div>
              <div className="space-y-2">
                {appts.map((a) => (
                  <TodayCard
                    key={a.id}
                    appointment={{
                      id: a.id,
                      startsAt: a.startsAt,
                      endsAt: a.endsAt,
                      status: a.status,
                      notes: a.notes,
                      service: { name: a.service.name, durationMin: a.service.durationMin },
                      client: a.client ? { name: a.client.name, phone: a.client.phone } : null,
                      employee: { name: a.employee.name, color: a.employee.color },
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: "green" | "orange";
}) {
  const colorClass =
    color === "green"
      ? "bg-green-50 text-green-700"
      : color === "orange"
      ? "bg-orange-50 text-orange-700"
      : "bg-muted text-muted-foreground";

  return (
    <div className={`rounded-lg px-3 py-2 text-center ${colorClass}`}>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}
