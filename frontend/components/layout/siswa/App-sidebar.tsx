// AppSidebarSiswa.tsx
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
        href: "/siswa/dashboard",
        description: "Ringkasan aktivitas",
    },
    {
        title: "DUDI",
        icon: Building2,
        href: "/siswa/dudi",
        description: "Dunia Usaha & Industri",
    },
    {
        title: "Magang",
        icon: GraduationCap,
        href: "/siswa/magang",
        description: "Data siswa magang",
    },
    {
        title: "Logbook",
        icon: BookOpen,
        href: "/siswa/logbook",
        description: "Catatan harian",
    },
];

export function AppSidebarSiswa() {
    return (
        <div className="fixed left-0 top-0 h-screen w-72 flex flex-col bg-white border-r border-gray-100 shadow-sm z-50">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                    {/* ICON WRAPPER */}
                    <div className="h-11 w-11 rounded-xl bg-[#4FC3F7] flex items-center justify-center shadow-sm">
                        <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Magang</h1>
                        <p className="text-xs text-gray-500 -mt-0.5">Portal Siswa</p>
                    </div>
                </div>
            </div>

            {/* NAVIGATION */}
            <div className="flex-1 overflow-y-auto py-6">
                <SidebarNav items={navigationItems} />
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-800">
                        N
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-none truncate">
                            SMK Negeri 6 Malang
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            Sistem Pelaporan v1.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}