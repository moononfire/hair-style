"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export default function ClientEditForm({ client }: { client: Client }) {
  const router = useRouter();
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone ?? "");
  const [email, setEmail] = useState(client.email ?? "");
  const [notes, setNotes] = useState(client.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || null, email: email || null, notes: notes || null }),
    });
    router.refresh();
    setSaving(false);
    setEditing(false);
  };

  const remove = async () => {
    if (!confirm("Usunąć klienta? Ta operacja jest nieodwracalna.")) return;
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    router.push("/clients");
    router.refresh();
  };

  if (!editing) {
    return (
      <div className="space-y-2">
        <dl className="divide-y rounded-lg border text-sm">
          <Row label="Imię" value={client.name} />
          <Row label="Telefon" value={client.phone ?? "—"} />
          <Row label="Email" value={client.email ?? "—"} />
          {client.notes && <Row label="Notatki" value={client.notes} />}
        </dl>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Edytuj
          </button>
          <button
            onClick={remove}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Usuń klienta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Imię i nazwisko" value={name} onChange={setName} required />
        <Field label="Telefon" value={phone} onChange={setPhone} placeholder="np. 600100200" />
        <Field label="Email" value={email} onChange={setEmail} placeholder="—" />
        <Field label="Notatki (stałe uwagi)" value={notes} onChange={setNotes} placeholder="np. alergia na amoniak" />
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
          onClick={() => setEditing(false)}
          className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          Anuluj
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
