// // /components/layout/guru/detail/LogbookDetail.tsx
// import React, { useState, useEffect } from "react";
// import { LogbookEntry } from "@/types/logbook";
// import { Button } from "@/components/ui/button";
// import {
//   X,
//   Image as ImageIcon,
//   AlertCircle,
//   ExternalLink,
//   RefreshCw,
// } from "lucide-react";

// interface LogbookDetailModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   entry: LogbookEntry | any;
// }

// const getStatusLabel = (status: string) => {
//   switch (status) {
//     case "pending":
//       return "Menunggu Verifikasi";
//     case "verified":
//       return "Diverifikasi";
//     case "rejected":
//       return "Ditolak";
//     default:
//       return "Tidak Diketahui";
//   }
// };

// const LogbookDetailModal: React.FC<LogbookDetailModalProps> = ({
//   isOpen,
//   onClose,
//   entry,
// }) => {
//   const [imageError, setImageError] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [imageSrc, setImageSrc] = useState<string | null>(null);
//   const [proxyImageSrc, setProxyImageSrc] = useState<string | null>(null);

//   useEffect(() => {
//     if (entry && isOpen) {
//       console.log("🔄 Loading entry:", entry.id);

//       // Reset states
//       setImageError(false);
//       setIsLoading(true);
//       setProxyImageSrc(null);

//       // Dapatkan URL gambar
//       const rawUrl = entry.webp_image_url || entry.file_url;
//       console.log("📷 Raw image URL from API:", rawUrl);

//       if (!rawUrl || rawUrl.trim() === "" || rawUrl === "null") {
//         console.log("📭 No image URL provided");
//         setImageSrc(null);
//         setIsLoading(false);
//         return;
//       }

//       let finalUrl = rawUrl.trim();

//       // Jika URL relative (tidak ada http/https)
//       if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
//         const baseUrl = process.env.NEXT_PUBLIC_LARAVEL_BASE_URL || "";
//         // Hapus leading slash jika ada
//         if (finalUrl.startsWith("/")) {
//           finalUrl = finalUrl.substring(1);
//         }
//         // Pastikan kita menuju ke storage
//         if (!finalUrl.startsWith("storage/")) {
//           finalUrl = `storage/${finalUrl}`;
//         }
//         finalUrl = `${baseUrl.replace(/\/$/, "")}/${finalUrl}`;
//       }

//       console.log("🔗 Final image URL:", finalUrl);
//       setImageSrc(finalUrl);

//       // GUNAKAN PROXY API NEXT.JS untuk bypass ngrok
//       const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(finalUrl)}`;
//       console.log("🔀 Using proxy URL:", proxyUrl);

//       // Langsung set proxy URL (Next.js API akan handle fetch dengan header)
//       setProxyImageSrc(proxyUrl);
//       setIsLoading(false);
//     }
//   }, [entry, isOpen]);

//   // Cleanup object URLs saat unmount
//   useEffect(() => {
//     return () => {
//       if (proxyImageSrc && proxyImageSrc.startsWith("blob:")) {
//         URL.revokeObjectURL(proxyImageSrc);
//       }
//     };
//   }, [proxyImageSrc]);

//   if (!isOpen || !entry) return null;

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "pending":
//         return "bg-yellow-100 text-yellow-800 border border-yellow-200";
//       case "verified":
//         return "bg-green-100 text-green-800 border border-green-200";
//       case "rejected":
//         return "bg-red-100 text-red-800 border border-red-200";
//       default:
//         return "bg-gray-100 text-gray-800 border border-gray-200";
//     }
//   };

//   const handleRetry = () => {
//     setIsLoading(true);
//     setImageError(false);
//     console.log("🔄 Retrying image load...");

//     if (imageSrc) {
//       // Gunakan proxy API
//       const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageSrc)}`;
//       setProxyImageSrc(proxyUrl);
//       setIsLoading(false);
//     }
//   };

//   const handleOpenImage = () => {
//     if (imageSrc) {
//       // Buka URL proxy di tab baru
//       const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageSrc)}`;
//       window.open(proxyUrl, "_blank", "noopener,noreferrer");
//       console.log("🔗 Opening image via proxy in new tab");
//     }
//   };

//   const handleDownload = async () => {
//     if (!imageSrc) return;

//     try {
//       // Download via proxy
//       const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageSrc)}`;
//       const response = await fetch(proxyUrl);

//       if (!response.ok) throw new Error("Download failed");

//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `logbook-${entry.id}-${Date.now()}.${
//         entry.webp_image_url ? "webp" : "jpg"
//       }`;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);

//       console.log("✅ Download successful");
//     } catch (error) {
//       console.error("❌ Download error:", error);
//       alert("Gagal mengunduh gambar. Coba buka gambar di tab baru.");
//     }
//   };

//   const PlaceholderSVG = () => (
//     <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
//       <ImageIcon className="w-16 h-16 text-gray-400 mb-3" />
//       <p className="text-gray-600 font-medium">Tidak ada foto</p>
//       <p className="text-gray-500 text-sm mt-1">Logbook tanpa dokumentasi</p>
//     </div>
//   );

//   const LoadingDisplay = () => (
//     <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
//       <div className="text-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4FC3F7] mx-auto mb-3"></div>
//         <p className="text-gray-600 font-medium">Memuat gambar...</p>
//         <p className="text-gray-500 text-sm mt-1">Melalui Next.js Proxy API</p>
//       </div>
//     </div>
//   );

//   const ErrorDisplay = () => (
//     <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 border-2 border-dashed border-red-200 rounded-lg p-4">
//       <AlertCircle className="w-16 h-16 text-red-400 mb-3" />
//       <p className="text-red-600 font-medium text-center">
//         Gagal memuat gambar
//       </p>
//       <p className="text-red-500 text-sm mt-1 text-center max-w-xs">
//         Kemungkinan masalah CORS atau URL tidak dapat diakses
//       </p>

//       <div className="flex flex-col sm:flex-row gap-2 mt-4">
//         <button
//           onClick={handleRetry}
//           className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
//         >
//           <RefreshCw className="w-4 h-4" />
//           Coba Lagi
//         </button>

//         {imageSrc && (
//           <>
//             <button
//               onClick={handleOpenImage}
//               className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
//             >
//               <ExternalLink className="w-4 h-4" />
//               Buka di Tab Baru
//             </button>

//             <button
//               onClick={async () => {
//                 console.log("🧪 Testing proxy API fetch...");
//                 try {
//                   const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(
//                     imageSrc
//                   )}`;
//                   console.log("🔀 Proxy URL:", proxyUrl);

//                   const res = await fetch(proxyUrl);
//                   console.log(
//                     "✅ Proxy API response:",
//                     res.status,
//                     res.statusText
//                   );

//                   const blob = await res.blob();
//                   console.log("✅ Blob from proxy:", blob.type, blob.size);

//                   alert(
//                     `Success via Proxy!\nStatus: ${res.status}\nType: ${
//                       blob.type
//                     }\nSize: ${(blob.size / 1024).toFixed(1)}KB`
//                   );
//                 } catch (err) {
//                   console.error("❌ Proxy API test failed:", err);
//                   alert(
//                     `Failed: ${
//                       err instanceof Error ? err.message : "Unknown error"
//                     }`
//                   );
//                 }
//               }}
//               className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
//             >
//               🧪 Test Proxy
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );

//   return (
//     <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
//         {/* Header */}
//         <div className="bg-[#4FC3F7] p-4 flex justify-between items-center">
//           <h3 className="text-xl font-bold text-white">Detail Logbook</h3>
//           <button
//             onClick={onClose}
//             className="text-white hover:bg-white/20 p-1 rounded-full transition-colors"
//           >
//             <X className="h-6 w-6" />
//           </button>
//         </div>

//         {/* Scrollable Content */}
//         <div className="flex-1 overflow-y-auto p-6 space-y-6">
//           {/* Status Badge */}
//           <div className="flex justify-between items-center">
//             <div
//               className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
//                 entry.status_verifikasi
//               )}`}
//             >
//               {getStatusLabel(entry.status_verifikasi)}
//             </div>

//             {entry.optimized_size > 0 && (
//               <div className="text-sm text-gray-600">
//                 <span className="font-medium">Ukuran: </span>
//                 {(entry.optimized_size / 1024).toFixed(0)} KB
//               </div>
//             )}
//           </div>

//           {/* Informasi Siswa */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <DetailItem label="Nama Siswa" value={entry.siswa.nama} />
//             <DetailItem label="NIS" value={entry.siswa.nis || "-"} />
//             <DetailItem
//               label="Tanggal Kegiatan"
//               value={entry.tanggal_formatted || entry.tanggal}
//             />
//           </div>

//           {/* Kegiatan & Kendala */}
//           <DetailSection title="Kegiatan" content={entry.kegiatan} />
//           <DetailSection
//             title="Kendala yang Dihadapi"
//             content={entry.kendala}
//           />

//           {/* Gambar Dokumentasi */}
//           <div className="space-y-3">
//             <div className="flex justify-between items-center">
//               <h4 className="text-lg font-semibold text-gray-800">
//                 Foto Dokumentasi
//               </h4>

//               {proxyImageSrc && !isLoading && !imageError && (
//                 <div className="flex gap-2">
//                   <button
//                     onClick={handleOpenImage}
//                     className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
//                   >
//                     <ExternalLink className="w-4 h-4" />
//                     Buka
//                   </button>
//                   <button
//                     onClick={handleDownload}
//                     className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 transition-colors"
//                   >
//                     <svg
//                       className="w-4 h-4"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
//                       />
//                     </svg>
//                     Download
//                   </button>
//                 </div>
//               )}
//             </div>

//             <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
//               <div className="relative w-full h-[400px] bg-gray-100">
//                 {isLoading ? (
//                   <LoadingDisplay />
//                 ) : proxyImageSrc && !imageError ? (
//                   <img
//                     src={proxyImageSrc}
//                     alt={`Foto dokumentasi logbook ${entry.id}`}
//                     className="w-full h-full object-contain"
//                     onError={(e) => {
//                       console.error("❌ Image render error:", {
//                         src: proxyImageSrc,
//                         currentSrc: e.currentTarget.src,
//                       });
//                       setImageError(true);
//                     }}
//                     onLoad={() => {
//                       console.log("✅ Image rendered successfully");
//                     }}
//                   />
//                 ) : imageError ? (
//                   <ErrorDisplay />
//                 ) : (
//                   <PlaceholderSVG />
//                 )}
//               </div>

//               {/* Info Panel */}
//               <div className="bg-gray-50 p-4 border-t border-gray-300">
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
//                   <div>
//                     <p className="font-medium text-gray-700">Format</p>
//                     <p className="text-gray-600">
//                       {entry.webp_image_url ? "WebP" : "JPG"}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="font-medium text-gray-700">Status</p>
//                     <p
//                       className={`font-semibold ${
//                         isLoading
//                           ? "text-blue-600"
//                           : imageError
//                           ? "text-red-600"
//                           : proxyImageSrc
//                           ? "text-green-600"
//                           : "text-gray-600"
//                       }`}
//                     >
//                       {isLoading
//                         ? "Memuat..."
//                         : imageError
//                         ? "Gagal"
//                         : proxyImageSrc
//                         ? "✓ Dimuat"
//                         : "Tidak ada"}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="font-medium text-gray-700">Method</p>
//                     <p className="text-gray-600">
//                       {proxyImageSrc?.startsWith("/api/proxy-image")
//                         ? "✅ Proxy API"
//                         : "Direct"}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="font-medium text-gray-700">ID</p>
//                     <p className="text-gray-600 font-mono text-xs">
//                       {entry.id}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Debug Info - Always show in development or when error */}
//                 {(process.env.NODE_ENV === "development" || imageError) &&
//                   imageSrc && (
//                     <details className="mt-3" open={imageError}>
//                       <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
//                         🔍 Debug Information {imageError && "(⚠️ ERROR)"}
//                       </summary>
//                       <div className="mt-2 p-3 bg-white rounded border text-xs space-y-2">
//                         <div>
//                           <p className="font-semibold text-gray-700 mb-1">
//                             Original URL:
//                           </p>
//                           <p className="text-gray-600 break-all font-mono bg-gray-50 p-2 rounded">
//                             {imageSrc}
//                           </p>
//                         </div>

//                         <div>
//                           <p className="font-semibold text-gray-700 mb-1">
//                             Proxy URL:
//                           </p>
//                           <p className="text-gray-600 break-all font-mono bg-gray-50 p-2 rounded">
//                             {proxyImageSrc || "Not created yet"}
//                           </p>
//                         </div>

//                         <div className="grid grid-cols-2 gap-2">
//                           <div>
//                             <p className="font-semibold text-gray-700">
//                               Using Proxy:
//                             </p>
//                             <p className="text-gray-600">
//                               {proxyImageSrc?.startsWith("/api/")
//                                 ? "✅ Yes"
//                                 : "❌ No"}
//                             </p>
//                           </div>
//                           <div>
//                             <p className="font-semibold text-gray-700">
//                               Loading:
//                             </p>
//                             <p className="text-gray-600">
//                               {isLoading ? "⏳ Yes" : "✓ No"}
//                             </p>
//                           </div>
//                           <div>
//                             <p className="font-semibold text-gray-700">
//                               Error:
//                             </p>
//                             <p className="text-gray-600">
//                               {imageError ? "❌ Yes" : "✓ No"}
//                             </p>
//                           </div>
//                           <div>
//                             <p className="font-semibold text-gray-700">
//                               Has Source:
//                             </p>
//                             <p className="text-gray-600">
//                               {proxyImageSrc ? "✓ Yes" : "❌ No"}
//                             </p>
//                           </div>
//                         </div>

//                         <div>
//                           <p className="font-semibold text-gray-700 mb-1">
//                             Base URL:
//                           </p>
//                           <p className="text-gray-600 font-mono bg-gray-50 p-2 rounded break-all">
//                             {process.env.NEXT_PUBLIC_LARAVEL_BASE_URL}
//                           </p>
//                         </div>

//                         <div className="pt-2 border-t">
//                           <button
//                             onClick={() => {
//                               console.log("=== FULL DEBUG INFO ===");
//                               console.log("imageSrc:", imageSrc);
//                               console.log("proxyImageSrc:", proxyImageSrc);
//                               console.log("isLoading:", isLoading);
//                               console.log("imageError:", imageError);
//                               console.log(
//                                 "NEXT_PUBLIC_LARAVEL_BASE_URL:",
//                                 process.env.NEXT_PUBLIC_LARAVEL_BASE_URL
//                               );
//                               console.log("entry:", entry);
//                               console.log("======================");
//                             }}
//                             className="w-full text-xs bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors"
//                           >
//                             📋 Log Full Details to Console
//                           </button>
//                         </div>

//                         {imageError && (
//                           <div className="pt-2 border-t bg-red-50 p-2 rounded">
//                             <p className="font-semibold text-red-700 mb-1">
//                               ❌ Error Notes:
//                             </p>
//                             <ul className="text-red-600 space-y-1 text-xs list-disc list-inside">
//                               <li>
//                                 Fetch with ngrok-skip-browser-warning header
//                                 failed
//                               </li>
//                               <li>Check if Laravel backend is running</li>
//                               <li>Check if ngrok tunnel is active</li>
//                               <li>Check CORS settings on Laravel side</li>
//                               <li>Try opening URL directly in browser</li>
//                             </ul>
//                           </div>
//                         )}
//                       </div>
//                     </details>
//                   )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="border-t p-4 flex justify-end">
//           <Button
//             onClick={onClose}
//             className="bg-[#4FC3F7] hover:bg-[#38b2e6] text-white"
//           >
//             Tutup
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Sub-komponen untuk item detail
// const DetailItem: React.FC<{ label: string; value: string }> = ({
//   label,
//   value,
// }) => (
//   <div>
//     <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
//     <p className="text-base font-semibold text-gray-800">{value}</p>
//   </div>
// );

// // Sub-komponen untuk section
// const DetailSection: React.FC<{ title: string; content: string }> = ({
//   title,
//   content,
// }) => (
//   <div className="space-y-2">
//     <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
//     <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
//       <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
//     </div>
//   </div>
// );

// export default LogbookDetailModal;

import React, { useState, useEffect } from "react";
import { LogbookEntry } from "@/types/logbook";
import { Button } from "@/components/ui/button";
import {
  X,
  Image as ImageIcon,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Download,
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
  const [proxyImageSrc, setProxyImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (entry && isOpen) {
      // Reset states
      setImageError(false);
      setIsLoading(true);
      setProxyImageSrc(null);

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
        if (finalUrl.startsWith("/")) {
          finalUrl = finalUrl.substring(1);
        }
        if (!finalUrl.startsWith("storage/")) {
          finalUrl = `storage/${finalUrl}`;
        }
        finalUrl = `${baseUrl.replace(/\/$/, "")}/${finalUrl}`;
      }

      setImageSrc(finalUrl);

      // Gunakan proxy API Next.js untuk bypass ngrok
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(finalUrl)}`;
      setProxyImageSrc(proxyUrl);
      setIsLoading(false);
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
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageSrc)}`;
      setProxyImageSrc(proxyUrl);
      setIsLoading(false);
    }
  };

  const handleOpenImage = () => {
    if (imageSrc) {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageSrc)}`;
      window.open(proxyUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = async () => {
    if (!imageSrc) return;

    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageSrc)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logbook-${entry.id}-${Date.now()}.${
        entry.webp_image_url ? "webp" : "jpg"
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Gagal mengunduh gambar. Coba buka gambar di tab baru.");
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
      <p className="text-red-500 text-sm mt-1 text-center max-w-xs">
        Gambar tidak dapat dimuat dari server
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
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
          {(proxyImageSrc || isLoading) && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-800">
                Foto Dokumentasi
              </h4>

              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div className="relative w-full h-[400px] bg-gray-100">
                  {isLoading ? (
                    <LoadingDisplay />
                  ) : proxyImageSrc && !imageError ? (
                    <Image
                      src={proxyImageSrc}
                      fill
                      alt={`Foto dokumentasi logbook ${entry.id}`}
                      className="w-full h-full object-contain"
                      onError={() => setImageError(true)}
                    />
                  ) : imageError ? (
                    <ErrorDisplay />
                  ) : (
                    <PlaceholderSVG />
                  )}
                </div>

                {/* Action Buttons */}
                {proxyImageSrc && !isLoading && !imageError && (
                  <div className="bg-gray-50 p-3 border-t border-gray-300 flex justify-end gap-2">
                    <button
                      onClick={handleOpenImage}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Buka di Tab Baru
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                )}
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
