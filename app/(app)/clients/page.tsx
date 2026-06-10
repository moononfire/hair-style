import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTenantId, tf } from "@/lib/tenant-server";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const tenantId = await getTenantId();

  const clients = await prisma.client.findMany({
    where: q
      ? {
          ...tf(tenantId),
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : { ...tf(tenantId) },
    orderBy: { name: "asc" },
    include: { _count: { select: { appointments: true } } },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Klienci</h1>
          <p className="text-sm text-muted-foreground">{clients.length} wyników</p>
        </div>
      </div>

      <form method="GET" className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Szukaj po imieniu lub numerze telefonu..."
          className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Szukaj
        </button>
        {q && (
          <Link
            href="/clients"
            className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            Wyczyść
          </Link>
        )}
      </form>

      <div className="divide-y rounded-lg border">
        {clients.map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.phone ?? "Brak telefonu"}
                {" · "}
                {c._count.appointments} wizyt
              </p>
            </div>
          </Link>
        ))}
        {clients.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            {q ? `Brak klientów dla "${q}".` : "Brak klientów w bazie."}
          </p>
        )}
      </div>
    </div>
  );
}
