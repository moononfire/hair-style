import { prisma } from "@/lib/prisma";
import type { Appointment, Client, Employee, Service } from "@prisma/client";

export type AppointmentFull = Appointment & {
  client: Client | null;
  employee: Employee;
  service: Service;
};

export type CreateAppointmentInput = {
  tenantId: string | null;
  employeeId: string;
  serviceId: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  startsAt: Date;
  endsAt: Date;
  notes?: string;
  source?: string;
  createdById?: string;
};

export type UpdateAppointmentInput = {
  status?: string;
  notes?: string;
  startsAt?: Date;
  endsAt?: Date;
  employeeId?: string;
};

export async function getAppointmentsByRange(
  from: Date,
  to: Date,
  tenantId: string | null,
  employeeId?: string
): Promise<AppointmentFull[]> {
  return prisma.appointment.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      startsAt: { gte: from },
      endsAt: { lte: to },
      ...(employeeId ? { employeeId } : {}),
      status: { not: "cancelled" },
    },
    include: { client: true, employee: true, service: true },
    orderBy: { startsAt: "asc" },
  });
}

export async function createAppointment(
  input: CreateAppointmentInput
): Promise<AppointmentFull> {
  let clientId = input.clientId;

  if (!clientId && input.clientName) {
    const client = await prisma.client.create({
      data: {
        name: input.clientName,
        phone: input.clientPhone ?? null,
        ...(input.tenantId ? { tenantId: input.tenantId } : {}),
      },
    });
    clientId = client.id;
  }

  await assertNoConflict(
    input.employeeId,
    input.startsAt,
    input.endsAt,
    input.tenantId
  );

  return prisma.appointment.create({
    data: {
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
      employeeId: input.employeeId,
      serviceId: input.serviceId,
      clientId: clientId ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      notes: input.notes ?? null,
      source: input.source ?? "counter",
      createdById: input.createdById ?? null,
    },
    include: { client: true, employee: true, service: true },
  });
}

export async function updateAppointment(
  id: string,
  tenantId: string | null,
  input: UpdateAppointmentInput
): Promise<AppointmentFull> {
  if (input.startsAt && input.endsAt && input.employeeId) {
    await assertNoConflict(
      input.employeeId,
      input.startsAt,
      input.endsAt,
      tenantId,
      id
    );
  }

  return prisma.appointment.update({
    where: { id },
    data: input,
    include: { client: true, employee: true, service: true },
  });
}

export async function cancelAppointment(
  id: string,
  tenantId: string | null
): Promise<void> {
  const filter = tenantId ? { id, tenantId } : { id };
  const existing = await prisma.appointment.findFirst({ where: filter });
  if (!existing) throw new Error("Not found");
  await prisma.appointment.update({
    where: { id },
    data: { status: "cancelled" },
  });
}

async function assertNoConflict(
  employeeId: string,
  startsAt: Date,
  endsAt: Date,
  tenantId: string | null,
  excludeId?: string
): Promise<void> {
  const conflict = await prisma.appointment.findFirst({
    where: {
      ...(tenantId ? { tenantId } : {}),
      employeeId,
      status: { not: "cancelled" },
      id: excludeId ? { not: excludeId } : undefined,
      OR: [{ startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }],
    },
  });

  if (conflict) {
    throw new Error(
      `Pracownik ma już wizytę w tym czasie (${conflict.startsAt.toISOString()}–${conflict.endsAt.toISOString()})`
    );
  }
}
