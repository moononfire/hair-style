"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ClientSearch from "./ClientSearch";
import { useToast } from "@/lib/toast";

type Employee = { id: string; name: string; color: string };
type Service = { id: string; name: string; durationMin: number; color: string | null };

type Props = {
  employees: Employee[];
  services: Service[];
  defaults?: {
    employeeId?: string;
    startsAt?: string; // ISO
    serviceId?: string;
  };
};

type ClientValue = { id?: string; name: string; phone: string };

export default function AppointmentForm({ employees, services, defaults }: Props) {
  const router = useRouter();

  const [employeeId, setEmployeeId] = useState(defaults?.employeeId ?? "");
  const [serviceId, setServiceId] = useState(defaults?.serviceId ?? "");
  const [date, setDate] = useState(
    defaults?.startsAt ? defaults.startsAt.slice(0, 10) : ""
  );
  const [startTime, setStartTime] = useState(
    defaults?.startsAt ? defaults.startsAt.slice(11, 16) : ""
  );
  const defaultService = services.find((s) => s.id === (defaults?.serviceId ?? ""));
  const [durationMin, setDurationMin] = useState(defaultService?.durationMin ?? 60);
  const [client, setClient] = useState<ClientValue | null>(null);
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState<"counter" | "phone" | "walk_in">("counter");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const toast = useToast();

  const selectedService = services.find((s) => s.id === serviceId);

  const handleServiceChange = (id: string) => {
    setServiceId(id);
    const svc = services.find((s) => s.id === id);
    if (svc) setDurationMin(svc.durationMin);
  };

  const computeEndsAt = (): Date | null => {
    if (!date || !startTime) return null;
    const starts = new Date(`${date}T${startTime}:00`);
    return new Date(starts.getTime() + durationMin * 60_000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const startsAt = date && startTime ? new Date(`${date}T${startTime}:00`) : null;
    const endsAt = computeEndsAt();

    if (!employeeId || !serviceId || !startsAt || !endsAt) {
      setError("Wypełnij wszystkie wymagane pola.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          serviceId,
          clientId: client?.id,
          clientName: client?.name || undefined,
          clientPhone: client?.phone || undefined,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          notes: notes || undefined,
          source,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = data.error ?? "Wystąpił błąd.";
        setError(msg);
        toast(msg, "error");
        return;
      }

      toast("Wizyta zapisana", "success");
      router.push("/calendar");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Usługa */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Usługa *</label>
        <select
          value={serviceId}
          onChange={(e) => handleServiceChange(e.target.value)}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">— wybierz usługę —</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.durationMin} min)
            </option>
          ))}
        </select>
      </div>

      {/* Pracownik */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Pracownik *</label>
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">— wybierz pracownika —</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>

      {/* Data i godzina */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Data *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Godzina *</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Czas trwania */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Czas trwania (min)
          {selectedService && (
            <span className="ml-1 text-xs text-muted-foreground">
              — domyślnie {selectedService.durationMin} min
            </span>
          )}
        </label>
        <input
          type="number"
          min={5}
          step={5}
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {date && startTime && (
          <p className="text-xs text-muted-foreground">
            Koniec: {computeEndsAt()?.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {/* Klient */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Klient</label>
        <ClientSearch value={client} onChange={setClient} />
      </div>

      {/* Notatki */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Notatki</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Np. kolor z poprzedniej wizyty…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      {/* Źródło */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Źródło</label>
        <div className="flex gap-4">
          {(["counter", "phone", "walk_in"] as const).map((s) => (
            <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                name="source"
                value={s}
                checked={source === s}
                onChange={() => setSource(s)}
              />
              {s === "counter" ? "Lada" : s === "phone" ? "Telefon" : "Walk-in"}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Zapisywanie…" : "Zapisz wizytę"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border px-5 py-2 text-sm font-medium hover:bg-accent"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
