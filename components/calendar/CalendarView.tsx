"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addDays, startOfWeek, formatDate, formatShortDate } from "@/lib/date";
import CalendarDay from "./CalendarDay";
import CalendarWeek from "./CalendarWeek";
import AppointmentPanel from "./AppointmentPanel";

export type AppointmentSerialized = {
  id: string;
  clientName: string | null;
  clientPhone: string | null;
  employeeId: string;
  employeeName: string;
  employeeColor: string;
  serviceName: string;
  serviceColor: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string | null;
  source: string;
};

export type EmployeeSerialized = {
  id: string;
  name: string;
  color: string;
};

type Props = {
  employees: EmployeeSerialized[];
  appointments: AppointmentSerialized[];
  initialDate: string;
  initialView: "day" | "week";
};

export default function CalendarView({ employees, appointments, initialDate, initialView }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const currentDate = new Date(initialDate + "T12:00:00");
  const weekStart = startOfWeek(currentDate);

  const selectedAppointment = appointments.find((a) => a.id === selectedId) ?? null;

  const navigate = (date: Date, view: "day" | "week") => {
    const dateStr = date.toISOString().slice(0, 10);
    router.push(`/calendar?date=${dateStr}&view=${view}`);
  };

  const prevPeriod = () => navigate(addDays(currentDate, initialView === "week" ? -7 : -1), initialView);
  const nextPeriod = () => navigate(addDays(currentDate, initialView === "week" ? 7 : 1), initialView);
  const goToday = () => navigate(new Date(), initialView);

  const headerLabel =
    initialView === "week"
      ? `${formatShortDate(weekStart)} – ${formatShortDate(addDays(weekStart, 6))}`
      : formatDate(currentDate);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={prevPeriod}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            aria-label="Poprzedni"
          >
            ‹
          </button>
          <button
            onClick={goToday}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Dziś
          </button>
          <button
            onClick={nextPeriod}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            aria-label="Następny"
          >
            ›
          </button>
          <span className="ml-2 font-medium">{headerLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border">
            <button
              onClick={() => navigate(currentDate, "day")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                initialView === "day"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Dzień
            </button>
            <button
              onClick={() => navigate(currentDate, "week")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                initialView === "week"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Tydzień
            </button>
          </div>
          <Link
            href="/appointments/new"
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Nowa wizyta
          </Link>
        </div>
      </div>

      {/* Calendar + Panel */}
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="min-w-0 flex-1 overflow-auto rounded-lg border">
          {initialView === "day" ? (
            <CalendarDay
              date={currentDate}
              employees={employees}
              appointments={appointments}
              selectedId={selectedId}
              onSelectAppointment={setSelectedId}
            />
          ) : (
            <CalendarWeek
              weekStart={weekStart}
              employees={employees}
              appointments={appointments}
              selectedId={selectedId}
              onSelectAppointment={setSelectedId}
              onDayClick={(date) => navigate(date, "day")}
            />
          )}
        </div>

        {selectedAppointment && (
          <AppointmentPanel
            appointment={selectedAppointment}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}
