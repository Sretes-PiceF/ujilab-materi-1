"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar1,
  CheckCircle,
  Plus,
  User,
  UsersRound,
  Building2,
} from "lucide-react";
import MagangTable from "@/components/layout/guru/MagangTable";
import { CardStats } from "@/components/ui/CardStats";
import { useState, useEffect, useMemo, useCallback } from "react";
import { TambahMagangModal } from "@/components/layout/guru/create/TambahMagangModal";
import { useAuth } from "@/hooks/useAuth";
import { useMagangBatch } from "@/hooks/useMagang";

export default function MagangPage() {
  useAuth();

  // 🎯 Batch hook - dapat semua data SEKALI SAJA
  const { stats, magang, siswa, isLoading, isCached } = useMagangBatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [optimisticMagang, setOptimisticMagang] = useState<any[]>([]);
  const [optimisticStats, setOptimisticStats] = useState<any>(null);

  // ✅ INISIALISASI DATA: Ambil dari server sekali saat load
  useEffect(() => {
    // hanya set sekali saat pertama kali data ada
    if (optimisticMagang.length === 0 && magang?.length) {
      setOptimisticMagang(magang);
    }

    if (!optimisticStats && stats) {
      setOptimisticStats(stats);
    }
  }, [magang, stats]);

  // ✅ CALLBACK UNTUK UPDATE DATA DARI TABLE (REALTIME)
  const handleDataUpdated = useCallback((updatedMagang: any[]) => {
    // Update data magang
    setOptimisticMagang(updatedMagang);

    // Update stats berdasarkan data terbaru
    const newStats = {
      total_siswa: updatedMagang.length,
      aktif: updatedMagang.filter((m) => m.status === "berlangsung").length,
      selesai: updatedMagang.filter((m) => m.status === "selesai").length,
      pending: updatedMagang.filter((m) => m.status === "pending").length,
    };
    setOptimisticStats(newStats);
  }, []);

  const handleSuccessAdd = () => {
    // Modal akan menutup sendiri, refresh akan dilakukan oleh MagangTable via realtime
    setIsModalOpen(false);
  };

  // ✅ COMPUTED STATS: Gunakan optimisticStats jika ada
  const displayStats = useMemo(() => {
    return optimisticStats || stats;
  }, [optimisticStats, stats]);

  return (
    <div className="p-8">
      {/* Cache Indicator */}
      {isCached && (
        <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center">
          <span className="mr-2">⚡</span>
          Data dimuat dari cache Redis (super cepat!)
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Data Siswa Magang</h1>
        <p className="text-gray-600 mt-1">
          Kelola data, status, dan nilai magang seluruh siswa.
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <CardStats
          title="Total Siswa"
          value={isLoading ? "..." : displayStats?.total_siswa || 0}
          description="Siswa magang terdaftar"
          icon={User}
        />
        <CardStats
          title="Aktif"
          value={isLoading ? "..." : displayStats?.aktif || 0}
          description="Sedang magang"
          icon={Building2}
        />
        <CardStats
          title="Selesai"
          value={isLoading ? "..." : displayStats?.selesai || 0}
          description="Magang selesai"
          icon={CheckCircle}
        />
        <CardStats
          title="Pending"
          value={isLoading ? "..." : displayStats?.pending || 0}
          description="Menunggu penempatan"
          icon={Calendar1}
        />
      </div>

      {/* TABEL */}
      <Card className="shadow-lg rounded-xl border-0">
        <CardHeader className="py-4 px-6 border-b bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl font-semibold">
              <UsersRound className="h-5 w-5 mr-2 text-cyan-600" />
              Daftar Siswa Magang
            </CardTitle>

            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#0097BB] hover:bg-[#007b9e] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Siswa
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <MagangTable
            magangData={optimisticMagang}
            siswaData={siswa}
            // Kirim callback untuk update data ke parent (page)
            onDataUpdated={handleDataUpdated}
          />
        </CardContent>
      </Card>

      <TambahMagangModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleSuccessAdd}
      />
    </div>
  );
}
