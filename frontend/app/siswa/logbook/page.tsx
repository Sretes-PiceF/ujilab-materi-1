// app/siswa/logbook/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LogbookTable } from "@/components/layout/siswa/LogbookTable";
import { supabase } from "@/lib/supabaseClient";

// ======================================================
// TYPE
// ======================================================
type StatusMagang =
  | "pending"
  | "diterima"
  | "ditolak"
  | "berlangsung"
  | "selesai"
  | "dibatalkan";

export default function LogbookPage() {
  const [statusMagang, setStatusMagang] = useState<StatusMagang>("pending");
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ✅ penanda loading hanya pertama kali
  const isFirstLoad = useRef(true);

  // ======================================================
  // FETCH STATUS MAGANG (initial + realtime safe)
  // ======================================================
  const fetchStatusMagang = useCallback(async () => {
    try {
      // ✅ loading hanya saat pertama kali
      if (isFirstLoad.current) {
        setLoading(true);
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Token tidak ditemukan");
        setStatusMagang("pending");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/magang/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal mengambil status magang`);
      }

      const result = await response.json();

      const validStatus: StatusMagang[] = [
        "pending",
        "diterima",
        "ditolak",
        "berlangsung",
        "selesai",
        "dibatalkan",
      ];

      const status: StatusMagang = validStatus.includes(
        result?.data?.status_magang
      )
        ? result.data.status_magang
        : "pending";

      setStatusMagang(status);
    } catch (error) {
      console.error("Error fetching status magang:", error);
      setStatusMagang("pending");
    } finally {
      // ✅ matikan loading hanya sekali
      if (isFirstLoad.current) {
        setLoading(false);
        isFirstLoad.current = false;
      }
    }
  }, []);

  // ======================================================
  // INITIAL LOAD
  // ======================================================
  useEffect(() => {
    fetchStatusMagang();
  }, [fetchStatusMagang]);

  // ======================================================
  // REALTIME (NO LOADING)
  // ======================================================
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("logbook-page-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "magang" },
        async () => {
          // ✅ silent refresh status
          await fetchStatusMagang();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "logbook" },
        async () => {
          // ✅ refresh table tanpa loading
          setRefreshTrigger((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStatusMagang]);

  // ======================================================
  // HELPERS
  // ======================================================
  const getStatusClass = (status: StatusMagang) => {
    switch (status) {
      case "berlangsung":
      case "selesai":
        return "bg-green-100 text-green-700 border border-green-200";

      case "ditolak":
      case "dibatalkan":
        return "bg-red-100 text-red-700 border border-red-200";

      case "diterima":
        return "bg-blue-800 text-white border border-blue-900";

      case "pending":
      default:
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    }
  };

  const getStatusLabel = (status: StatusMagang) => {
    switch (status) {
      case "berlangsung":
        return "Berlangsung";
      case "selesai":
        return "Selesai";
      case "diterima":
        return "Diterima";
      case "pending":
        return "Menunggu";
      case "ditolak":
        return "Ditolak";
      case "dibatalkan":
        return "Dibatalkan";
      default:
        return "Menunggu";
    }
  };

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logbook Harian</h1>
          <p className="text-gray-600 mt-1">
            Catat kegiatan dan kendala magang Anda setiap hari
          </p>
        </div>

        {/* Status Magang */}
        <div className="text-left sm:text-right">
          <p className="text-sm text-gray-600">Status Magang:</p>

          {loading ? (
            <div className="inline-flex items-center gap-2 mt-1">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              <span className="text-sm text-gray-500">Memuat...</span>
            </div>
          ) : (
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 transition-all ${getStatusClass(
                statusMagang
              )}`}
            >
              {getStatusLabel(statusMagang)}
            </span>
          )}
        </div>
      </div>

      <LogbookTable
        showAddButton={statusMagang === "berlangsung"}
        statusMagang={statusMagang}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
