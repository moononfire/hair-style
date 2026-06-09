import { SidebarProvider } from "@/components/layout/SidebarContext";
import { ToastProvider } from "@/lib/toast";
import KeyboardShortcuts from "@/components/layout/KeyboardShortcuts";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <SidebarProvider>
        <KeyboardShortcuts />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </ToastProvider>
  );
}
