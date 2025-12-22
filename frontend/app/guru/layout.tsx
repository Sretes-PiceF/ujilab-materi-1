// app/guru/layout.tsx
import { AppSidebarGuru } from "@/components/layout/guru/App-sidebar";
import { TopbarGuru } from "@/components/layout/guru/Topbar";
import { NotificationProvider } from "@/components/ui/Notification/NotificationContext";

const MAIN_CONTENT_MARGIN_CLASS = "ml-71";

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* 1. SIDEBAR (Fixed) */}
        <AppSidebarGuru />

        {/* 2. KONTEN UTAMA */}
        <div className={`flex-1 flex flex-col ${MAIN_CONTENT_MARGIN_CLASS}`}>
          {/* TOPBAR */}
          <TopbarGuru />

          {/* KONTEN UTAMA - Scrollable */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </NotificationProvider>
  );
}
