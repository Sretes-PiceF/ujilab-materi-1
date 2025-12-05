// /components/layout/guru/detail/LogbookDetail.tsx
import React from "react";
import { LogbookEntry } from "@/types/logbook";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface LogbookDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: LogbookEntry | any;
}

// Fungsi helper untuk mendapatkan label status
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
  if (!isOpen || !entry) return null;

  // Menentukan warna Status
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

  // Cek apakah ada gambar
  const hasImage = entry.webp_image_url || entry.file_url;
  const imageUrl = entry.webp_image_url || entry.file_url;

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

            {/* Jika ada ukuran file */}
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

          {/* Kegiatan */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-gray-800">Kegiatan</h4>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap">
                {entry.kegiatan}
              </p>
            </div>
          </div>

          {/* Kendala */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-gray-800">
              Kendala yang Dihadapi
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap">
                {entry.kendala}
              </p>
            </div>
          </div>

          {/* Gambar Dokumentasi */}
          {hasImage && (
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-gray-800">
                Foto Dokumentasi
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="relative w-full h-[400px] bg-gray-100">
                  <Image
                    src={imageUrl || "/placeholder-image.jpg"}
                    alt="Foto Dokumentasi Logbook"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 800px"
                    unoptimized={imageUrl?.startsWith("http://localhost")}
                  />
                </div>

                {/* Info gambar */}
                <div className="bg-gray-50 p-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      <strong>Format:</strong>{" "}
                      {entry.webp_image_url ? "WebP" : "JPG"}
                    </span>
                    <span>
                      <strong>Optimized:</strong>{" "}
                      {entry.optimized_size
                        ? `${(entry.optimized_size / 1024).toFixed(1)} KB`
                        : "Tidak tersedia"}
                    </span>
                  </div>

                  {/* Link download */}
                  {imageUrl && (
                    <div className="mt-2">
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-[#4FC3F7] hover:underline"
                      >
                        Buka gambar di tab baru →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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

export default LogbookDetailModal;
