import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAppointmentsByRange, createAppointment } from "@/lib/appointments";
import { getTenantId } from "@/lib/tenant-server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const employeeId = searchParams.get("employeeId") ?? undefined;

  if (!from || !to) {
    return NextResponse.json({ error: "Wymagane parametry: from, to" }, { status: 400 });
  }

  const appointments = await getAppointmentsByRange(
    new Date(from),
    new Date(to),
    tenantId,
    employeeId
  );
  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const body = await req.json();
  const { employeeId, serviceId, clientId, clientName, clientPhone, startsAt, endsAt, notes, source } = body;

  if (!employeeId || !serviceId || !startsAt || !endsAt) {
    return NextResponse.json(
      { error: "Wymagane pola: employeeId, serviceId, startsAt, endsAt" },
      { status: 400 }
    );
  }

  try {
    const appointment = await createAppointment({
      tenantId,
      employeeId,
      serviceId,
      clientId,
      clientName,
      clientPhone,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      notes,
      source,
      createdById: session.user?.id,
    });
    return NextResponse.json(appointment, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Błąd serwera";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
