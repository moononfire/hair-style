"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatTime } from "@/lib/date";

type TimeBlock = {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
};

export default function TimeBlockSection({
  employeeId,
  initialBlocks,
}: {
  employeeId: string;
  initialBlocks: TimeBlock[];
}) {
  const router = useRouter();
  const [blocks, setBlocks] = useState(initialBlocks);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const addBlock = async () => {
    if (!date) return;
    setSaving(true);
    const startsAt = new Date(`${date}T${startTime}`).toISOString();
    const endsAt = new Date(`${date}T${endTime}`).toISOString();
    const res = await fetch(`/api/employees/${employeeId}/time-blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startsAt, endsAt, reason: reason || null }),
    });
    if (res.ok) {
      const block = await res.json();
      setBlocks((prev) => [...prev, block].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setDate("");
      setReason("");
    }
    setSaving(false);
  };

  const removeBlock = async (id: string) => {
    if (!confirm("Usunąć blokadę?")) return;
    await fetch(`/api/time-blocks/${id}`, { method: "DELETE" });
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {blocks.length > 0 ? (
        <div className="divide-y rounded-lg border">
          {blocks.map((b) => (
            <div key={b.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {formatDate(new Date(b.startsAt))}{" "}
                  {formatTime(new Date(b.startsAt))}–{formatTime(new Date(b.endsAt))}
                </p>
                {b.reason && (
                  <p className="text-xs text-muted-foreground">{b.reason}</p>
                )}
              </div>
              <button
                onClick={() => removeBlock(b.id)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Usuń
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Brak blokad.</p>
      )}

      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Dodaj blokadę</p>
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          />
          <span className="self-center text-muted-foreground">–</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Powód (np. urlop)"
            className="rounded border px-2 py-1 text-sm flex-1 min-w-40"
          />
        </div>
        <button
          onClick={addBlock}
          disabled={saving || !date}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Dodawanie..." : "Dodaj blokadę"}
        </button>
      </div>
    </div>
  );
}
