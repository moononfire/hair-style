import { prisma } from "@/lib/prisma";
import AvailabilitySearch from "@/components/availability/AvailabilitySearch";

export default async function AvailabilityPage() {
  const [employees, services] = await Promise.all([
    prisma.employee.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Wolne terminy</h1>
        <p className="text-sm text-muted-foreground">
          Znajdź najbliższy wolny termin — idealne przy rozmowie telefonicznej.
        </p>
      </div>
      <AvailabilitySearch
        employees={employees.map((e) => ({ id: e.id, name: e.name, color: e.color }))}
        services={services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin }))}
      />
    </div>
  );
}
