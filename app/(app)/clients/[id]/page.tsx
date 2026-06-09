import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ClientEditForm from "@/components/clients/ClientEditForm";
import StatusBadge from "@/components/appointments/StatusBadge";
import { formatDate, formatTime } from "@/lib/date";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { service: true, employee: true },
        orderBy: { startsAt: "desc" },
      },
    },
  });

  if (!client) notFound();

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold shrink-0">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{client.name}</h1>
          <p className="text-sm text-muted-foreground">
            {client.appointments.length} wizyt łącznie
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">Dane klienta</h2>
        <ClientEditForm client={{ id: client.id, name: client.name, phone: client.phone, email: client.email, notes: client.notes }} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Historia wizyt</h2>
          <Link
            href={`/appointments/new?clientId=${client.id}`}
            className="text-sm text-primary hover:underline"
          >
            + Nowa wizyta
          </Link>
        </div>

        {client.appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak wizyt.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {client.appointments.map((a) => (
              <Link
                key={a.id}
                href={`/appointments/${a.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors"
              >
                <div className="w-24 shrink-0 text-sm font-medium">
                  {formatDate(a.startsAt)}
                </div>
                <div className="w-12 shrink-0 text-sm text-muted-foreground">
                  {formatTime(a.startsAt)}
                </div>
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: a.employee.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.service.name}</p>
                  <p className="text-xs text-muted-foreground">{a.employee.name}</p>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
