'use client';

import { CardStats } from "@/components/ui/CardStats";
import { LogbookTable } from "@/components/layout/guru/LogbookTable";
import {
    ThumbsUp,
    ThumbsDown,
    BookOpen,
    Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

// Interface untuk data stats logbook
interface LogbookStatsData {
    total_logbook: number;
    belum_diverifikasi: number;
    disetujui: number;
    ditolak: number;
}

export default function LogBookPage() {
useAuth();

    const [statsData, setStatsData] = useState<LogbookStatsData>({
        total_logbook: 0,
        belum_diverifikasi: 0,
        disetujui: 0,
        ditolak: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchLogbookStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');

            // Sesuaikan dengan route backend untuk data logbook stats
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/guru/logbook`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            console.log('Logbook Stats Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            console.log('Logbook Stats Raw response:', text);

            // Coba parse JSON hanya jika text tidak kosong
            if (text) {
                const result = JSON.parse(text);

                if (result.success) {
                    setStatsData(result.data);
                } else {
                    console.error('Logbook Stats API returned error:', result.message);
                }
            }

        } catch (error) {
            console.error('Error fetching Logbook stats:', error);
            // Tetap gunakan default values (0) jika error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogbookStats();
    }, []);

    return (
        <div className="p-8">
            {/* 1. HEADER HALAMAN */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Manajemen Logbook Magang</h1>
                <p className="text-gray-600 mt-1">
                    Kelola dan verifikasi laporan harian kegiatan siswa magang <span className="font-semibold">SIMNAS</span>
                </p>
            </div>

            {/* 2. GRID CARDS STATS */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
                <CardStats
                    title="Total Logbook"
                    value={loading ? "..." : statsData.total_logbook}
                    description="Keseluruhan catatan harian"
                    icon={BookOpen}
                />

                <CardStats
                    title="Belum Diverifikasi"
                    value={loading ? "..." : statsData.belum_diverifikasi}
                    description="Menunggu verifikasi"
                    icon={Clock}
                />

                <CardStats
                    title="Disetujui"
                    value={loading ? "..." : statsData.disetujui}
                    description="Telah terverifikasi"
                    icon={ThumbsUp}
                />

                <CardStats
                    title="Ditolak"
                    value={loading ? "..." : statsData.ditolak}
                    description="Perlu perbaikan"
                    icon={ThumbsDown}
                />
            </div>

            {/* 3. KOMPONEN TABEL LOGBOOK */}
            <LogbookTable />
        </div>
    );
}