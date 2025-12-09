"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { LogbookItem } from "./LogbookItem";
import PieChartCustom from "@/components/ui/charts/PieChartCustom";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabaseClient";

/* ===================== TYPES ===================== */

interface StatistikStatus {
  disetujui: number;
  pending: number;
  ditolak: number;
}

interface LogbookItemType {
  id: number;
  kegiatan: string;
  kendaraan?: string;
  status_verifikasi: "disetujui" | "pending" | "ditolak";
  tanggal_formatted: string;
  kendala?: string;
}

interface PieItem {
  name: string;
  value: number;
  fill: string;
}

/* ===================== COMPONENT ===================== */

export function LogbookCard() {
  const [logbook, setLogbook] = useState<LogbookItemType[]>([]);
  const [statusChart, setStatusChart] = useState<PieItem[]>([]);
  const [statistik, setStatistik] = useState<StatistikStatus>({
    disetujui: 0,
    pending: 0,
    ditolak: 0,
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  /* ===================== FETCH ===================== */
  const fetchLogbook = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard/logbook?tanggal=${today}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (!res.ok) return;

      const result = await res.json();
      if (!result.success) return;

      const statistikStatus: StatistikStatus = result.data.statistik_status;
      const logbookTerbaru: LogbookItemType[] = result.data.logbook_terbaru;

      const pieData: PieItem[] = [
        {
          name: "Disetujui",
          value: statistikStatus.disetujui,
          fill: "#22c55e",
        },
        { name: "Pending", value: statistikStatus.pending, fill: "#f59e0b" },
        { name: "Ditolak", value: statistikStatus.ditolak, fill: "#ef4444" },
      ].filter((item) => item.value > 0);

      setStatistik(statistikStatus);
      setStatusChart(pieData);
      setLogbook(logbookTerbaru);
    } catch {
      // diam aja → UX > console noise
    } finally {
      if (!hasLoadedOnce.current) {
        setInitialLoading(false);
        hasLoadedOnce.current = true;
      }
    }
  }, []);

  /* ===================== FIRST LOAD ===================== */
  useEffect(() => {
    fetchLogbook();
  }, [fetchLogbook]);

  /* ===================== REALTIME ===================== */
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("logbook-card-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "logbook" },
        fetchLogbook
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogbook]);

  const total = statistik.disetujui + statistik.pending + statistik.ditolak;

  /* ===================== UI ===================== */
  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="py-4 px-6 border-b">
        <CardTitle className="flex items-center text-base font-semibold text-gray-900">
          <BookOpen className="h-4 w-4 mr-2 text-green-600" />
          Statistik Logbook Hari Ini
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-6">
        {/* ================= PIE CHART ================= */}
        <div>
          <h2 className="text-sm font-medium mb-3 text-gray-700">
            Status Verifikasi
          </h2>

          {initialLoading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : total > 0 ? (
            <PieChartCustom data={statusChart} />
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              Belum ada data logbook hari ini.
            </p>
          )}
        </div>

        {/* ================= LOGBOOK LIST ================= */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          <h2 className="text-sm font-medium mb-3 text-gray-700">
            Logbook Terbaru
          </h2>

          {initialLoading ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : logbook.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada logbook hari ini.</p>
          ) : (
            logbook.map((item) => (
              <LogbookItem
                key={item.id}
                kegiatan={item.kegiatan}
                tanggal={item.tanggal_formatted}
                kendala={item.kendala}
                status={item.status_verifikasi}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
