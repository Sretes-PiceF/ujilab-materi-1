// components/layout/siswa/qr-code.tsx
"use client";
import React from "react";
// ✅ PERBAIKAN: Gunakan named import dengan destructuring
import { QRCodeSVG } from "qrcode.react";

// Tentukan props yang akan diterima komponen
interface QrCodeProps {
  /** Data (URL Verifikasi) yang akan dienkode. Wajib. */
  value: string;
  /** Ukuran QR code dalam pixel (Lebar dan Tinggi). Opsional, default 180. */
  size?: number;
  /** Label atau teks deskriptif yang muncul di bawah QR Code. Opsional. */
  label?: string;
}

/**
 * Komponen reusable untuk menampilkan QR Code dengan desain modern.
 */
export default function QrCodeComponent({
  value,
  size = 180,
  label,
}: QrCodeProps) {
  // Cek jika data value kosong
  if (!value) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center border border-dashed border-gray-400 rounded-lg text-xs text-gray-500 bg-gray-50 p-2"
      >
        QR Data Tidak Tersedia.
      </div>
    );
  }

  // Format token untuk ditampilkan (8 karakter terakhir)
  const tokenDisplay = value.split("/").pop()?.slice(-8).toUpperCase() || "N/A";

  return (
    // Container utama dengan padding, shadow, dan rounded corner
    <div
      className="
      p-4 
      bg-white 
      rounded-xl 
      shadow-lg 
      shadow-indigo-100/50 
      border 
      border-gray-100 
      inline-flex 
      flex-col 
      items-center
      transition-all 
      hover:shadow-xl
    "
    >
      {/* Area QR Code (Canvas/SVG) */}
      <div className="p-2 border border-gray-200 rounded-md">
        <QRCodeSVG
          value={value} // Data yang dienkode
          size={size - 20} // Disesuaikan agar muat di dalam padding
          level="H" // Level koreksi error tinggi
          bgColor="#ffffff" // Latar belakang putih
          fgColor="#1e293b" // Warna titik (slate-800)
        />
      </div>

      {/* Keterangan di bawah QR Code */}
      <div className="mt-3 text-center">
        {label && (
          <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
        )}
        <p className="text-xs font-mono text-gray-500 select-all truncate max-w-[180px]">
          Token: **{tokenDisplay}**
        </p>
      </div>
    </div>
  );
}
