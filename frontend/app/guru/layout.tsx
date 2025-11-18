// app/guru/layout.tsx
import { AppSidebarGuru } from "@/components/layout/guru/App-sidebar";
import { TopbarGuru } from "@/components/layout/guru/Topbar"; // Import TopbarGuru

// Lebar Sidebar adalah w-72 (tailwind class)
const MAIN_CONTENT_MARGIN_CLASS = "ml-72"; // Margin harus sama dengan lebar sidebar

export default function GuruLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* 1. SIDEBAR (Fixed) */}
            <AppSidebarGuru />

            {/* 2. KONTEN UTAMA */}
            <div className={`flex-1 flex flex-col ${MAIN_CONTENT_MARGIN_CLASS}`}>

                {/* TOPBAR */}
                <TopbarGuru />

                {/* KONTEN UTAMA */}
                <main className="flex-1 pb-8">
                    {children}
                </main>
            </div>
        </div>
    );
}