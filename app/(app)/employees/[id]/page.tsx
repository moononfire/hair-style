import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EmployeeInfoForm from "@/components/employees/EmployeeInfoForm";
import EmployeeHoursForm from "@/components/employees/EmployeeHoursForm";
import TimeBlockSection from "@/components/employees/TimeBlockSection";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      hours: { orderBy: { dayOfWeek: "asc" } },
      timeBlocks: {
        where: { startsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  if (!employee) notFound();

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-semibold shrink-0"
          style={{ backgroundColor: employee.color }}
        >
          {employee.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{employee.name}</h1>
          <p className="text-sm text-muted-foreground">
            {employee.active ? "Aktywny" : "Nieaktywny"}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">Dane podstawowe</h2>
        <EmployeeInfoForm employee={employee} />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Godziny pracy</h2>
        <EmployeeHoursForm
          employeeId={employee.id}
          initialHours={employee.hours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            startTime: h.startTime,
            endTime: h.endTime,
          }))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Blokady (urlopy, przerwy)</h2>
        <TimeBlockSection
          employeeId={employee.id}
          initialBlocks={employee.timeBlocks.map((b) => ({
            id: b.id,
            startsAt: b.startsAt.toISOString(),
            endsAt: b.endsAt.toISOString(),
            reason: b.reason,
          }))}
        />
      </section>
    </div>
  );
}
