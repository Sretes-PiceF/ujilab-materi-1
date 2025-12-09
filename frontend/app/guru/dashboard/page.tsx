"use client";

import { useEffect, useState, useCallback } from "react";
import { DudiCard } from "@/components/layout/guru/DudiCard";
import { LogbookCard } from "@/components/layout/guru/LogbookCard";
import { MagangCard } from "@/components/layout/guru/MagangCard";
import { ProgressCard } from "@/components/layout/guru/Progres";
import { CardStats } from "@/components/ui/CardStats";
import { useAuth } from "@/hooks/useAuth";
import { DashboardData } from "@/types/dashboard";
import { User, Building2, GraduationCap, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  useAuth();

  const [statsData, setStatsData] = useState<DashboardData>({
    total_siswa: 0,
    total_dudi: 0,
    siswa_magang: 0,
    logbook_hari_ini: 0,
  });
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();

      if (text) {
        const result = JSON.parse(text);

        if (result.success) {
          setStatsData(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching Dashboard stats:", error);
    } finally {
      setLoading(false);
      // Delay sedikit untuk content loading agar lebih smooth
      setTimeout(() => {
        setContentLoading(false);
      }, 300);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time subscription untuk update data Dashboard
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "siswa",
        },
        async () => {
          await fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "siswa",
        },
        async () => {
          await fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dudi",
        },
        async () => {
          await fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "dudi",
        },
        async () => {
          await fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "magang",
        },
        async () => {
          await fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "magang",
        },
        async (payload) => {
          if (payload.new.status !== payload.old?.status) {
            await fetchDashboardData();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "magang",
        },
        async () => {
          await fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "logbook",
        },
        async () => {
          await fetchDashboardData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "logbook",
        },
        async () => {
          await fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchDashboardData]);

  // Skeleton untuk content cards saja
  const ContentSkeleton = () => (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* MagangCard skeleton */}
        <div className="bg-white rounded-lg shadow-sm border animate-pulse">
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LogbookCard skeleton */}
        <div className="bg-white rounded-lg shadow-sm border animate-pulse">
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 space-y-6">
        {/* ProgressCard skeleton */}
        <div className="bg-white rounded-lg shadow-sm border animate-pulse">
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>

        {/* DudiCard skeleton */}
        <div className="bg-white rounded-lg shadow-sm border animate-pulse">
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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

      {/* GRID CARDS - TETAP PAKAI "..." */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <CardStats
          title="Total Siswa"
          value={loading ? "..." : statsData.total_siswa}
          description="Seluruh siswa terdaftar"
          icon={User}
        />

        <CardStats
          title="DUDI Partner"
          value={loading ? "..." : statsData.total_dudi}
          description="Perusahaan mitra"
          icon={Building2}
        />

        <CardStats
          title="Siswa Magang"
          value={loading ? "..." : statsData.siswa_magang}
          description="Sedang aktif magang"
          icon={GraduationCap}
        />

        <CardStats
          title="Logbook Hari Ini"
          value={loading ? "..." : statsData.logbook_hari_ini}
          description="Laporan masuk hari ini"
          icon={BookOpen}
        />
      </div>

      {/* CONTENT */}
      {contentLoading ? (
        <ContentSkeleton />
      ) : (
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
      )}
    </div>
  );
}
