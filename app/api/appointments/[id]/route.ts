import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateAppointment, cancelAppointment } from "@/lib/appointments";
import { getTenantId } from "@/lib/tenant-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { id } = await params;
  const body = await req.json();
  const { status, notes, startsAt, endsAt, employeeId } = body;

  try {
    const appointment = await updateAppointment(id, tenantId, {
      status,
      notes,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      employeeId,
    });
    return NextResponse.json(appointment);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Błąd serwera";
    const status = message === "Not found" ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { id } = await params;

  try {
    await cancelAppointment(id, tenantId);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
