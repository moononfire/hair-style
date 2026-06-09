"use client";

import { useRouter } from "next/navigation";
import { addDays, formatDayName, formatShortDate, isSameDay } from "@/lib/date";
import type { AppointmentSerialized, EmployeeSerialized } from "./CalendarView";
import AppointmentBlock from "./AppointmentBlock";

const DAY_START = 8;
const DAY_END = 20;
const HOUR_HEIGHT = 48;
const HOURS = DAY_END - DAY_START;
const TOTAL_HEIGHT = HOURS * HOUR_HEIGHT;
const TIME_COL_W = 48;

function toTop(date: Date): number {
  const mins = (date.getHours() - DAY_START) * 60 + date.getMinutes();
  return Math.max(0, (mins / 60) * HOUR_HEIGHT);
}

function toHeight(start: Date, end: Date): number {
  const startMins = Math.max(0, (start.getHours() - DAY_START) * 60 + start.getMinutes());
  const endMins = Math.min(HOURS * 60, (end.getHours() - DAY_START) * 60 + end.getMinutes());
  return Math.max(14, ((endMins - startMins) / 60) * HOUR_HEIGHT);
}

type Props = {
  weekStart: Date;
  employees: EmployeeSerialized[];
  appointments: AppointmentSerialized[];
  selectedId: string | null;
  onSelectAppointment: (id: string) => void;
  onDayClick: (date: Date) => void;
};

export default function CalendarWeek({ weekStart, employees, appointments, selectedId, onSelectAppointment, onDayClick }: Props) {
  const router = useRouter();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: HOURS }, (_, i) => DAY_START + i);
  const today = new Date();

  const handleDayClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
    if ((e.target as HTMLElement).closest("[data-appointment]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rawMins = (y / HOUR_HEIGHT) * 60;
    const totalMins = DAY_START * 60 + Math.round(rawMins / 30) * 30;
    const h = Math.min(Math.floor(totalMins / 60), DAY_END - 1);
    const m = totalMins % 60;
    const dateStr = day.toISOString().slice(0, 10);
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    router.push(`/appointments/new?startsAt=${dateStr}T${hh}:${mm}`);
  };

  return (
    <div className="select-none">
      {/* Day headers */}
      <div className="sticky top-0 z-10 flex border-b bg-background" style={{ paddingLeft: TIME_COL_W }}>
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={`flex min-w-24 flex-1 flex-col items-center border-l py-2 transition-colors hover:bg-accent/50 ${isToday ? "bg-primary/5" : ""}`}
            >
              <span className={`text-xs font-medium uppercase ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                {formatDayName(day)}
              </span>
              <span className={`text-sm font-semibold ${isToday ? "text-primary" : ""}`}>
                {formatShortDate(day)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex">
        {/* Time labels */}
        <div className="relative flex-shrink-0" style={{ width: TIME_COL_W, height: TOTAL_HEIGHT }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute right-0 flex items-start pr-1.5"
              style={{ top: (h - DAY_START) * HOUR_HEIGHT - 8 }}
            >
              <span className="text-xs text-muted-foreground">{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const dayAppts = appointments.filter((a) =>
            isSameDay(new Date(a.startsAt), day)
          );
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={`relative min-w-24 flex-1 cursor-crosshair border-l ${isToday ? "bg-primary/5" : ""}`}
              style={{ height: TOTAL_HEIGHT }}
              onClick={(e) => handleDayClick(e, day)}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="pointer-events-none absolute left-0 right-0 border-t border-border/60"
                  style={{ top: (h - DAY_START) * HOUR_HEIGHT }}
                />
              ))}
              {hours.map((h) => (
                <div
                  key={`${h}h`}
                  className="pointer-events-none absolute left-0 right-0 border-t border-border/25"
                  style={{ top: (h - DAY_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                />
              ))}

              {dayAppts.map((appt) => (
                <AppointmentBlock
                  key={appt.id}
                  appointment={appt}
                  top={toTop(new Date(appt.startsAt))}
                  height={toHeight(new Date(appt.startsAt), new Date(appt.endsAt))}
                  isSelected={appt.id === selectedId}
                  onClick={() => onSelectAppointment(appt.id)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
