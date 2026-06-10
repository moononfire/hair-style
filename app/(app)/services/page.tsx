import { prisma } from "@/lib/prisma";
import { getTenantId, tf } from "@/lib/tenant-server";
import ServicesManager from "@/components/services/ServicesManager";

export default async function ServicesPage() {
  const tenantId = await getTenantId();
  const services = await prisma.service.findMany({
    where: { ...tf(tenantId) },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Usługi</h1>
        <p className="text-sm text-muted-foreground">
          {services.filter((s) => s.active).length} aktywnych
        </p>
      </div>
      <ServicesManager
        initialServices={services.map((s) => ({
          id: s.id,
          name: s.name,
          durationMin: s.durationMin,
          color: s.color,
          pricePln: s.pricePln ? String(s.pricePln) : null,
          active: s.active,
        }))}
      />
    </div>
  );
}
