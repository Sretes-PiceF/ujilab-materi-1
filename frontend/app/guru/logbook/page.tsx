"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardStats } from "@/components/ui/CardStats";
import LogbookTable from "@/components/layout/guru/LogbookTable";
import { ThumbsUp, ThumbsDown, BookOpen, Clock } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLogbookBatch, LogbookEntry } from "@/hooks/useLogbook";

export default function LogBookPage() {
  useAuth();

  // 🎯 Batch hook - dapat semua data SEKALI SAJA
  const { stats, logbook, isLoading } = useLogbookBatch();

  const [optimisticLogbook, setOptimisticLogbook] = useState<LogbookEntry[]>([]);
  const [optimisticStats, setOptimisticStats] = useState<any>(null);

  // ✅ INISIALISASI DATA: Ambil dari server sekali saat load
  useEffect(() => {
    // hanya set sekali saat pertama kali data ada
    if (optimisticLogbook.length === 0 && logbook?.length) {
      setOptimisticLogbook(logbook);
    }

    if (!optimisticStats && stats) {
      setOptimisticStats(stats);
    }
  }, [logbook, stats]);

  // ✅ CALLBACK UNTUK UPDATE DATA DARI TABLE (REALTIME)
  const handleDataUpdated = useCallback((updatedLogbook: LogbookEntry[]) => {
    // Update data logbook
    setOptimisticLogbook(updatedLogbook);

    // Update stats berdasarkan data terbaru
    const newStats = {
      total_logbook: updatedLogbook.length,
      belum_diverifikasi: updatedLogbook.filter(
        (log) => log.status_verifikasi === "pending"
      ).length,
      disetujui: updatedLogbook.filter((log) => log.status_verifikasi === "disetujui")
        .length,
      ditolak: updatedLogbook.filter((log) => log.status_verifikasi === "ditolak").length,
    };
    setOptimisticStats(newStats);
  }, []);

  // ✅ COMPUTED STATS: Gunakan optimisticStats jika ada
  const displayStats = useMemo(() => {
    return optimisticStats || stats;
  }, [optimisticStats, stats]);

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manajemen Logbook Magang</h1>
        <p className="text-gray-600 mt-1">
          Kelola dan verifikasi laporan harian kegiatan siswa magang
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <CardStats
          title="Total Logbook"
          value={isLoading ? "..." : displayStats?.total_logbook || 0}
          description="Keseluruhan catatan harian"
          icon={BookOpen}
        />
        <CardStats
          title="Belum Diverifikasi"
          value={isLoading ? "..." : displayStats?.belum_diverifikasi || 0}
          description="Menunggu verifikasi"
          icon={Clock}
        />
        <CardStats
          title="Disetujui"
          value={isLoading ? "..." : displayStats?.disetujui || 0}
          description="Telah terverifikasi"
          icon={ThumbsUp}
        />
        <CardStats
          title="Ditolak"
          value={isLoading ? "..." : displayStats?.ditolak || 0}
          description="Perlu perbaikan"
          icon={ThumbsDown}
        />
      </div>

      {/* TABEL */}
      <Card className="shadow-lg rounded-xl border-0">
        <CardHeader className="py-4 px-6 border-b bg-gray-50/50 rounded-t-xl">
          <CardTitle className="flex items-center text-xl font-semibold">
            <BookOpen className="h-5 w-5 mr-2 text-cyan-600" />
            Daftar Logbook Harian
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <LogbookTable
            logbookData={optimisticLogbook}
            // Kirim callback untuk update data ke parent (page)
            onDataUpdated={handleDataUpdated}
          />
        </CardContent>
      </Card>
    </div>
  );
}