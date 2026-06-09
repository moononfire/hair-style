"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "./StatusBadge";
import { formatTime } from "@/lib/date";

type AppointmentWithRelations = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  notes: string | null;
  service: { name: string; durationMin: number };
  client: { name: string; phone: string | null } | null;
  employee: { name: string; color: string };
};

const NEXT_STATUS: Record<string, string | null> = {
  pending:   "confirmed",
  confirmed: "arrived",
  arrived:   null,
  no_show:   null,
  cancelled: null,
};

const NEXT_LABEL: Record<string, string> = {
  confirmed: "Potwierdź",
  arrived:   "Przybyła",
};

export default function TodayCard({ appointment }: { appointment: AppointmentWithRelations }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(appointment.status);

  const updateStatus = (newStatus: string) => {
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    });
  };

  const nextStatus = NEXT_STATUS[optimisticStatus];
  const isTerminal = ["arrived", "no_show", "cancelled"].includes(optimisticStatus);

  return (
    <div
      className={`rounded-lg border bg-card px-4 py-3 transition-opacity ${isPending ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 text-center">
          <p className="text-sm font-semibold tabular-nums">{formatTime(appointment.startsAt)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{formatTime(appointment.endsAt)}</p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium truncate">
              {appointment.client?.name ?? <span className="italic text-muted-foreground">Bez klienta</span>}
            </p>
            {appointment.client?.phone && (
              <span className="text-xs text-muted-foreground">{appointment.client.phone}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {appointment.service.name} · {appointment.service.durationMin} min
          </p>
          {appointment.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 italic truncate">{appointment.notes}</p>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <StatusBadge status={optimisticStatus} />
          <Link
            href={`/appointments/${appointment.id}`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            szczegóły →
          </Link>
        </div>
      </div>

      {!isTerminal && (
        <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
          {nextStatus && (
            <button
              onClick={() => updateStatus(nextStatus)}
              disabled={isPending}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {NEXT_LABEL[nextStatus] ?? nextStatus}
            </button>
          )}
          {optimisticStatus === "confirmed" && (
            <button
              onClick={() => updateStatus("no_show")}
              disabled={isPending}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Nieobecność
            </button>
          )}
          <button
            onClick={() => {
              if (confirm("Anulować wizytę?")) updateStatus("cancelled");
            }}
            disabled={isPending}
            className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            Anuluj
          </button>
        </div>
      )}
    </div>
  );
}
