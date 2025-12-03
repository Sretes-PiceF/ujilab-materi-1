// app/siswa/logbook/page.tsx - Simplified
"use client";
import { useState, useEffect } from "react";
import { LogbookTable } from "@/components/layout/siswa/LogbookTable";
import { LogbookData } from "@/hooks/siswa/useLogbook";

// Type untuk status magang berdasarkan ENUM
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

  useEffect(() => {
    fetchStatusMagang();
  }, []);

  const fetchStatusMagang = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Token tidak ditemukan");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/magang/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal mengambil status magang: ${response.status}`);
      }

      const result = await response.json();

      let status: StatusMagang = "pending";

      if (result.success && result.data) {
        const validStatus: StatusMagang[] = [
          "pending",
          "diterima",
          "ditolak",
          "berlangsung",
          "selesai",
          "dibatalkan",
        ];
        status = validStatus.includes(result.data.status_magang)
          ? result.data.status_magang
          : "pending";
      }

      setStatusMagang(status);
    } catch (error) {
      console.error("Error fetching status magang:", error);
      setStatusMagang("pending");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (logbook: LogbookData) => {
    console.log("View detail logbook:", logbook);
  };

  const handleEdit = (logbook: LogbookData) => {
    console.log("Edit logbook:", logbook);
  };

  const handleDelete = (logbook: LogbookData) => {
    console.log("Delete logbook:", logbook);
    // Trigger refresh setelah delete
    setRefreshTrigger((prev) => prev + 1);
  };

  // Fungsi untuk mendapatkan class CSS berdasarkan status
  const getStatusClass = (status: StatusMagang) => {
    switch (status) {
      case "berlangsung":
        return "bg-green-100 text-green-700 border border-green-200";
      case "selesai":
        return "bg-gray-100 text-gray-700 border border-gray-200";
      case "diterima":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "ditolak":
      case "dibatalkan":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    }
  };

  // Fungsi untuk mendapatkan label status
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Memuat halaman logbokk...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logbook Harian</h1>
          <p className="text-gray-600 mt-1">
            Catat kegiatan dan kendala magang Anda setiap hari
          </p>
        </div>

        {/* Info Status Magang */}
        <div className="text-left sm:text-right">
          <p className="text-sm text-gray-600">Status Magang:</p>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${getStatusClass(
              statusMagang
            )}`}
          >
            {getStatusLabel(statusMagang)}
          </span>
        </div>
      </div>

      {/* LogbookTable Component dengan modal terintegrasi */}
      <LogbookTable
        showAddButton={statusMagang === "berlangsung"}
        statusMagang={statusMagang}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
