"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { LogbookItem } from "./LogbookItem";
import { useEffect, useState } from "react";
import PieChartCustom from "@/components/ui/charts/PieChartCustom";

interface StatistikStatus {
  disetujui: number;
  pending: number;
  ditolak: number;
}

export function LogbookCard() {
  const [logbook, setLogbook] = useState<any[]>([]);
  const [statusChart, setStatusChart] = useState<any[]>([]);
  const [statistik, setStatistik] = useState<StatistikStatus>({
    disetujui: 0,
    pending: 0,
    ditolak: 0,
  });

  useEffect(() => {
    const fetchLogbook = async () => {
      try {
        // ✅ Perbaikan: Tambahkan parameter tanggal hari ini
        const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/logbook?tanggal=${today}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        const result = await res.json();
        if (!result.success) return;

        const statistikStatus: StatistikStatus = result.data.statistik_status;
        const logbookTerbaru = result.data.logbook_terbaru;

        // 🎯 Format Pie Chart dengan warna
        const pieData = [
          {
            name: "Disetujui",
            value: statistikStatus.disetujui,
            fill: "#22c55e", // green-500
          },
          {
            name: "Pending",
            value: statistikStatus.pending,
            fill: "#f59e0b", // amber-500
          },
          {
            name: "Ditolak",
            value: statistikStatus.ditolak,
            fill: "#ef4444", // red-500
          },
        ];

        const filteredPieData = pieData.filter((item) => item.value > 0);

        setStatusChart(filteredPieData);
        setStatistik(statistikStatus);
        setLogbook(logbookTerbaru);
      } catch (error) {
        console.error("Gagal memuat data logbook:", error);
      }
    };

    fetchLogbook();
  }, []);

  // Hitung total untuk persentase
  const total = statistik.disetujui + statistik.pending + statistik.ditolak;

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="py-4 px-6 border-b">
        <CardTitle className="flex items-center text-base font-semibold text-gray-900">
          <BookOpen className="h-4 w-4 mr-2 text-green-600" />
          Statistik Logbook Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* ==========================📊 PIE CHART STATUS=========================== */}
        <div>
          <h2 className="text-sm font-medium mb-3 text-gray-700">
            Status Verifikasi
          </h2>

          {/* Pie Chart */}
          {total > 0 ? (
            <>
              <PieChartCustom data={statusChart} />

              {/* Keterangan di bawah chart */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Disetujui
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">
                      {statistik.disetujui}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      (
                      {total > 0
                        ? ((statistik.disetujui / total) * 100).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Pending
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">
                      {statistik.pending}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      (
                      {total > 0
                        ? ((statistik.pending / total) * 100).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Ditolak
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">
                      {statistik.ditolak}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      (
                      {total > 0
                        ? ((statistik.ditolak / total) * 100).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      Total
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {total}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              Belum ada data logbook hari ini.
            </p>
          )}
        </div>

        {/* ==========================📝 LIST LOGBOOK TERBARU =========================== */}
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <h2 className="text-sm font-medium mb-3 text-gray-700">
            Logbook Terbaru
          </h2>
          {logbook.length === 0 ? (
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
