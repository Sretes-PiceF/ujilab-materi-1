"use client";

import { DudiCard } from "@/components/layout/guru/DudiCard";
import { LogbookCard } from "@/components/layout/guru/LogbookCard";
import { MagangCard } from "@/components/layout/guru/MagangCard";
import { ProgressCard } from "@/components/layout/guru/Progres";
import { CardStats } from "@/components/ui/CardStats";
import { useAuth } from "@/hooks/useAuth";
import { DashboardData } from "@/types/dashboard";
import { User, Building2, GraduationCap, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  useAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    total_siswa: 0,
    total_dudi: 0,
    siswa_magang: 0,
    logbook_hari_ini: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      // Fetch data langsung dari API
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/dashboard`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      console.log("Dashboard Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log("Dashboard Raw response:", text);

      // Coba parse JSON hanya jika text tidak kosong
      if (text) {
        const result = JSON.parse(text);

        if (result.success) {
          setDashboardData(result.data);
        } else {
          console.error("Dashboard API returned error:", result.message);
        }
      }
    } catch (error) {
      console.error("Error fetching Dashboard stats:", error);
      // Tetap gunakan default values (0) jika error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="p-8">
      {/* Header Dashboard */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Selamat datang di dashboard guru{" "}
          <span className="font-semibold">SIMNAS</span>
        </p>
      </div>

      {/* GRID CARDS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <CardStats
          title="Total Siswa"
          value={loading ? "..." : dashboardData.total_siswa}
          description="Seluruh siswa terdaftar"
          icon={User}
        />

        <CardStats
          title="DUDI Partner"
          value={loading ? "..." : dashboardData.total_dudi}
          description="Perusahaan mitra"
          icon={Building2}
        />

        <CardStats
          title="Siswa Magang"
          value={loading ? "..." : dashboardData.siswa_magang}
          description="Sedang aktif magang"
          icon={GraduationCap}
        />

        <CardStats
          title="Logbook Hari Ini"
          value={loading ? "..." : dashboardData.logbook_hari_ini}
          description="Laporan masuk hari ini"
          icon={BookOpen}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Magang & Logbook Terbaru */}
        <div className="lg:col-span-2 space-y-6">
          <MagangCard />
          <LogbookCard />
        </div>

        {/* Kolom Kanan: Progress & DUDI Aktif */}
        <div className="lg:col-span-1 space-y-6">
          <ProgressCard />
          <DudiCard />
        </div>
      </div>
    </div>
  );
}
