// app/siswa/logbook/page.tsx
"use client";
import { LogbookTable } from '@/components/layout/siswa/LogbookTable';

export default function LogbookPage() {
    // Handler untuk aksi-aksi logbook
    const handleAddLogbook = () => {
        console.log('Membuka form tambah logbook');
        // Implementasi buka modal/form tambah logbook
    };

    const handleViewDetail = (logbook: any) => {
        console.log('Melihat detail logbook:', logbook);
        // Implementasi buka modal detail
    };

    const handleEdit = (logbook: any) => {
        console.log('Edit logbook:', logbook);
        // Implementasi buka modal edit
    };

    const handleDelete = (logbook: any) => {
        if (confirm(`Apakah Anda yakin ingin menghapus logbook tanggal ${logbook.date}?`)) {
            console.log('Hapus logbook:', logbook);
            // Implementasi delete logbook
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Logbook Magang Saya</h1>
            <p className="text-gray-600 mb-6">
                Catat kegiatan harian dan kendala yang Anda hadapi selama magang
            </p>

            {/* Komponen Logbook Table */}
            <LogbookTable
                onAddLogbook={handleAddLogbook}
                onViewDetail={handleViewDetail}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
}