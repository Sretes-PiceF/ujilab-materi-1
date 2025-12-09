"use client";

import { CardStats } from "@/components/ui/CardStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DudiTable } from "@/components/layout/guru/DudiTable";
import { TambahDudiModal } from "@/components/layout/guru/create/TambahDudiModal";
import { User, Building2, Plus, Building } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { DudiDashboardData } from "@/types/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

export default function DudiPage() {
  useAuth();

  const [statsData, setStatsData] = useState<DudiDashboardData>({
    dudi_aktif: 0,
    siswa_magang_aktif: 0,
    rata_rata_siswa_perusahaan: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /** ======================
   * FETCH STATS DUDI
   ====================== */
  const fetchDudiStats = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(`${API_URL}/guru/dudi`, {
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
      // silent error (state lama tetap dipakai)
    } finally {
      setLoading(false);
    }
  }, []);

  /** ======================
   * INITIAL LOAD
   ====================== */
  useEffect(() => {
    fetchDudiStats();
  }, [fetchDudiStats]);

  /** ======================
   * REALTIME DUDI
   ====================== */
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("dudi-stats-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dudi" },
        () => {
          fetchDudiStats();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "magang" },
        () => {
          // Karena siswa_magang_aktif & rata-rata tergantung magang
          fetchDudiStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDudiStats]);

  const handleSuccessAdd = () => {
    fetchDudiStats();
  };

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">DUDI</h1>
        <p className="text-gray-600 mt-1">
          Kelola data industri dan perusahaan mitra magang siswa{" "}
          <span className="font-semibold">SIMNAS</span>
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
        <CardStats
          title="Total DUDI"
          value={loading ? "..." : statsData.dudi_aktif}
          description="Total perusahaan terdaftar"
          icon={Building2}
        />
        <CardStats
          title="Total Siswa Magang"
          value={loading ? "..." : statsData.siswa_magang_aktif}
          description="Seluruh siswa terdaftar"
          icon={User}
        />
        <CardStats
          title="Rata-rata Siswa"
          value={loading ? "..." : statsData.rata_rata_siswa_perusahaan}
          description="Per perusahaan"
          icon={Building}
        />
      </div>

      {/* TABLE */}
      <Card className="shadow-sm rounded-lg border-0">
        <CardHeader className="py-4 px-6 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl font-semibold">
              <Building2 className="h-5 w-5 mr-2 text-cyan-600" />
              Daftar DUDI
            </CardTitle>

            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#0097BB] hover:bg-[#007b9e] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah DUDI
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <DudiTable />
        </CardContent>
      </Card>

      <TambahDudiModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleSuccessAdd}
      />
    </div>
  );
}
