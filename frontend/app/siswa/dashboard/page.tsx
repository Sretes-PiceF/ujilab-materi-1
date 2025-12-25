"use client";

import { useState, useEffect } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, LineChart, Line, PieChart, Pie, Cell, YAxis } from "recharts";

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

// Tipe untuk chart
type ChartType = "bar" | "line" | "pie";

// Warna yang konsisten untuk semua chart
const CHART_COLORS = {
  disetujui: "#10B981", // Green
  pending: "#F59E0B",  // Yellow/Amber
  ditolak: "#EF4444",  // Red
  grid: "#F3F4F6",     // Light gray
  text: "#6B7280",     // Gray
};

export default function DashboardSiswa() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [statistik, setStatistik] = useState<StatistikData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [totalLogbook, setTotalLogbook] = useState(0);

  useEffect(() => {
    // Load preferensi chart dari sessionStorage saat component mount
    const savedChartType = sessionStorage.getItem("chartPreference") as ChartType;
    if (savedChartType && ["bar", "line", "pie"].includes(savedChartType)) {
      setChartType(savedChartType);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("access_token");

        // Fetch data user
        const userResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost/api"}/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        if (userResponse.ok) {
          const result = await userResponse.json();
          if (result.success) {
            setUserData(result.data.user);
          }
        }

        // Fetch statistik status
        const statResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost/api"}/siswa/statistik`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        if (statResponse.ok) {
          const result = await statResponse.json();
          if (result.success) {
            setStatistik(result.data);
            // Hitung total logbook
            const total = result.data.disetujui + result.data.pending + result.data.ditolak;
            setTotalLogbook(total);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format data untuk bar chart
  const barChartData = statistik
    ? [
        { status: "Disetujui", jumlah: statistik.disetujui, color: CHART_COLORS.disetujui },
        { status: "Pending", jumlah: statistik.pending, color: CHART_COLORS.pending },
        { status: "Ditolak", jumlah: statistik.ditolak, color: CHART_COLORS.ditolak },
      ]
    : [
        { status: "Disetujui", jumlah: 0, color: CHART_COLORS.disetujui },
        { status: "Pending", jumlah: 0, color: CHART_COLORS.pending },
        { status: "Ditolak", jumlah: 0, color: CHART_COLORS.ditolak },
      ];

  // Format data untuk line chart - Vertical lines approach
  const lineChartData = statistik
    ? [
        { category: "Disetujui", value: statistik.disetujui, color: CHART_COLORS.disetujui },
        { category: "Pending", value: statistik.pending, color: CHART_COLORS.pending },
        { category: "Ditolak", value: statistik.ditolak, color: CHART_COLORS.ditolak },
      ]
    : [
        { category: "Disetujui", value: 0, color: CHART_COLORS.disetujui },
        { category: "Pending", value: 0, color: CHART_COLORS.pending },
        { category: "Ditolak", value: 0, color: CHART_COLORS.ditolak },
      ];

  // Data untuk pie chart
  const pieChartData = barChartData.map(item => ({
    ...item,
    // Hitung persentase jika total > 0
    percentage: totalLogbook > 0 
      ? ((item.jumlah / totalLogbook) * 100).toFixed(1) 
      : "0"
  }));

  // Config chart
  const chartConfig = {
    jumlah: {
      label: "Jumlah Logbook",
      color: "#0097BB",
    },
    value: {
      label: "Jumlah",
      color: "#0097BB",
    },
  } as const;

  // Handler untuk mengganti chart
  const handleChartChange = (type: ChartType) => {
    setChartType(type);
    // Simpan preferensi ke sessionStorage
    sessionStorage.setItem("chartPreference", type);
  };

  // Render label untuk pie chart dengan persentase
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Render chart berdasarkan tipe
  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <LineChart data={lineChartData}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={12}
              stroke={CHART_COLORS.text}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              fontSize={12}
              stroke={CHART_COLORS.text}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              formatter={(value: number) => [`${value} logbook`, "Jumlah"]}
            />
            {/* Single line connecting all points */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0097BB"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload, index } = props;
                return (
                  <circle
                    key={`dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={payload.color}
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        );
      
      case "pie":
        return (
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderPieLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="jumlah"
              nameKey="status"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip 
              content={<ChartTooltipContent />}
              formatter={(value: number, name: string) => {
                const item = pieChartData.find(item => item.status === name);
                return [`${value} (${item?.percentage}%)`, name];
              }}
            />
          </PieChart>
        );
      
      default: // bar chart
        return (
          <BarChart data={barChartData}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="status"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={12}
              stroke={CHART_COLORS.text}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              fontSize={12}
              stroke={CHART_COLORS.text}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />} 
              cursor={false}
              formatter={(value: number) => [`${value} logbook`, "Jumlah"]}
            />
            <Bar
              dataKey="jumlah"
              fill="var(--color-jumlah)"
              radius={[4, 4, 0, 0]}
              barSize={40}
            />
          </BarChart>
        );
    }
  };

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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Status Verifikasi Logbook
          </h2>
          
          {/* Tombol untuk ganti chart */}
          <div className="flex gap-2">
            <button
              onClick={() => handleChartChange("bar")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === "bar"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => handleChartChange("line")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === "line"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Line
            </button>
            <button
              onClick={() => handleChartChange("pie")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === "pie"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pie
            </button>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          {renderChart()}
        </ChartContainer>

        {/* Legend untuk line chart */}
        {chartType === "line" && (
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Disetujui</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-600">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">Ditolak</span>
            </div>
          </div>
        )}

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
          {totalLogbook}
        </p>
        <p className="text-sm text-blue-600 mt-2">
          Jumlah keseluruhan logbook yang telah Anda buat
        </p>
      </div>
    </div>
  );
}