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

    useEffect(() => {
        const fetchLogbook = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/logbook`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    },
                });

                const result = await res.json();
                if (!result.success) return;

                const statistikStatus: StatistikStatus = result.data.statistik_status;
                const logbookTerbaru = result.data.logbook_terbaru;

                // 🎯 Format Pie Chart (sesuai backend Laravel)
                const pieData = [
                    { name: "Disetujui", value: statistikStatus.disetujui },
                    { name: "Pending", value: statistikStatus.pending },
                    { name: "Ditolak", value: statistikStatus.ditolak },
                ];

                const filteredPieData = pieData.filter(item => item.value > 0);
                setStatusChart(filteredPieData);
                setLogbook(logbookTerbaru);

            } catch (error) {
                console.error("Gagal memuat data logbook:", error);
            }
        };

        fetchLogbook();
    }, []);

    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader className="py-4 px-6 border-b">
                <CardTitle className="flex items-center text-base font-semibold text-gray-900">
                    <BookOpen className="h-4 w-4 mr-2 text-green-600" />
                    Statistik Logbook & Terbaru
                </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-6">

                {/* ==========================
                   📊 PIE CHART STATUS
                =========================== */}
                <div>
                    <h2 className="text-sm font-medium mb-2">Status Verifikasi</h2>
                    <PieChartCustom data={statusChart} />
                </div>

                {/* ==========================
                   📝 LIST LOGBOOK TERBARU
                =========================== */}
                <div className="space-y-2">
                    {logbook.length === 0 ? (
                        <p className="text-sm text-gray-500">Belum ada logbook.</p>
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
