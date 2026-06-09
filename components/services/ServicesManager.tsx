"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  name: string;
  durationMin: number;
  color: string | null;
  pricePln: string | null;
  active: boolean;
};

type EditState = {
  name: string;
  durationMin: number;
  color: string;
  pricePln: string;
};

function ServiceRow({ service, onSave, onToggle }: {
  service: Service;
  onSave: (id: string, data: EditState) => Promise<void>;
  onToggle: (id: string, active: boolean) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditState>({
    name: service.name,
    durationMin: service.durationMin,
    color: service.color ?? "#6366f1",
    pricePln: service.pricePln ?? "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(service.id, form);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="px-4 py-3 space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 space-y-1">
            <label className="text-xs text-muted-foreground">Nazwa</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded border px-2 py-1 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Czas (min)</label>
            <input
              type="number"
              value={form.durationMin}
              onChange={(e) => setForm((f) => ({ ...f, durationMin: Number(e.target.value) }))}
              className="w-full rounded border px-2 py-1 text-sm"
              min={5}
              step={5}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Cena (PLN)</label>
            <input
              value={form.pricePln}
              onChange={(e) => setForm((f) => ({ ...f, pricePln: e.target.value }))}
              className="w-full rounded border px-2 py-1 text-sm"
              placeholder="—"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            className="h-8 w-12 cursor-pointer rounded border"
          />
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Zapisywanie..." : "Zapisz"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
          >
            Anuluj
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div
        className="h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: service.color ?? "#94a3b8" }}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${!service.active ? "line-through text-muted-foreground" : ""}`}>
          {service.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {service.durationMin} min
          {service.pricePln ? ` · ${service.pricePln} PLN` : ""}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-sm text-primary hover:underline"
        >
          Edytuj
        </button>
        <button
          onClick={() => onToggle(service.id, !service.active)}
          className="text-sm text-muted-foreground hover:underline"
        >
          {service.active ? "Dezaktywuj" : "Aktywuj"}
        </button>
      </div>
    </div>
  );
}

export default function ServicesManager({ initialServices }: { initialServices: Service[] }) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [newForm, setNewForm] = useState<EditState>({
    name: "",
    durationMin: 60,
    color: "#6366f1",
    pricePln: "",
  });
  const [saving, setSaving] = useState(false);

  const saveExisting = async (id: string, data: EditState) => {
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        pricePln: data.pricePln || null,
        color: data.color || null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  };

  const createService = async () => {
    if (!newForm.name || !newForm.durationMin) return;
    setSaving(true);
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newForm,
        pricePln: newForm.pricePln || null,
        color: newForm.color || null,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setServices((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewForm({ name: "", durationMin: 60, color: "#6366f1", pricePln: "" });
      setShowForm(false);
      router.refresh();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="divide-y rounded-lg border">
        {services.map((s) => (
          <ServiceRow key={s.id} service={s} onSave={saveExisting} onToggle={toggleActive} />
        ))}
        {services.length === 0 && (
          <p className="px-4 py-3 text-sm text-muted-foreground">Brak usług.</p>
        )}
      </div>

      {showForm ? (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">Nowa usługa</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-muted-foreground">Nazwa</label>
              <input
                value={newForm.name}
                onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded border px-2 py-1 text-sm"
                placeholder="np. Strzyżenie damskie"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Czas (min)</label>
              <input
                type="number"
                value={newForm.durationMin}
                onChange={(e) => setNewForm((f) => ({ ...f, durationMin: Number(e.target.value) }))}
                className="w-full rounded border px-2 py-1 text-sm"
                min={5}
                step={5}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Cena (PLN)</label>
              <input
                value={newForm.pricePln}
                onChange={(e) => setNewForm((f) => ({ ...f, pricePln: e.target.value }))}
                className="w-full rounded border px-2 py-1 text-sm"
                placeholder="—"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={newForm.color}
              onChange={(e) => setNewForm((f) => ({ ...f, color: e.target.value }))}
              className="h-8 w-12 cursor-pointer rounded border"
            />
            <button
              onClick={createService}
              disabled={saving || !newForm.name}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Dodawanie..." : "Dodaj usługę"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
            >
              Anuluj
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nowa usługa
        </button>
      )}
    </div>
  );
}
