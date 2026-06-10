import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-agency-secret");
  if (!secret || secret !== process.env.AGENCY_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenantId, adminName, adminEmail, adminPassword, services } = await req.json();

  if (!tenantId || !adminName || !adminEmail || !adminPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { employee: { tenantId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already set up" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const user = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      employee: {
        create: {
          tenantId,
          name: adminName,
          color: "#3b82f6",
          active: true,
        },
      },
    },
  });

  const DEFAULT_DURATIONS: Record<string, number> = {
    "Strzyżenie damskie": 60,
    "Strzyżenie męskie": 30,
    "Koloryzacja": 120,
    "Pielęgnacja brody": 30,
    "Manicure": 60,
    "Pedicure": 60,
    "Masaż": 60,
    "Makijaż": 60,
  };

  if (services) {
    const serviceNames: string[] = services.split(",").filter(Boolean);
    if (serviceNames.length > 0) {
      await prisma.service.createMany({
        data: serviceNames.map((name: string) => ({
          tenantId,
          name,
          durationMin: DEFAULT_DURATIONS[name] ?? 60,
          active: true,
        })),
      });
    }
  }

  return NextResponse.json({ userId: user.id }, { status: 201 });
}
