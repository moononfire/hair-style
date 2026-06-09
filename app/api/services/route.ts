import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId, tf } from "@/lib/tenant-server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const services = await prisma.service.findMany({
    where: { ...tf(tenantId), active: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { name, durationMin, color, pricePln } = await req.json();
  if (!name) return NextResponse.json({ error: "Nazwa jest wymagana" }, { status: 400 });
  if (!durationMin) return NextResponse.json({ error: "Czas trwania jest wymagany" }, { status: 400 });

  const service = await prisma.service.create({
    data: { ...tf(tenantId), name, durationMin: Number(durationMin), color, pricePln },
  });
  return NextResponse.json(service, { status: 201 });
}
