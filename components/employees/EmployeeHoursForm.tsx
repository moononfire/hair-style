"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
];

type HourEntry = { dayOfWeek: number; startTime: string; endTime: string };

type DayState = { enabled: boolean; startTime: string; endTime: string };

export default function EmployeeHoursForm({
  employeeId,
  initialHours,
}: {
  employeeId: string;
  initialHours: HourEntry[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [schedule, setSchedule] = useState<DayState[]>(
    Array.from({ length: 7 }, (_, i) => {
      const existing = initialHours.find((h) => h.dayOfWeek === i);
      return existing
        ? { enabled: true, startTime: existing.startTime, endTime: existing.endTime }
        : { enabled: false, startTime: "09:00", endTime: "18:00" };
    }),
  );

  const update = (i: number, patch: Partial<DayState>) =>
    setSchedule((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const save = async () => {
    setSaving(true);
    const payload = schedule.map((s, i) =>
      s.enabled ? { dayOfWeek: i, startTime: s.startTime, endTime: s.endTime } : null,
    );
    await fetch(`/api/employees/${employeeId}/hours`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    router.refresh();
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      {DAYS.map((day, i) => {
        const s = schedule[i];
        return (
          <div key={i} className="flex flex-wrap items-center gap-3">
            <input
              id={`day-${i}`}
              type="checkbox"
              checked={s.enabled}
              onChange={(e) => update(i, { enabled: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            <label htmlFor={`day-${i}`} className="w-28 text-sm select-none">
              {day}
            </label>
            {s.enabled ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={s.startTime}
                  onChange={(e) => update(i, { startTime: e.target.value })}
                  className="rounded border px-2 py-1 text-sm"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="time"
                  value={s.endTime}
                  onChange={(e) => update(i, { endTime: e.target.value })}
                  className="rounded border px-2 py-1 text-sm"
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Wolne</span>
            )}
          </div>
        );
      })}
      <button
        onClick={save}
        disabled={saving}
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Zapisywanie..." : "Zapisz godziny"}
      </button>
    </div>
  );
}
