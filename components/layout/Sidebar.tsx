"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Clock,
  CalendarCheck,
  Users,
  Scissors,
  UserCog,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

const links = [
  { href: "/calendar", label: "Kalendarz", icon: Calendar },
  { href: "/today", label: "Dzisiaj", icon: CalendarCheck },
  { href: "/availability", label: "Wolne terminy", icon: Clock },
  { href: "/appointments", label: "Wizyty", icon: CalendarCheck },
  { href: "/clients", label: "Klienci", icon: Users },
  { href: "/services", label: "Usługi", icon: Scissors },
  { href: "/employees", label: "Pracownicy", icon: UserCog },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { open, close } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex h-full w-56 flex-col border-r bg-background
          transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:z-auto
        `}
      >
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-semibold text-base">HairBook</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <p className="px-3 text-xs text-muted-foreground">
            <kbd className="rounded border px-1 font-mono text-xs">N</kbd>{" "}
            nowa wizyta&nbsp;&nbsp;
            <kbd className="rounded border px-1 font-mono text-xs">T</kbd>{" "}
            dzisiaj
          </p>
        </div>
      </aside>
    </>
  );
}
