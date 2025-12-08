"use client";
import { useAuth } from "@/hooks/useAuth";
import {
  Building2,
  Calendar,
  CheckCircle,
  Star,
  User,
  MapPin,
  Download,
  QrCode,
} from "lucide-react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Interface untuk data magang
interface MagangData {
  name: string;
  nis: string;
  class: string;
  major: string;
  company: string;
  address: string;
  period: string;
  status: string;
  finalGrade: string | null;
  verification_token: string | null;
}

export default function MagangPage() {
  useAuth();
  const [magangData, setMagangData] = useState<MagangData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Dynamic import QR Code component
  const DynamicQrCodeComponent = dynamic(
    () => import("@/components/layout/siswa/qr-code"),
    { ssr: false }
  );

  // Fetch data magang
  const fetchMagangData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login ulang.");
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
        }/siswa/magang`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data) {
          // Format data
          const formattedData = {
            ...result.data,
            verification_token:
              result.data.verification_token ||
              result.data.verification ||
              null,
          };

          setMagangData(formattedData);
          setError(null);
        } else {
          setMagangData(null);
          setError(result.message || "Data magang tidak ditemukan");
        }
      } else {
        throw new Error("Gagal mengambil data magang");
      }
    } catch (err: any) {
      console.error("Error fetching magang data:", err);
      setError("Gagal memuat data magang");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMagangData();
  }, []);

  // ✅ Fungsi Download PDF
  const handleDownloadReport = async () => {
    if (!magangData?.verification_token) {
      alert("Token verifikasi tidak tersedia");
      return;
    }

    try {
      setIsDownloading(true);

      // ✅ Gunakan route public dengan token
      const downloadUrl = `${
        process.env.NEXT_PUBLIC_LARAVEL_BASE_URL || "http://localhost:8000"
      }/verifikasi/pdf/${magangData.verification_token}`;

      // Buka di tab baru
      window.open(downloadUrl, "_blank");
    } catch (err: any) {
      console.error("Error downloading report:", err);
      alert("Gagal mengunduh laporan");
    } finally {
      setIsDownloading(false);
    }
  };

  const hasMagang = magangData !== null;

  // ✅ Logika untuk menampilkan tombol QR & Download
  const canShowQrButton =
    hasMagang &&
    magangData.status?.toLowerCase() === "selesai" &&
    !!magangData.verification_token;

  // ✅ URL verifikasi untuk QR Code
  const qrCodeUrl = canShowQrButton
    ? `${
        process.env.NEXT_PUBLIC_LARAVEL_BASE_URL || "http://localhost:8000"
      }/verifikasi/pdf/${magangData.verification_token}`
    : "";

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 mt-4">
                Memuat data magang...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md mx-auto">
              <div className="text-red-500 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-red-700 mb-4 font-medium">{error}</p>
              <button
                onClick={fetchMagangData}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Status Magang Saya
            </h1>
            <p className="text-gray-600">
              Lihat informasi detail tempat dan status magang Anda
            </p>
          </div>

          {hasMagang ? (
            /* Data Magang Card */
            <div className="bg-white shadow-sm rounded-xl p-4 md:p-6 border border-gray-100 mb-6">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <User className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                  Data Magang
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Kolom Kiri */}
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Nama Siswa</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {magangData.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Kelas</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {magangData.class}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">
                        Nama Perusahaan
                      </p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {magangData.company}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">
                        Periode Magang
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {magangData.period}
                      </p>
                    </div>
                  </div>

                  {magangData.finalGrade && (
                    <div className="flex items-start gap-3">
                      <Star className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">
                          Nilai Akhir
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {magangData.finalGrade}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Kolom Kanan */}
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">NIS</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {magangData.nis}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Jurusan</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {magangData.major}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">
                        Alamat Perusahaan
                      </p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {magangData.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          magangData.status.toLowerCase() === "aktif"
                            ? "bg-green-100 text-green-800"
                            : magangData.status.toLowerCase() === "selesai"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {magangData.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tidak ada magang */
            <div className="bg-white shadow-sm rounded-xl p-6 md:p-8 border border-gray-100 text-center">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum Memiliki Magang
              </h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                Anda belum memiliki magang aktif. Silakan daftar ke DUDI yang
                tersedia.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ TOMBOL FIXED QR CODE/DOWNLOAD (Pojok Kanan Bawah) */}
      {canShowQrButton && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 flex flex-col items-end space-y-3 z-50">
          {/* QR CODE POPUP / MODAL */}
          {showQr && (
            <div className="p-4 bg-white rounded-xl shadow-2xl border border-gray-100 transform animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  Scan Verifikasi
                </h4>
                <button
                  onClick={() => setShowQr(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <DynamicQrCodeComponent
                value={qrCodeUrl}
                size={150}
                label="Pindai untuk Laporan Resmi"
              />
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500 break-all max-w-[180px]">
                  {qrCodeUrl}
                </p>
              </div>
            </div>
          )}

          {/* KELOMPOK TOMBOL */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-3">
            {/* Tombol Scan (Memunculkan QR) */}
            <button
              onClick={() => setShowQr(!showQr)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-full shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95"
              title="Tampilkan QR Code untuk verifikasi"
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden md:inline">Scan Laporan</span>
              <span className="md:hidden">Scan</span>
            </button>

            {/* Tombol Download */}
            <button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-full shadow-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              title="Download laporan magang dalam format PDF"
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">
                {isDownloading ? "Mengunduh..." : "Download Laporan"}
              </span>
              <span className="md:hidden">
                {isDownloading ? "..." : "Download"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
