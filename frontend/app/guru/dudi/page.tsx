// app/guru/dudi/page.tsx (Perbaikan Impor Komponen Shadcn/UI)

import { CardStats } from "@/components/ui/CardStats";
// --- TAMBAHKAN IMPOR INI DARI SHADCN/UI ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// ---

import { DudiTable } from "@/components/layout/guru/DudiTable";
import {
    User,
    Building2,
    GraduationCap,
    Plus,
} from "lucide-react";


export default function DudiPage() {
    return (
        <div className="p-8">
            {/* Header Halaman */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dudi</h1>
                <p className="text-gray-600 mt-1">
                    Kelola data industri dan perusahaan mitra magang siswa <span className="font-semibold">SIMNAS</span>
                </p>
            </div>

            {/* GRID CARDS STATS */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">

                <CardStats
                    title="Total DUDI"
                    value={55}
                    description="Total perusahaan terdaftar"
                    icon={Building2}
                />

                <CardStats
                    title="Total Siswa Magang"
                    value={150}
                    description="Seluruh siswa terdaftar"
                    icon={User}
                />

                <CardStats
                    title="Rata - Rata Siswa"
                    value={120}
                    description="Sedang aktif magang"
                    icon={GraduationCap}
                />
            </div>

            {/* -------------------- TABEL DUDI -------------------- */}

            {/* CARD TIDAK TERDEFINISI SEBELUMNYA, KINI SUDAH DIAMBIL DARI IMPOR */}
            <Card className="shadow-lg rounded-xl">
                <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                        <Building2 className="h-5 w-5 mr-2 text-cyan-600" /> Daftar Dudi
                    </CardTitle>

                    {/* TOMBOL TAMBAH DUDI */}
                    <Button
                        className="bg-[#0097BB] hover:bg-[#007b9e] text-white rounded-lg shadow-md transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah DUDI
                    </Button>

                </CardHeader>
                <CardContent className="p-6">
                    <DudiTable />
                </CardContent>
            </Card>

        </div>
    );
}