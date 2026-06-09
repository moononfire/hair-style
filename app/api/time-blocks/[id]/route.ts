import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId, tf } from "@/lib/tenant-server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { id } = await params;

  const existing = await prisma.timeBlock.findFirst({ where: { id, ...tf(tenantId) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.timeBlock.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
