"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      Wyloguj
    </button>
  );
}
