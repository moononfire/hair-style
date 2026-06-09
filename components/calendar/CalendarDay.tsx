"use client";

import { useRouter } from "next/navigation";
import { isSameDay } from "@/lib/date";
import type { AppointmentSerialized, EmployeeSerialized } from "./CalendarView";
import AppointmentBlock from "./AppointmentBlock";

const DAY_START = 8;
const DAY_END = 20;
const HOUR_HEIGHT = 64;
const HOURS = DAY_END - DAY_START;
const TOTAL_HEIGHT = HOURS * HOUR_HEIGHT;
const TIME_COL_W = 56;

function toTop(date: Date): number {
  const mins = (date.getHours() - DAY_START) * 60 + date.getMinutes();
  return Math.max(0, (mins / 60) * HOUR_HEIGHT);
}

function toHeight(start: Date, end: Date): number {
  const startMins = Math.max(0, (start.getHours() - DAY_START) * 60 + start.getMinutes());
  const endMins = Math.min(HOURS * 60, (end.getHours() - DAY_START) * 60 + end.getMinutes());
  return Math.max(18, ((endMins - startMins) / 60) * HOUR_HEIGHT);
}

type Props = {
  date: Date;
  employees: EmployeeSerialized[];
  appointments: AppointmentSerialized[];
  selectedId: string | null;
  onSelectAppointment: (id: string) => void;
};

export default function CalendarDay({ date, employees, appointments, selectedId, onSelectAppointment }: Props) {
  const router = useRouter();
  const dateStr = date.toISOString().slice(0, 10);
  const hours = Array.from({ length: HOURS }, (_, i) => DAY_START + i);

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>, employeeId: string) => {
    if ((e.target as HTMLElement).closest("[data-appointment]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rawMins = (y / HOUR_HEIGHT) * 60;
    const totalMins = DAY_START * 60 + Math.round(rawMins / 30) * 30;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const hh = String(Math.min(h, DAY_END - 1)).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    router.push(`/appointments/new?employeeId=${employeeId}&startsAt=${dateStr}T${hh}:${mm}`);
  };

  return (
    <div className="select-none">
      {/* Employee column headers */}
      <div className="sticky top-0 z-10 flex border-b bg-background" style={{ paddingLeft: TIME_COL_W }}>
        {employees.map((emp) => (
          <div key={emp.id} className="flex min-w-36 flex-1 items-center justify-center gap-1.5 border-l px-2 py-2.5">
            <span
              className="inline-block h-3 w-3 flex-shrink-0 rounded-full"
              style={{ backgroundColor: emp.color }}
            />
            <span className="truncate text-sm font-medium">{emp.name}</span>
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div className="flex">
        {/* Time labels */}
        <div className="relative flex-shrink-0" style={{ width: TIME_COL_W, height: TOTAL_HEIGHT }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute right-0 flex items-start pr-2"
              style={{ top: (h - DAY_START) * HOUR_HEIGHT - 8 }}
            >
              <span className="text-xs text-muted-foreground">{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        {/* Employee columns */}
        {employees.map((emp) => {
          const empAppts = appointments.filter(
            (a) => a.employeeId === emp.id && isSameDay(new Date(a.startsAt), date)
          );

          return (
            <div
              key={emp.id}
              className="relative min-w-36 flex-1 cursor-crosshair border-l"
              style={{ height: TOTAL_HEIGHT }}
              onClick={(e) => handleColumnClick(e, emp.id)}
            >
              {/* Hour lines */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="pointer-events-none absolute left-0 right-0 border-t border-border/60"
                  style={{ top: (h - DAY_START) * HOUR_HEIGHT }}
                />
              ))}
              {/* Half-hour lines */}
              {hours.map((h) => (
                <div
                  key={`${h}h`}
                  className="pointer-events-none absolute left-0 right-0 border-t border-border/25"
                  style={{ top: (h - DAY_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                />
              ))}

              {/* Appointments */}
              {empAppts.map((appt) => (
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
