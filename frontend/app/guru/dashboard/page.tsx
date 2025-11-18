// app/guru/dashboard/DashboardPage.tsx

import { DudiCard } from "@/components/layout/guru/DudiCard";
import { LogbookCard } from "@/components/layout/guru/LogbookCard";
import { MagangCard } from "@/components/layout/guru/MagangCard";
import { ProgressCard } from "@/components/layout/guru/Progres";
import { CardStats } from "@/components/ui/CardStats";
import {
    User, Building2, GraduationCap, BookOpen

} from "lucide-react";
// Pastikan Anda mengimpor Card dan Ikon dari lokasi yang benar

export default function DashboardPage() {
    return (
        <div className="p-8">
            {/* Header Dashboard tetap ada di sini */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-600 mt-1">
                    Selamat datang di dashboard admin <span className="font-semibold">SIMNAS</span>
                </p>
            </div>
            {/* GRID CARDS */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

                <CardStats
                    title="Total Siswa"
                    value={150}
                    description="Seluruh siswa terdaftar"
                    icon={User}
                />

                <CardStats
                    title="DUDI Partner"
                    value={45}
                    description="Perusahaan mitra"
                    icon={Building2}
                />

                <CardStats
                    title="Siswa Magang"
                    value={120}
                    description="Sedang aktif magang"
                    icon={GraduationCap}
                />

                <CardStats
                    title="Logbook Hari Ini"
                    value={85}
                    description="Laporan masuk hari ini"
                    icon={BookOpen}
                />
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kolom Kiri: Magang & Logbook Terbaru (Membutuhkan Grid/Flex internal) */}
                <div className="lg:col-span-2 space-y-6">
                    <MagangCard />
                    <LogbookCard />
                </div>

                {/* Kolom Kanan: Progress & DUDI Aktif */}
                <div className="lg:col-span-1 space-y-6">
                    <ProgressCard />
                    <DudiCard />
                </div>
            </div>

        </div>
    );
}