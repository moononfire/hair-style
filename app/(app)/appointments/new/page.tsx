import { prisma } from "@/lib/prisma";
import { getTenantId, tf } from "@/lib/tenant-server";
import AppointmentForm from "@/components/appointments/AppointmentForm";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string; startsAt?: string; serviceId?: string }>;
}) {
  const { employeeId, startsAt, serviceId } = await searchParams;

  const tenantId = await getTenantId();
  const [employees, services] = await Promise.all([
    prisma.employee.findMany({ where: { ...tf(tenantId), active: true }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { ...tf(tenantId), active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Nowa wizyta</h1>
        <p className="text-sm text-muted-foreground">Wypełnij formularz aby zapisać wizytę.</p>
      </div>
      <AppointmentForm
        employees={employees.map((e: { id: string; name: string; color: string }) => ({ id: e.id, name: e.name, color: e.color }))}
        services={services.map((s: { id: string; name: string; durationMin: number; color: string | null }) => ({ id: s.id, name: s.name, durationMin: s.durationMin, color: s.color }))}
        defaults={{ employeeId, startsAt, serviceId }}
      />
    </div>
  );
}
