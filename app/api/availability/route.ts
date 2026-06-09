import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findAvailableSlots } from "@/lib/availability";
import { getTenantId } from "@/lib/tenant-server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId();
  const { searchParams } = req.nextUrl;
  const durationMin = Number(searchParams.get("durationMin"));
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const employeeId = searchParams.get("employeeId") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "20");

  if (!durationMin || !dateFrom || !dateTo) {
    return NextResponse.json(
      { error: "Wymagane parametry: durationMin, dateFrom, dateTo" },
      { status: 400 }
    );
  }

  const slots = await findAvailableSlots({
    durationMin,
    dateFrom: new Date(dateFrom),
    dateTo: new Date(dateTo),
    tenantId,
    employeeId,
    limit,
  });

  return NextResponse.json(
    slots.map((s) => ({
      employeeId: s.employee.id,
      employeeName: s.employee.name,
      employeeColor: s.employee.color,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
    }))
  );
}
