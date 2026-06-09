"use client";

import { formatTime } from "@/lib/date";
import type { AppointmentSerialized } from "./CalendarView";

const STATUS_CLASSES: Record<string, string> = {
  pending:     "opacity-60",
  confirmed:   "",
  arrived:     "ring-1 ring-white/60",
  in_progress: "ring-2 ring-white",
  completed:   "opacity-40",
  no_show:     "opacity-30",
  cancelled:   "opacity-20",
};

type Props = {
  appointment: AppointmentSerialized;
  top: number;
  height: number;
  isSelected: boolean;
  onClick: () => void;
};

export default function AppointmentBlock({ appointment, top, height, isSelected, onClick }: Props) {
  const starts = new Date(appointment.startsAt);
  const ends = new Date(appointment.endsAt);

  return (
    <div
      data-appointment
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`${appointment.clientName ?? "Bez klienta"} — ${appointment.serviceName} (${formatTime(starts)}–${formatTime(ends)})`}
      className={`absolute left-1 right-1 cursor-pointer rounded px-1.5 py-0.5 text-white transition-all select-none overflow-hidden ${STATUS_CLASSES[appointment.status] ?? ""} ${isSelected ? "ring-2 ring-offset-1 ring-white brightness-90" : "hover:brightness-90"}`}
      style={{
        top,
        height,
        backgroundColor: appointment.employeeColor,
        zIndex: isSelected ? 10 : 2,
        minHeight: 16,
      }}
    >
      {height < 28 ? (
        /* 15 min — jedna linia: imię + czas */
        <div className="flex items-center justify-between gap-1 text-xs leading-tight">
          <span className="truncate font-semibold">{appointment.clientName ?? "Bez klienta"}</span>
          <span className="shrink-0 opacity-75">{formatTime(starts)}–{formatTime(ends)}</span>
        </div>
      ) : height <= 44 ? (
        /* 30 min — dwie linie: imię / usługa · czas */
        <>
          <div className="truncate text-xs font-semibold leading-tight">
            {appointment.clientName ?? "Bez klienta"}
          </div>
          <div className="truncate text-xs leading-tight opacity-80">
            {appointment.serviceName} · {formatTime(starts)}–{formatTime(ends)}
          </div>
        </>
      ) : (
        /* 45 min+ — trzy linie: imię / usługa / czas */
        <>
          <div className="truncate text-xs font-semibold leading-tight">
            {appointment.clientName ?? "Bez klienta"}
          </div>
          <div className="truncate text-xs leading-tight opacity-90">
            {appointment.serviceName}
          </div>
          <div className="truncate text-xs leading-tight opacity-75">
            {formatTime(starts)}–{formatTime(ends)}
          </div>
        </>
      )}
    </div>
  );
}
