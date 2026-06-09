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

  const blocks = await prisma.timeBlock.findMany({
    where: { employeeId: id, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json(blocks);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { id } = await params;

  const owner = await prisma.employee.findFirst({ where: { id, ...tf(tenantId) } });
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { startsAt, endsAt, reason } = await req.json();
  if (!startsAt || !endsAt) {
    return NextResponse.json({ error: "Wymagane startsAt i endsAt" }, { status: 400 });
  }

  const block = await prisma.timeBlock.create({
    data: {
      ...(tenantId ? { tenantId } : {}),
      employeeId: id,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      reason,
    },
  });
  return NextResponse.json(block, { status: 201 });
}
