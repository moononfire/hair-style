"use client";

import { useState, useEffect, useRef } from "react";

type Client = { id: string; name: string; phone: string | null };

type Props = {
  value: { id?: string; name: string; phone: string } | null;
  onChange: (client: { id?: string; name: string; phone: string }) => void;
};

export default function ClientSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [phone, setPhone] = useState(value?.phone ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!q.trim()) { setResults([]); return; }
      const res = await fetch(`/api/clients?q=${encodeURIComponent(q)}`);
      const data: Client[] = await res.json();
      setResults(data);
      setOpen(true);
    }, 300);
  };

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setCreating(false);
    search(q);
    onChange({ name: q, phone });
  };

  const select = (client: Client) => {
    setQuery(client.name);
    setPhone(client.phone ?? "");
    setOpen(false);
    setCreating(false);
    onChange({ id: client.id, name: client.name, phone: client.phone ?? "" });
  };

  const startCreate = () => {
    setCreating(true);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="space-y-2">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Szukaj klienta lub wpisz nowe imię…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {open && (results.length > 0 || query.trim()) && (
          <ul className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-md">
            {results.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => select(c)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                >
                  <span className="font-medium">{c.name}</span>
                  {c.phone && <span className="text-muted-foreground">{c.phone}</span>}
                </button>
              </li>
            ))}
            {query.trim() && (
              <li>
                <button
                  type="button"
                  onClick={startCreate}
                  className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-accent"
                >
                  + Utwórz nowego: „{query}"
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {(creating || (value && !value.id)) && (
        <input
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            onChange({ name: query, phone: e.target.value });
          }}
          placeholder="Telefon (opcjonalnie)"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
    </div>
  );
}
