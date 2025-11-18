// app/guru/magang/page.tsx

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, UsersRound } from "lucide-react";
import { MagangTable } from "@/components/layout/guru/MagangTable"; // Komponen Tabel Magang yang akan kita buat

export default function MagangPage() {
    return (
        <div className="p-8">
            {/* Header Halaman */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Data Siswa Magang</h1>
                <p className="text-gray-600 mt-1">
                    Kelola data, status, dan nilai magang seluruh siswa.
                </p>
            </div>

            {/* Card Tabel Magang */}
            <Card className="shadow-lg rounded-xl">
                <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                        <UsersRound className="h-5 w-5 mr-2 text-cyan-600" /> Daftar Siswa Magang
                    </CardTitle>

                    {/* TOMBOL TAMBAH SISWA */}
                    <Button
                        className="bg-[#0097BB] hover:bg-[#007b9e] text-white rounded-lg shadow-md transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Siswa
                    </Button>

                </CardHeader>
                <CardContent className="p-6">
                    {/* Tabel Siswa Magang dimuat di sini */}
                    <MagangTable />
                </CardContent>
            </Card>
        </div>
    );
}