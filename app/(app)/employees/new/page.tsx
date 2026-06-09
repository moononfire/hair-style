"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewEmployeePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name) { setError("Imię jest wymagane"); return; }
    setSaving(true);
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color, phone: phone || null }),
    });
    if (res.ok) {
      const emp = await res.json();
      router.push(`/employees/${emp.id}`);
    } else {
      const json = await res.json();
      setError(json.error ?? "Błąd zapisu");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-xl font-semibold">Nowy pracownik</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Imię i nazwisko *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="np. Anna Kowalska"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Telefon</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="np. 500100200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Kolor w kalendarzu</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 cursor-pointer rounded border"
            />
            <span className="text-sm text-muted-foreground">{color}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Tworzenie..." : "Utwórz pracownika"}
        </button>
        <button
          onClick={() => router.back()}
          className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          Anuluj
        </button>
      </div>
    </div>
  );
}
