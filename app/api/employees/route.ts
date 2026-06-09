import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId, tf } from "@/lib/tenant-server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const employees = await prisma.employee.findMany({
    where: { ...tf(tenantId), active: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { name, color, phone } = await req.json();
  if (!name) return NextResponse.json({ error: "Imię jest wymagane" }, { status: 400 });
  if (!color) return NextResponse.json({ error: "Kolor jest wymagany" }, { status: 400 });

  const employee = await prisma.employee.create({
    data: { ...tf(tenantId), name, color, phone },
  });
  return NextResponse.json(employee, { status: 201 });
}
