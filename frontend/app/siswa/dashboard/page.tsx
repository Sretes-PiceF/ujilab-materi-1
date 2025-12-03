"use client";

import { useState, useEffect } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis } from "recharts";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface StatistikData {
  disetujui: number;
  pending: number;
  ditolak: number;
}

export default function DashboardSiswa() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [statistik, setStatistik] = useState<StatistikData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("access_token");

        // Fetch data user
        const userResponse = await fetch("http://localhost:8000/api/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (userResponse.ok) {
          const result = await userResponse.json();
          if (result.success) {
            setUserData(result.data.user);
          }
        }

        // Fetch statistik status
        const statResponse = await fetch(
          "http://localhost:8000/api/siswa/statistik",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (statResponse.ok) {
          const result = await statResponse.json();
          if (result.success) {
            setStatistik(result.data);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [loading]);

  // Format data untuk chart
  const chartData = statistik
    ? [
        { status: "Disetujui", jumlah: statistik.disetujui },
        { status: "Pending", jumlah: statistik.pending },
        { status: "Ditolak", jumlah: statistik.ditolak },
      ]
    : [
        { status: "Disetujui", jumlah: 0 },
        { status: "Pending", jumlah: 0 },
        { status: "Ditolak", jumlah: 0 },
      ];

  // Config chart
  const chartConfig = {
    jumlah: {
      label: "Jumlah Logbook",
      color: "#0097BB",
    },
  } as const;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {userData?.name || "Siswa"}!
        </h1>
        <p className="text-gray-600 mt-1">Statistik logbook magang Anda</p>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Status Verifikasi Logbook
        </h2>

        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="status"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={12}
              stroke="#6b7280"
            />
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
            <Bar
              dataKey="jumlah"
              fill="var(--color-jumlah)"
              radius={[4, 4, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ChartContainer>

        {/* Statistik Detail */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">
              {statistik?.disetujui || 0}
            </p>
            <p className="text-sm text-green-600">Disetujui</p>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-700">
              {statistik?.pending || 0}
            </p>
            <p className="text-sm text-yellow-600">Pending</p>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-700">
              {statistik?.ditolak || 0}
            </p>
            <p className="text-sm text-red-600">Ditolak</p>
          </div>
        </div>
      </div>

      {/* Total Logbook */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Total Logbook
        </h3>
        <p className="text-4xl font-bold text-blue-700">
          {(statistik?.disetujui || 0) +
            (statistik?.pending || 0) +
            (statistik?.ditolak || 0)}
        </p>
        <p className="text-sm text-blue-600 mt-2">
          Jumlah keseluruhan logbook yang telah Anda buat
        </p>
      </div>
    </div>
  );
}
