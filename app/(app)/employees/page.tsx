import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTenantId, tf } from "@/lib/tenant-server";

export default async function EmployeesPage() {
  const tenantId = await getTenantId();
  const employees = await prisma.employee.findMany({
    where: { ...tf(tenantId) },
    orderBy: { name: "asc" },
    include: { _count: { select: { appointments: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Pracownicy</h1>
          <p className="text-sm text-muted-foreground">{employees.length} łącznie</p>
        </div>
        <Link
          href="/employees/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nowy pracownik
        </Link>
      </div>

      <div className="divide-y rounded-lg border">
        {employees.map((e) => (
          <Link
            key={e.id}
            href={`/employees/${e.id}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-accent transition-colors"
          >
            <div
              className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: e.color }}
            >
              {e.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{e.name}</p>
              <p className="text-xs text-muted-foreground">
                {e.phone ?? "Brak telefonu"}
                {" · "}
                {e._count.appointments} wizyt
              </p>
            </div>
            {!e.active && (
              <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded">
                Nieaktywny
              </span>
            )}
          </Link>
        ))}
        {employees.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            Brak pracowników. Dodaj pierwszego.
          </p>
        )}
      </div>
    </div>
  );
}
