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
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Interface untuk data siswa dan magang
interface SiswaData {
  id: string;
  nama: string;
  nis: string;
  kelas: string;
  jurusan: string;
  email: string;
  telepon: string;
  alamat: string;
}

interface MagangData {
  id: string;
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
  tanggal_mulai?: string;
  tanggal_selesai?: string;
}

// Loading Skeleton Component untuk Card
const CardSkeleton = () => {
  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6 mb-6">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Kolom Kiri - Skeleton */}
        <div className="space-y-3 md:space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="h-4 w-4 bg-gray-200 rounded mt-1 animate-pulse"></div>
              <div className="flex-1 min-w-0">
                <div className="h-3 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Kolom Kanan - Skeleton */}
        <div className="space-y-3 md:space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="h-4 w-4 bg-gray-200 rounded mt-1 animate-pulse"></div>
              <div className="flex-1 min-w-0">
                <div className="h-3 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Message Skeleton */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 w-40 bg-gray-200 rounded mb-2 animate-pulse"></div>
            <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-2/3 bg-gray-200 rounded mt-1 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MagangPage() {
  useAuth();
  const [siswaData, setSiswaData] = useState<SiswaData | null>(null);
  const [magangData, setMagangData] = useState<MagangData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Dynamic import QR Code component
  const DynamicQrCodeComponent = dynamic(
    () => import("@/components/layout/siswa/qr-code"),
    { ssr: false }
  );

  // Fetch data siswa dan magang
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      if (!token) {
        console.log("Token tidak ditemukan");
        setSiswaData(null);
        setMagangData(null);
        return;
      }

      // 1. Fetch data siswa terlebih dahulu
      const siswaResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/siswa/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (siswaResponse.ok) {
        const siswaResult = await siswaResponse.json();
        if (siswaResult.success && siswaResult.data) {
          setSiswaData(siswaResult.data);
        }
      }

      // 2. Fetch data magang (opsional)
      try {
        const magangResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/siswa/magang`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        if (magangResponse.ok) {
          const magangResult = await magangResponse.json();
          if (magangResult.success && magangResult.data) {
            // Format data magang
            const formattedData: MagangData = {
              ...magangResult.data,
              verification_token:
                magangResult.data.verification_token ||
                magangResult.data.verification ||
                null,
              name: magangResult.data.nama_siswa || magangResult.data.name || siswaData?.nama || "",
              nis: magangResult.data.nis || siswaData?.nis || "",
              class: magangResult.data.kelas || siswaData?.kelas || "",
              major: magangResult.data.jurusan || siswaData?.jurusan || "",
              company: magangResult.data.nama_perusahaan || magangResult.data.company || "",
              address: magangResult.data.alamat_perusahaan || magangResult.data.address || "",
              period: magangResult.data.period || 
                (magangResult.data.tanggal_mulai && magangResult.data.tanggal_selesai 
                  ? `${new Date(magangResult.data.tanggal_mulai).toLocaleDateString('id-ID')} - ${new Date(magangResult.data.tanggal_selesai).toLocaleDateString('id-ID')}`
                  : ""),
              status: magangResult.data.status || "pending",
              finalGrade: magangResult.data.nilai_akhir || null,
            };
            setMagangData(formattedData);
          } else {
            // Tidak ada data magang - status default "pending"
            setMagangData(null);
          }
        }
      } catch (magangError) {
        console.log("Tidak ada data magang:", magangError);
        setMagangData(null);
      }

    } catch (error) {
      console.log("Error fetching data:", error);
      setSiswaData(null);
      setMagangData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Fungsi Download PDF
  const handleDownloadReport = async () => {
    if (!magangData?.verification_token) {
      alert("Laporan belum tersedia");
      return;
    }

    try {
      setIsDownloading(true);
      const downloadUrl = `${
        process.env.NEXT_PUBLIC_LARAVEL_BASE_URL || "http://localhost:8000"
      }/verifikasi/pdf/${magangData.verification_token}`;
      window.open(downloadUrl, "_blank");
    } catch (err) {
      console.log("Error downloading report:", err);
      alert("Gagal mengunduh laporan");
    } finally {
      setIsDownloading(false);
    }
  };

  const hasMagang = magangData !== null;
  const currentStatus = magangData?.status?.toLowerCase() || "pending";

  // ✅ Logika untuk menampilkan tombol QR & Download
  const canShowQrButton =
    hasMagang &&
    currentStatus === "selesai" &&
    !!magangData.verification_token;

  // ✅ URL verifikasi untuk QR Code
  const qrCodeUrl = canShowQrButton
    ? `${
        process.env.NEXT_PUBLIC_LARAVEL_BASE_URL || "http://localhost:8000"
      }/verifikasi/pdf/${magangData.verification_token}`
    : "";

  // ✅ Format periode
  const formatPeriod = () => {
    if (magangData?.tanggal_mulai && magangData?.tanggal_selesai) {
      return `${new Date(magangData.tanggal_mulai).toLocaleDateString('id-ID')} - ${new Date(magangData.tanggal_selesai).toLocaleDateString('id-ID')}`;
    }
    return magangData?.period || "Belum ditentukan";
  };

  // ✅ Get status color and icon
  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();
    
    switch (statusLower) {
      case "diterima":
      case "berlangsung":
      case "aktif":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
          label: "Diterima",
          description: "Magang Anda sudah diterima dan sedang berlangsung"
        };
      case "selesai":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
          label: "Selesai",
          description: "Magang Anda telah selesai"
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Clock className="h-4 w-4 text-yellow-600" />,
          label: "Pending",
          description: "Menunggu verifikasi dan penempatan"
        };
      case "ditolak":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="h-4 w-4 text-red-600" />,
          label: "Ditolak",
          description: "Pengajuan magang ditolak"
        };
      case "dibatalkan":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <XCircle className="h-4 w-4 text-gray-600" />,
          label: "Dibatalkan",
          description: "Magang dibatalkan"
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <AlertCircle className="h-4 w-4 text-gray-600" />,
          label: status,
          description: "Status magang"
        };
    }
  };

  const statusConfig = getStatusConfig(currentStatus);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {hasMagang ? "Status Magang Saya" : "Profil Siswa"}
        </h1>
        <p className="text-gray-600">
          {hasMagang 
            ? "Lihat informasi detail tempat dan status magang Anda" 
            : "Informasi profil dan status pengajuan magang"}
        </p>
      </div>

      {/* Main Card atau Loading Skeleton */}
      {loading ? (
        <CardSkeleton />
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <User className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
              {hasMagang ? "Data Magang" : "Data Siswa"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Kolom Kiri - Data Siswa */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Nama Siswa</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {siswaData?.nama || magangData?.name || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Kelas</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {siswaData?.kelas || magangData?.class || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">
                    {hasMagang ? "Nama Perusahaan" : "Status Magang"}
                  </p>
                  {hasMagang ? (
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {magangData.company || "-"}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.icon}
                        <span className="ml-1">{statusConfig.label}</span>
                      </span>
                      <p className="text-xs text-gray-500">{statusConfig.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {hasMagang && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Periode Magang</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPeriod()}
                    </p>
                  </div>
                </div>
              )}

              {magangData?.finalGrade && (
                <div className="flex items-start gap-3">
                  <Star className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Nilai Akhir</p>
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
                    {siswaData?.nis || magangData?.nis || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Jurusan</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {siswaData?.jurusan || magangData?.major || "-"}
                  </p>
                </div>
              </div>

              {hasMagang && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Alamat Perusahaan</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {magangData.address || "-"}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">
                    {hasMagang ? "Status Magang" : "Status Pengajuan"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      {statusConfig.icon}
                      <span className="ml-1">{statusConfig.label}</span>
                    </span>
                    {!hasMagang && (
                      <p className="text-xs text-gray-500">Belum memiliki magang</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {statusConfig.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {!hasMagang && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    Informasi Magang
                  </h3>
                  <p className="text-xs text-gray-600">
                    {currentStatus === "pending" 
                      ? "Pengajuan magang Anda sedang dalam proses verifikasi. Silakan tunggu konfirmasi dari guru pembimbing."
                      : currentStatus === "ditolak"
                      ? "Pengajuan magang Anda ditolak. Silakan hubungi guru pembimbing untuk informasi lebih lanjut."
                      : "Anda belum memiliki tempat magang. Silakan hubungi guru pembimbing untuk proses pendaftaran."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOMBOL QR CODE/DOWNLOAD (hanya untuk magang selesai) */}
      {canShowQrButton && !loading && (
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
            {/* Tombol Scan */}
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