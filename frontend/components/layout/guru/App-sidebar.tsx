// AppSidebarGuru.tsx (Perbaikan untuk Fixed Position)
"use client";

import {
    GraduationCap,
    Building2,
    BookOpen
} from "lucide-react";
import { SidebarNav } from "./Sidebar-nav";

const navigationItems = [
    {
        title: "Dashboard",
        icon: GraduationCap,
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

export function AppSidebarGuru() {
    return (
        <div className="flex h-screen w-72 flex-col bg-white border-r border-gray-100 shadow-sm fixed top-0 left-0 z-10">

            {/* Header (Tetap Statis) */}
            <div className="p-6 border-b border-gray-100 shrink-0">
                {/* ... konten header tetap sama ... */}
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-[#0097BB] flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-[white]" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Magang</h1>
                        <p className="text-xs text-gray-500 -mt-0.5">Management</p>
                    </div>
                </div>
            </div>

            {/* NAVIGATION (Dapat Scroll) */}
            {/* flex-1 dan overflow-y-auto memungkinkan bagian ini yang scroll */}
            <div className="flex-1 overflow-y-auto py-6">
                <SidebarNav items={navigationItems} />
            </div>

            {/* FOOTER (Tetap Statis) */}
            <div className="p-4 border-t border-gray-100 shrink-0">
                {/* ... konten footer tetap sama ... */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-800">
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