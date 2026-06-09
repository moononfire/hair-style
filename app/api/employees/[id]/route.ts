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
  const employee = await prisma.employee.findFirst({
    where: { id, ...tf(tenantId) },
    include: {
      hours: { orderBy: { dayOfWeek: "asc" } },
      timeBlocks: { orderBy: { startsAt: "asc" } },
    },
  });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(employee);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { id } = await params;

  const existing = await prisma.employee.findFirst({ where: { id, ...tf(tenantId) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, color, phone, active } = await req.json();
  const employee = await prisma.employee.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
      ...(phone !== undefined && { phone }),
      ...(active !== undefined && { active }),
    },
  });
  return NextResponse.json(employee);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { id } = await params;

  const existing = await prisma.employee.findFirst({ where: { id, ...tf(tenantId) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.employee.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
