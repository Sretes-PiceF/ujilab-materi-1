// app/siswa/dudi/page.tsx
"use client";
import { DudiTable } from '@/components/layout/siswa/DudiTable';

export default function DudiPage() {
    const handleApply = (dudiId: number) => {
        console.log('Mendaftar ke DUDI dengan ID:', dudiId);
        // Implementasi logika pendaftaran
    };

    const handleViewDetail = (dudi: any) => {
        console.log('Melihat detail DUDI:', dudi);
        // Implementasi buka modal detail DUDI
    };

    return (
        <div className="p-8">
            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Cari Tempat Magang</h1>
            <p className="text-gray-600 mb-6">
                Jelajahi perusahaan mitra dan daftarkan diri Anda untuk program magang
            </p>

            {/* Komponen Dudi Table */}
            <DudiTable
                onApply={handleApply}
                onViewDetail={handleViewDetail}
            />
        </div>
    );
}