"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate, formatTime } from "@/lib/date";
import StatusBadge from "@/components/appointments/StatusBadge";
import type { AppointmentSerialized } from "./CalendarView";

const NEXT_STATUS: Record<string, string | null> = {
  pending:     "confirmed",
  confirmed:   "arrived",
  arrived:     "in_progress",
  in_progress: "completed",
  completed:   null,
  no_show:     null,
  cancelled:   null,
};

const NEXT_LABEL: Record<string, string> = {
  confirmed:   "Potwierdź",
  arrived:     "Przybyła",
  in_progress: "Rozpocznij",
  completed:   "Zakończ",
};

const SOURCE_LABEL: Record<string, string> = {
  counter: "Lada",
  phone:   "Telefon",
  walk_in: "Walk-in",
};

type Props = {
  appointment: AppointmentSerialized;
  onClose: () => void;
};

export default function AppointmentPanel({ appointment, onClose }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const nextStatus = NEXT_STATUS[appointment.status];
  const starts = new Date(appointment.startsAt);
  const ends = new Date(appointment.endsAt);

  const updateStatus = async (status: string) => {
    setPending(true);
    await fetch(`/api/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
    setPending(false);
  };

  const cancelAppointment = async () => {
    if (!confirm("Anulować wizytę?")) return;
    setPending(true);
    await fetch(`/api/appointments/${appointment.id}`, { method: "DELETE" });
    router.refresh();
    onClose();
    setPending(false);
  };

  return (
    <div className="flex w-72 flex-shrink-0 flex-col gap-4 rounded-lg border bg-card p-4 overflow-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{appointment.clientName ?? "Bez klienta"}</p>
          {appointment.clientPhone && (
            <p className="text-sm text-muted-foreground">{appointment.clientPhone}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="Zamknij"
        >
          ✕
        </button>
      </div>

      <StatusBadge status={appointment.status} />

      {/* Details */}
      <dl className="divide-y rounded-md border text-sm">
        <Row label="Usługa" value={appointment.serviceName} />
        <Row label="Pracownik" value={appointment.employeeName} />
        <Row label="Data" value={formatDate(starts)} />
        <Row label="Godzina" value={`${formatTime(starts)} – ${formatTime(ends)}`} />
        <Row label="Źródło" value={SOURCE_LABEL[appointment.source] ?? appointment.source} />
        {appointment.notes && <Row label="Notatki" value={appointment.notes} />}
      </dl>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {nextStatus && (
          <button
            onClick={() => updateStatus(nextStatus)}
            disabled={pending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {NEXT_LABEL[nextStatus] ?? nextStatus}
          </button>
        )}
        {appointment.status === "in_progress" && (
          <button
            onClick={() => updateStatus("no_show")}
            disabled={pending}
            className="rounded-md border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            Nieobecność
          </button>
        )}
        {!["completed", "no_show", "cancelled"].includes(appointment.status) && (
          <button
            onClick={cancelAppointment}
            disabled={pending}
            className="rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            Anuluj
          </button>
        )}
      </div>

      <Link
        href={`/appointments/${appointment.id}`}
        className="text-center text-sm text-primary hover:underline"
      >
        Edytuj wizytę →
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 px-3 py-2">
      <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
