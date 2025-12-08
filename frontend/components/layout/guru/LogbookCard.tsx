// /components/layout/guru/detail/LogbookDetail.tsx
import React, { useState, useEffect } from "react";
import { LogbookEntry } from "@/types/logbook";
import { Button } from "@/components/ui/button";
import {
  X,
  Image as ImageIcon,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";

interface LogbookDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: LogbookEntry | any;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "Menunggu Verifikasi";
    case "verified":
      return "Diverifikasi";
    case "rejected":
      return "Ditolak";
    default:
      return "Tidak Diketahui";
  }
};

const LogbookDetailModal: React.FC<LogbookDetailModalProps> = ({
  isOpen,
  onClose,
  entry,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (entry && isOpen) {
      // Reset states
      setImageError(false);
      setIsLoading(true);

      // Dapatkan URL gambar
      const rawUrl = entry.webp_image_url || entry.file_url;

      if (!rawUrl || rawUrl.trim() === "" || rawUrl === "null") {
        setImageSrc(null);
        setIsLoading(false);
        return;
      }

      let finalUrl = rawUrl.trim();

      // Jika URL relative (tidak ada http/https)
      if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        const baseUrl = process.env.NEXT_PUBLIC_LARAVEL_BASE_URL || "";
        // Hapus leading slash jika ada
        if (finalUrl.startsWith("/")) {
          finalUrl = finalUrl.substring(1);
        }
        // Pastikan kita menuju ke storage
        if (!finalUrl.startsWith("storage/")) {
          finalUrl = `storage/${finalUrl}`;
        }
        finalUrl = `${baseUrl.replace(/\/$/, "")}/${finalUrl}`;
      }

      setImageSrc(finalUrl);

      // Pre-load gambar untuk cek accessibility
      const img = new window.Image();

      img.onload = () => {
        setIsLoading(false);
        setImageError(false);
      };

      img.onerror = () => {
        setIsLoading(false);
        setImageError(true);
      };

      img.src = finalUrl;
    }
  }, [entry, isOpen]);

  if (!isOpen || !entry) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "verified":
        return "bg-green-100 text-green-800 border border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    setImageError(false);

    if (imageSrc) {
      const img = new window.Image();
      img.onload = () => {
        setIsLoading(false);
        setImageError(false);
      };
      img.onerror = () => {
        setIsLoading(false);
        setImageError(true);
      };
      img.src = imageSrc;
    }
  };

  const handleOpenImage = () => {
    if (imageSrc) {
      window.open(imageSrc, "_blank", "noopener,noreferrer");
    }
  };

  const PlaceholderSVG = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
      <ImageIcon className="w-16 h-16 text-gray-400 mb-3" />
      <p className="text-gray-600 font-medium">Tidak ada foto</p>
      <p className="text-gray-500 text-sm mt-1">Logbook tanpa dokumentasi</p>
    </div>
  );

  const LoadingDisplay = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4FC3F7] mx-auto mb-3"></div>
        <p className="text-gray-600 font-medium">Memuat gambar...</p>
      </div>
    </div>
  );

  const ErrorDisplay = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 border-2 border-dashed border-red-200 rounded-lg p-4">
      <AlertCircle className="w-16 h-16 text-red-400 mb-3" />
      <p className="text-red-600 font-medium text-center">
        Gagal memuat gambar
      </p>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleRetry}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>

        {imageSrc && (
          <button
            onClick={handleOpenImage}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Buka di Tab Baru
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#4FC3F7] p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Detail Logbook</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex justify-between items-center">
            <div
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                entry.status_verifikasi
              )}`}
            >
              {getStatusLabel(entry.status_verifikasi)}
            </div>

            {entry.optimized_size > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Ukuran: </span>
                {(entry.optimized_size / 1024).toFixed(0)} KB
              </div>
            )}
          </div>

          {/* Informasi Siswa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Nama Siswa" value={entry.siswa.nama} />
            <DetailItem label="NIS" value={entry.siswa.nis || "-"} />
            <DetailItem
              label="Tanggal Kegiatan"
              value={entry.tanggal_formatted || entry.tanggal}
            />
          </div>

          {/* Kegiatan & Kendala */}
          <DetailSection title="Kegiatan" content={entry.kegiatan} />
          <DetailSection
            title="Kendala yang Dihadapi"
            content={entry.kendala}
          />

          {/* Gambar Dokumentasi */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-gray-800">
                Foto Dokumentasi
              </h4>

              {imageSrc && !isLoading && !imageError && (
                <button
                  onClick={handleOpenImage}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka Gambar
                </button>
              )}
            </div>

            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
              <div className="relative w-full h-[400px] bg-gray-100">
                {isLoading ? (
                  <LoadingDisplay />
                ) : imageSrc && !imageError ? (
                  <Image
                    src={imageSrc}
                    alt={`Foto dokumentasi logbook ${entry.id}`}
                    className="w-full h-full object-contain"
                    onError={() => {
                      setImageError(true);
                    }}
                  />
                ) : imageError ? (
                  <ErrorDisplay />
                ) : (
                  <PlaceholderSVG />
                )}
              </div>

              {/* Info Panel */}
              <div className="bg-gray-50 p-4 border-t border-gray-300">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Format</p>
                    <p className="text-gray-600">
                      {entry.webp_image_url ? "WebP" : "JPG"}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-700">Status</p>
                    <p
                      className={`font-semibold ${
                        isLoading
                          ? "text-blue-600"
                          : imageError
                          ? "text-red-600"
                          : imageSrc
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {isLoading
                        ? "Memuat..."
                        : imageError
                        ? "Gagal"
                        : imageSrc
                        ? "Tersedia"
                        : "Tidak ada"}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-700">ID Logbook</p>
                    <p className="text-gray-600 font-mono">{entry.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-[#4FC3F7] hover:bg-[#38b2e6] text-white"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};

// Sub-komponen untuk item detail
const DetailItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div>
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    <p className="text-base font-semibold text-gray-800">{value}</p>
  </div>
);

// Sub-komponen untuk section
const DetailSection: React.FC<{ title: string; content: string }> = ({
  title,
  content,
}) => (
  <div className="space-y-2">
    <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
    </div>
  </div>
);

export default LogbookDetailModal;
