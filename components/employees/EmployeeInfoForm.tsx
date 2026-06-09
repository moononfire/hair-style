"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  employee: {
    id: string;
    name: string;
    color: string;
    phone: string | null;
    active: boolean;
  };
};

export default function EmployeeInfoForm({ employee }: Props) {
  const router = useRouter();
  const [name, setName] = useState(employee.name);
  const [color, setColor] = useState(employee.color);
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color, phone: phone || null }),
    });
    router.refresh();
    setSaving(false);
  };

  const toggleActive = async () => {
    if (!confirm(employee.active ? "Dezaktywować pracownika?" : "Aktywować pracownika?")) return;
    await fetch(`/api/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !employee.active }),
    });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Imię i nazwisko</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Zapisywanie..." : "Zapisz zmiany"}
        </button>
        <button
          onClick={toggleActive}
          className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          {employee.active ? "Dezaktywuj" : "Aktywuj"}
        </button>
      </div>
    </div>
  );
}
