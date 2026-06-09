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
  const client = await prisma.client.findFirst({
    where: { id, ...tf(tenantId) },
    include: {
      appointments: {
        include: { service: true, employee: true },
        orderBy: { startsAt: "desc" },
      },
    },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(client);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { id } = await params;

  const existing = await prisma.client.findFirst({ where: { id, ...tf(tenantId) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, phone, email, notes } = await req.json();
  if (!name) return NextResponse.json({ error: "Imię jest wymagane" }, { status: 400 });

  const client = await prisma.client.update({
    where: { id },
    data: { name, phone, email, notes },
  });
  return NextResponse.json(client);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { id } = await params;

  const existing = await prisma.client.findFirst({ where: { id, ...tf(tenantId) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
