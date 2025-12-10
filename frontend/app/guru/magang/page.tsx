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
import { MagangTable } from "@/components/layout/guru/MagangTable";
import { CardStats } from "@/components/ui/CardStats";
import { useState, useEffect, useCallback } from "react";
import { MagangDashboardData } from "@/types/dashboard";
import { TambahMagangModal } from "@/components/layout/guru/create/TambahMagangModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

export default function MagangPage() {
  useAuth();

  const [statsData, setStatsData] = useState<MagangDashboardData>({
    total_siswa: 0,
    aktif: 0,
    selesai: 0,
    pending: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /** ======================
   * FETCH STATS MAGANG
   ====================== */
  const fetchMagangStats = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(`${API_URL}/guru/magang`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) return;

      const text = await response.text();
      if (!text) return;

      const result = JSON.parse(text);
      if (result.success) {
        setStatsData(result.data);
      }
    } catch {
      // silent fail, pakai state terakhir
    } finally {
      setLoading(false);
    }
  }, []);

  /** ======================
   * INITIAL LOAD
   ====================== */
  useEffect(() => {
    fetchMagangStats();
  }, [fetchMagangStats]);

  /** ======================
   * REALTIME MAGANG STATS
   ====================== */
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("magang-stats-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "magang" },
        (payload) => {
          // INSERT / DELETE → pasti refresh
          if (payload.eventType !== "UPDATE") {
            fetchMagangStats();
            return;
          }

          // UPDATE → hanya jika status berubah
          if (payload.new.status !== payload.old?.status) {
            fetchMagangStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMagangStats]);

  const handleSuccessAdd = () => {
    fetchMagangStats();
  };

  return (
    <div className="p-8">
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
          value={loading ? "..." : statsData.total_siswa}
          description="Siswa magang terdaftar"
          icon={User}
        />
        <CardStats
          title="Aktif"
          value={loading ? "..." : statsData.aktif}
          description="Sedang magang"
          icon={Building2}
        />
        <CardStats
          title="Selesai"
          value={loading ? "..." : statsData.selesai}
          description="Magang selesai"
          icon={CheckCircle}
        />
        <CardStats
          title="Pending"
          value={loading ? "..." : statsData.pending}
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
          <MagangTable />
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
