import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId, tf } from "@/lib/tenant-server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const q = req.nextUrl.searchParams.get("q") ?? "";

  const clients = await prisma.client.findMany({
    where: {
      ...tf(tenantId),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { name, phone, email, notes } = await req.json();
  if (!name) return NextResponse.json({ error: "Imię jest wymagane" }, { status: 400 });

  const client = await prisma.client.create({
    data: { ...tf(tenantId), name, phone, email, notes },
  });
  return NextResponse.json(client, { status: 201 });
}
