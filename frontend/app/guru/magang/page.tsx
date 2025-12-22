"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useState, useMemo } from "react";
import { TambahMagangModal } from "@/components/layout/guru/create/TambahMagangModal";
import { useAuth } from "@/hooks/useAuth";
import { useMagangBatch } from "@/hooks/useMagang";

export default function MagangPage() {
  useAuth();

  const { stats, isLoading, isCached, isValidating } = useMagangBatch();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStats, setCurrentStats] = useState(stats);

  // ✅ Update stats dari MagangTable
  const handleStatsUpdated = (newStats: any) => {
    setCurrentStats(newStats);
  };

  const handleSuccessAdd = () => {
    setIsModalOpen(false);
  };

  // ✅ Gunakan stats dari MagangTable atau dari server
  const displayStats = useMemo(() => {
    return currentStats || stats || {
      total_siswa: 0,
      aktif: 0,
      selesai: 0,
      pending: 0,
    };
  }, [currentStats, stats]);

  return (
    <div className="p-8">
      {/* HEADER - TIDAK PERLU SKELETON */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Data Siswa Magang</h1>
            <p className="text-gray-600 mt-1">
              Kelola data, status, dan nilai magang seluruh siswa.
            </p>
          </div>
          {!isLoading && (
            <div className="flex items-center gap-2 text-sm">
              <div className={`h-2 w-2 rounded-full ${isCached ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <span className="text-gray-500">
                {isValidating ? "Memperbarui..." : isCached ? "Cache" : "Realtime"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* STATS CARDS - HANYA INI YANG PERLU SKELETON */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {isLoading ? (
          // Loading state dengan skeleton warna abu-abu HANYA UNTUK STATS
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-24 bg-gray-300" />
                  <Skeleton className="h-8 w-16 bg-gray-300" />
                  <Skeleton className="h-3 w-36 bg-gray-300" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full bg-gray-300" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-20 bg-gray-300" />
                  <Skeleton className="h-8 w-14 bg-gray-300" />
                  <Skeleton className="h-3 w-32 bg-gray-300" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full bg-gray-300" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-22 bg-gray-300" />
                  <Skeleton className="h-8 w-14 bg-gray-300" />
                  <Skeleton className="h-3 w-34 bg-gray-300" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full bg-gray-300" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-24 bg-gray-300" />
                  <Skeleton className="h-8 w-12 bg-gray-300" />
                  <Skeleton className="h-3 w-36 bg-gray-300" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full bg-gray-300" />
              </div>
            </div>
          </>
        ) : (
          // Loaded state dengan data
          <>
            <CardStats
              title="Total Siswa"
              value={displayStats.total_siswa}
              description="Siswa magang terdaftar"
              icon={User}
            />
            <CardStats
              title="Aktif"
              value={displayStats.aktif}
              description="Sedang magang"
              icon={Building2}
            />
            <CardStats
              title="Selesai"
              value={displayStats.selesai}
              description="Magang selesai"
              icon={CheckCircle}
            />
            <CardStats
              title="Pending"
              value={displayStats.pending}
              description="Menunggu penempatan"
              icon={Calendar1}
            />
          </>
        )}
      </div>

      {/* TABEL - TOMBOL DAN JUDUL TIDAK PERLU SKELETON */}
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
          {/* MagangTable akan handle loading state sendiri */}
          <MagangTable
            onStatsUpdated={handleStatsUpdated}
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