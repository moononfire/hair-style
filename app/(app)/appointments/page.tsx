import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/appointments/StatusBadge";
import { formatDate, formatTime } from "@/lib/date";

export default async function AppointmentsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const appointments = await prisma.appointment.findMany({
    where: {
      startsAt: { gte: today, lt: weekEnd },
      status: { not: "cancelled" },
    },
    include: { client: true, employee: true, service: true },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Wizyty</h1>
          <p className="text-sm text-muted-foreground">Najbliższe 7 dni</p>
        </div>
        <Link
          href="/appointments/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nowa wizyta
        </Link>
      </div>

      {appointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak wizyt w tym tygodniu.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {appointments.map((a) => (
            <Link
              key={a.id}
              href={`/appointments/${a.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors"
            >
              <div className="w-24 shrink-0 text-sm font-medium">
                {formatDate(a.startsAt)}
              </div>
              <div className="w-16 shrink-0 text-sm text-muted-foreground">
                {formatTime(a.startsAt)}
              </div>
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: a.employee.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {a.client?.name ?? <span className="text-muted-foreground italic">Bez klienta</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {a.service.name} · {a.employee.name}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
