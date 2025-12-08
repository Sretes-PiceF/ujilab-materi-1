"use client";
import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface QrCodeProps {
  value: string;
  size?: number;
  label?: string;
}

export default function QrCodeComponent({
  value,
  size = 180,
  label,
}: QrCodeProps) {
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

  // Format token untuk ditampilkan
  const tokenDisplay = value.split("/").pop()?.slice(-8).toUpperCase() || "N/A";

  // ----------------------------
  // ✅ Fungsi Download QR Code
  // ----------------------------
  const downloadQrCode = () => {
    const svg = document.getElementById("qr-svg");
    if (!(svg instanceof SVGAElement)) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    // Convert SVG → PNG
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, 0, 0);

      const pngFile = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.download = `qrcode-${tokenDisplay}.png`;
      link.href = pngFile;
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgString);
  };

  return (
    <div
      className="
        p-4 bg-white rounded-xl shadow-lg
        border border-gray-100 inline-flex flex-col items-center
      "
    >
      <div className="p-2 border border-gray-200 rounded-md">
        <QRCodeSVG
          id="qr-svg"
          value={value}
          size={size - 20}
          level="H"
          bgColor="#ffffff"
          fgColor="#1e293b"
        />
      </div>

      <div className="mt-3 text-center">
        {label && (
          <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
        )}
        <p className="text-xs font-mono text-gray-500 truncate max-w-[180px]">
          Token: {tokenDisplay}
        </p>
      </div>

      {/* ----------------------------
          ✅ Tombol Download QR
      ---------------------------- */}
      <button
        onClick={downloadQrCode}
        className="mt-3 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition"
      >
        Download QR
      </button>
    </div>
  );
}
