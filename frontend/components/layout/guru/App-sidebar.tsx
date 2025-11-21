// AppSidebarGuru.tsx
"use client";
import {
    GraduationCap,
    Building2,
    BookOpen,
    LayoutDashboardIcon
} from "lucide-react";
import { SidebarNav } from "./Sidebar-nav";

const navigationItems = [
    {
        title: "Dashboard",
        icon: LayoutDashboardIcon,
        href: "/guru/dashboard",
        description: "Ringkasan aktivitas",
    },
    {
        title: "DUDI",
        icon: Building2,
        href: "/guru/dudi",
        description: "Dunia Usaha & Industri",
    },
    {
        title: "Magang",
        icon: GraduationCap,
        href: "/guru/magang",
        description: "Data siswa magang",
    },
    {
        title: "Logbook",
        icon: BookOpen,
        href: "/guru/logbook",
        description: "Catatan harian",
    },
];

// Inline style untuk rounded corners
const roundedStyle = {
    borderRadius: "0.75rem" // rounded-xl
};

const roundedFullStyle = {
    borderRadius: "9999px" // rounded-full
};

export function AppSidebarGuru() {
    return (
        <div className="flex h-screen w-72 flex-col bg-white border-r border-gray-100 shadow-sm fixed top-0 left-0 z-10">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                    {/* Logo dengan inline style */}
                    <div
                        className="h-10 w-10 bg-[#4FC3F7] flex items-center justify-center shadow-sm hover:scale-105 transition-transform cursor-pointer"
                        style={roundedStyle} // <- Terapkan rounded-xl
                    >
                        <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Magang</h1>
                        <p className="text-xs text-gray-500 -mt-0.5">Portal Guru</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-2 px-3">
                <SidebarNav items={navigationItems} />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 shrink-0">
                <div
                    className="flex items-center gap-3 p-3 bg-gray-50"
                    style={roundedStyle} // <- Terapkan rounded-xl ke container footer
                >
                    {/* Avatar di footer dengan inline style rounded-full */}
                    <div
                        className="h-8 w-8 bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-800"
                        style={roundedFullStyle} // <- Terapkan rounded-full
                    >
                        N
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 leading-none">
                            SMK Negeri 6 Malang
                        </p>
                        <p className="text-xs text-gray-500">
                            Sistem Pelaporan v1.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}