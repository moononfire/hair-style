import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId, tf } from "@/lib/tenant-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { id } = await params;

  const existing = await prisma.service.findFirst({ where: { id, ...tf(tenantId) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, durationMin, color, pricePln, active } = await req.json();
  const service = await prisma.service.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(durationMin !== undefined && { durationMin: Number(durationMin) }),
      ...(color !== undefined && { color }),
      ...(pricePln !== undefined && { pricePln }),
      ...(active !== undefined && { active }),
    },
  });
  return NextResponse.json(service);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { id } = await params;

  const existing = await prisma.service.findFirst({ where: { id, ...tf(tenantId) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.service.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
