import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId, tf } from "@/lib/tenant-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { id } = await params;

  const owner = await prisma.employee.findFirst({ where: { id, ...tf(tenantId) } });
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hours = await prisma.employeeHours.findMany({
    where: { employeeId: id },
    orderBy: { dayOfWeek: "asc" },
  });
  return NextResponse.json(hours);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { id } = await params;

  const owner = await prisma.employee.findFirst({ where: { id, ...tf(tenantId) } });
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  } | null>;

  await prisma.$transaction(async (tx) => {
    await tx.employeeHours.deleteMany({ where: { employeeId: id } });
    for (const h of body) {
      if (!h) continue;
      await tx.employeeHours.create({
        data: {
          ...tf(tenantId),
          employeeId: id,
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime,
          endTime: h.endTime,
        },
      });
    }
  });

  const hours = await prisma.employeeHours.findMany({
    where: { employeeId: id },
    orderBy: { dayOfWeek: "asc" },
  });
  return NextResponse.json(hours);
}
