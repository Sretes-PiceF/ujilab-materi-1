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
import { useState, useEffect } from "react";
import { MagangDashboardData } from "@/types/dashboard";
import { TambahMagangModal } from "@/components/layout/guru/create/TambahMagangModal";
import { useAuth } from "@/hooks/useAuth";

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

  const fetchMagangStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      // Sesuaikan dengan route backend untuk data magang
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

      console.log("Magang Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log("Magang Raw response:", text);

      // Coba parse JSON hanya jika text tidak kosong
      if (text) {
        const result = JSON.parse(text);

        if (result.success) {
          setStatsData(result.data);
        } else {
          console.error("Magang API returned error:", result.message);
        }
      }
    } catch (error) {
      console.error("Error fetching Magang stats:", error);
      // Tetap gunakan default values (0) jika error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMagangStats();
  }, []);

  const handleSuccessAdd = () => {
    fetchMagangStats();
  };

  return (
    <div className="p-8">
      {/* Header Halaman */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Data Siswa Magang</h1>
        <p className="text-gray-600 mt-1">
          Kelola data, status, dan nilai magang seluruh siswa.
        </p>
      </div>

      {/* GRID CARDS - SUDAH DIRAPIKAN */}
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

      {/* Card Tabel Magang */}
      <Card className="shadow-lg rounded-xl border-0">
        <CardHeader className="py-4 px-6 border-b bg-gray-50/50 rounded-t-xl">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
              <UsersRound className="h-5 w-5 mr-2 text-cyan-600" />
              Daftar Siswa Magang
            </CardTitle>

            {/* TOMBOL TAMBAH SISWA */}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#0097BB] hover:bg-[#007b9e] text-white rounded-lg shadow-md transition-colors px-4 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Siswa
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Tabel Siswa Magang dimuat di sini */}
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
