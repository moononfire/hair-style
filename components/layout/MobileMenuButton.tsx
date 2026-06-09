"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "./SidebarContext";

export default function MobileMenuButton() {
  const { toggle } = useSidebar();
  return (
    <button
      onClick={toggle}
      aria-label="Menu"
      className="lg:hidden rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
