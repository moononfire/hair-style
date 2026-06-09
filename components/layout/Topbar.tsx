import { auth } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import MobileMenuButton from "./MobileMenuButton";

export default async function Topbar() {
  const session = await auth();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 gap-3">
      <MobileMenuButton />
      <div className="flex items-center gap-3 ml-auto">
        <span className="hidden sm:block text-sm text-muted-foreground">
          {session?.user?.name ?? session?.user?.email}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
