import { prisma } from "@/lib/prisma";
import type { Employee, Service } from "@prisma/client";
import AppointmentForm from "@/components/appointments/AppointmentForm";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string; startsAt?: string; serviceId?: string }>;
}) {
  const { employeeId, startsAt, serviceId } = await searchParams;

  const [employees, services] = await Promise.all([
    prisma.employee.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Nowa wizyta</h1>
        <p className="text-sm text-muted-foreground">Wypełnij formularz aby zapisać wizytę.</p>
      </div>
      <AppointmentForm
        employees={employees.map((e: Employee) => ({ id: e.id, name: e.name, color: e.color }))}
        services={services.map((s: Service) => ({ id: s.id, name: s.name, durationMin: s.durationMin, color: s.color }))}
        defaults={{ employeeId, startsAt, serviceId }}
      />
    </div>
  );
}
