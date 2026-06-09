"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/lib/toast";

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

const STATUS_TOAST: Record<string, string> = {
  confirmed: "Wizyta potwierdzona",
  arrived:   "Klient przybył",
  no_show:   "Oznaczono jako nieobecność",
};

export default function AppointmentActions({
  appointment,
}: {
  appointment: { id: string; status: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  const nextStatus = NEXT_STATUS[appointment.status];

  const updateStatus = async (status: string) => {
    setPending(true);
    const res = await fetch(`/api/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPending(false);
    if (res.ok) {
      toast(STATUS_TOAST[status] ?? "Status zaktualizowany", "success");
      router.refresh();
    } else {
      toast("Nie udało się zmienić statusu", "error");
    }
  };

  const cancel = async () => {
    if (!confirm("Anulować wizytę?")) return;
    setPending(true);
    const res = await fetch(`/api/appointments/${appointment.id}`, {
      method: "DELETE",
    });
    setPending(false);
    if (res.ok) {
      toast("Wizyta anulowana", "info");
      router.push("/appointments");
      router.refresh();
    } else {
      toast("Nie udało się anulować wizyty", "error");
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {nextStatus && (
        <button
          onClick={() => updateStatus(nextStatus)}
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {NEXT_LABEL[nextStatus] ?? nextStatus}
        </button>
      )}
      {appointment.status === "confirmed" && (
        <button
          onClick={() => updateStatus("no_show")}
          disabled={pending}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          Nieobecność
        </button>
      )}
      {!["arrived", "no_show", "cancelled"].includes(appointment.status) && (
        <button
          onClick={cancel}
          disabled={pending}
          className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
        >
          Anuluj wizytę
        </button>
      )}
    </div>
  );
}
