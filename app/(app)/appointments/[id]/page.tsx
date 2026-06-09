import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/appointments/StatusBadge";
import AppointmentActions from "@/components/appointments/AppointmentActions";
import { formatDate, formatTime } from "@/lib/date";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { client: true, employee: true, service: true },
  });

  if (!appointment) notFound();

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Wizyta</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(appointment.startsAt)} o {formatTime(appointment.startsAt)}
          </p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <dl className="divide-y rounded-lg border text-sm">
        <Row label="Klient" value={appointment.client?.name ?? "—"} />
        <Row label="Telefon" value={appointment.client?.phone ?? "—"} />
        <Row label="Usługa" value={appointment.service.name} />
        <Row label="Pracownik" value={appointment.employee.name} />
        <Row
          label="Czas"
          value={`${formatTime(appointment.startsAt)} – ${formatTime(appointment.endsAt)}`}
        />
        <Row label="Źródło" value={appointment.source} />
        {appointment.notes && <Row label="Notatki" value={appointment.notes} />}
      </dl>

      <AppointmentActions appointment={{ id: appointment.id, status: appointment.status }} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
