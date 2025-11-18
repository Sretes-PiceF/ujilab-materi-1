"use client";

import { User } from "lucide-react";

export function TopbarGuru() {
    return (
        <div className="w-full h-[93px] flex items-center justify-between px-6 bg-white border-b border-gray-100 sticky top-0 z-50">
            {/* BAGIAN KIRI — Title */}
            <div>
                <h1 className="text-lg font-semibold text-gray-800">SIMNAS</h1>
                <p className="text-xs text-gray-500 -mt-1">Sistem Informasi Magang Nasional</p>
            </div>

            {/* BAGIAN KANAN — Profil */}
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="font-medium text-sm text-gray-800">Admin Guru</p>
                    <p className="text-xs text-gray-500 -mt-1">Guru Pembimbing</p>
                </div>

                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                </div>
            </div>
        </div>
    );
}