// app/siswa/layout.tsx
import { AppSidebarSiswa } from "@/components/layout/siswa/App-sidebar";
import { TopbarSiswa } from "@/components/layout/siswa/Topbar";
import { NotificationProvider } from "@/components/ui/Notification/NotificationContext";

// Lebar Sidebar adalah w-72 (tailwind class)
const MAIN_CONTENT_MARGIN_CLASS = "ml-72"; // Margin harus sama dengan lebar sidebar

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* 1. SIDEBAR (Fixed) */}
            <AppSidebarSiswa />
            
            {/* 2. KONTEN UTAMA */}
            <div className={`flex-1 flex flex-col ${MAIN_CONTENT_MARGIN_CLASS}`}>
                {/* TOPBAR */}
                <TopbarSiswa />
                
                {/* KONTEN UTAMA - Scrollable */}
                <main className="flex-1 overflow-y-auto">
                    {/* TAMBAHKAN NotificationProvider DI SINI */}
                    <NotificationProvider>
                        {children}
                    </NotificationProvider>
                </main>
            </div>
        </div>
    );
}