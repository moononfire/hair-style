"use client";

import { useState } from "react";
import Link from "next/link";

type Employee = { id: string; name: string; color: string };
type Service = { id: string; name: string; durationMin: number };

type Slot = {
  employeeId: string;
  employeeName: string;
  employeeColor: string;
  date: string;
  startTime: string;
  endTime: string;
  startsAt: string;
  endsAt: string;
};

const DAY_LABELS = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = DAY_LABELS[d.getDay()];
  return `${day}, ${d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}`;
}

export default function AvailabilitySearch({
  employees,
  services,
}: {
  employees: Employee[];
  services: Service[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const in14days = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10);

  const [serviceId, setServiceId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(in14days);
  const [durationMin, setDurationMin] = useState(60);

  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedService = services.find((s) => s.id === serviceId);

  const handleServiceChange = (id: string) => {
    setServiceId(id);
    const svc = services.find((s) => s.id === id);
    if (svc) setDurationMin(svc.durationMin);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSlots(null);
    setLoading(true);

    try {
      const params = new URLSearchParams({
        durationMin: String(durationMin),
        dateFrom,
        dateTo,
        limit: "30",
      });
      if (employeeId) params.set("employeeId", employeeId);

      const res = await fetch(`/api/availability?${params}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Błąd serwera");
        return;
      }
      const data: Slot[] = await res.json();
      setSlots(data);
    } catch {
      setError("Nie udało się pobrać terminów.");
    } finally {
      setLoading(false);
    }
  };

  const bookUrl = (slot: Slot) => {
    const params = new URLSearchParams({
      employeeId: slot.employeeId,
      startsAt: slot.startsAt,
    });
    if (serviceId) params.set("serviceId", serviceId);
    return `/appointments/new?${params}`;
  };

  const grouped = slots
    ? slots.reduce<Record<string, Slot[]>>((acc, s) => {
        (acc[s.date] ??= []).push(s);
        return acc;
      }, {})
    : null;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4 max-w-xl">
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Czas trwania (min)
              {selectedService && (
                <span className="ml-1 text-xs text-muted-foreground">
                  — domyślnie {selectedService.durationMin}
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
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Pracownik</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">— dowolny —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Od *</label>
            <input
              type="date"
              value={dateFrom}
              min={today}
              onChange={(e) => setDateFrom(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Do *</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Szukam…" : "Znajdź wolne terminy"}
        </button>
      </form>

      {slots !== null && (
        <div className="space-y-4">
          {Object.keys(grouped!).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Brak wolnych terminów w wybranym zakresie.
            </p>
          ) : (
            Object.entries(grouped!).map(([date, daySlots]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  {formatDate(date)}
                </h3>
                <div className="space-y-2">
                  {daySlots.map((slot, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md border px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ background: slot.employeeColor }}
                        />
                        <div>
                          <span className="text-sm font-medium">
                            {slot.startTime} – {slot.endTime}
                          </span>
                          <span className="ml-2 text-sm text-muted-foreground">
                            {slot.employeeName}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={bookUrl(slot)}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Zarezerwuj
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
