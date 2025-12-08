"use client";

import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  FileText,
  AlertCircle,
  Upload,
  Loader2,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

interface TambahLogbookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface LogbookFormData {
  tanggal: string;
  kegiatan: string;
  kendala: string;
  originalImage: File | null;
  compressedImage: File | null;
  webpImage: File | null;
  thumbnailWebp: File | null;
}

interface CompressionStats {
  originalSize: number;
  compressedJpgSize: number;
  webpSize: number;
  thumbnailSize: number;
  compressionRatio: number;
  webpRatio: number;
}

export function TambahLogbookModal({
  open,
  onOpenChange,
  onSuccess,
}: TambahLogbookModalProps) {
  const [formData, setFormData] = useState<LogbookFormData>({
    tanggal: new Date().toISOString().split("T")[0],
    kegiatan: "",
    kendala: "",
    originalImage: null,
    compressedImage: null,
    webpImage: null,
    thumbnailWebp: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] =
    useState<CompressionStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 4,
    message: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fungsi format ukuran file
  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper function untuk load image
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Fungsi kompresi dengan Canvas (JPG quality)
  const compressToJpg = async (
    file: File,
    quality = 0.7,
    maxSize = 1200
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async (event) => {
        try {
          if (!event.target?.result) {
            reject(new Error("Failed to read file"));
            return;
          }

          const img = await loadImage(event.target.result as string);

          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Resize jika terlalu besar
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context tidak tersedia"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File(
                  [blob],
                  `compressed_${Date.now()}.jpg`,
                  {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  }
                );
                resolve(compressedFile);
              } else {
                reject(new Error("Gagal membuat JPG"));
              }
            },
            "image/jpeg",
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error("Gagal membaca file"));
    });
  };

  // Fungsi konversi ke WebP
  const convertToWebP = async (
    file: File,
    quality = 0.75,
    maxSize?: number
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async (event) => {
        try {
          if (!event.target?.result) {
            reject(new Error("Failed to read file"));
            return;
          }

          const img = await loadImage(event.target.result as string);

          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Resize untuk thumbnail jika diperlukan
          if (maxSize) {
            if (width > maxSize || height > maxSize) {
              if (width > height) {
                height = Math.round((height * maxSize) / width);
                width = maxSize;
              } else {
                width = Math.round((width * maxSize) / height);
                height = maxSize;
              }
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context tidak tersedia"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const fileName = maxSize
                  ? `thumbnail_${Date.now()}.webp`
                  : `webp_${Date.now()}.webp`;

                const webpFile = new File([blob], fileName, {
                  type: "image/webp",
                  lastModified: Date.now(),
                });
                resolve(webpFile);
              } else {
                reject(new Error("Gagal membuat WebP"));
              }
            },
            "image/webp",
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error("Gagal membaca file"));
    });
  };

  // Proses 4-tahap optimasi
  const optimizeImage = async (file: File): Promise<void> => {
    setIsProcessing(true);
    const originalSize = file.size;
    let compressedJpg: File | null = null;
    let webpImage: File | null = null;
    let thumbnailWebp: File | null = null;

    try {
      // 1. Kompresi ke JPG (untuk fallback)
      setProgress({ current: 1, total: 4, message: "Mengompresi ke JPG..." });
      compressedJpg = await compressToJpg(file, 0.7, 1200);

      // 2. Konversi ke WebP (ukuran normal)
      setProgress({ current: 2, total: 4, message: "Mengonversi ke WebP..." });
      webpImage = await convertToWebP(file, 0.75);

      // 3. Buat thumbnail WebP (300x300)
      setProgress({
        current: 3,
        total: 4,
        message: "Membuat thumbnail WebP...",
      });
      thumbnailWebp = await convertToWebP(file, 0.7, 300);

      // 4. Hitung statistik
      setProgress({ current: 4, total: 4, message: "Menyelesaikan..." });

      const compressedJpgSize = compressedJpg.size;
      const webpSize = webpImage.size;
      const thumbnailSize = thumbnailWebp.size;
      const compressionRatio =
        ((originalSize - compressedJpgSize) / originalSize) * 100;
      const webpRatio = ((originalSize - webpSize) / originalSize) * 100;

      setCompressionStats({
        originalSize,
        compressedJpgSize,
        webpSize,
        thumbnailSize,
        compressionRatio,
        webpRatio,
      });

      // Update form data dengan SEMUA file
      setFormData({
        tanggal: formData.tanggal,
        kegiatan: formData.kegiatan,
        kendala: formData.kendala,
        originalImage: file,
        compressedImage: compressedJpg,
        webpImage: webpImage,
        thumbnailWebp: thumbnailWebp,
      });

      // Buat preview dari WebP
      const url = URL.createObjectURL(webpImage);
      setPreviewUrl(url);

      console.log("🎉 OPTIMASI SELESAI:", {
        original: `${formatFileSize(originalSize)} (${file.type})`,
        compressedJpg: `${formatFileSize(
          compressedJpgSize
        )} (JPG ${compressionRatio.toFixed(1)}% lebih kecil)`,
        webp: `${formatFileSize(webpSize)} (WebP ${webpRatio.toFixed(
          1
        )}% lebih kecil)`,
        thumbnail: `${formatFileSize(thumbnailSize)} (WebP 300x300)`,
      });
    } catch (error) {
      console.error("Optimization error:", error);
      throw error;
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 4, message: "" });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      // Validasi tipe file
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setFieldErrors((prev) => ({
          ...prev,
          file: "File harus berformat JPEG, JPG, atau PNG",
        }));
        return;
      }

      // Validasi ukuran file (max 10MB sebelum kompresi)
      if (file.size > 10 * 1024 * 1024) {
        setFieldErrors((prev) => ({
          ...prev,
          file: "Ukuran file maksimal 10MB sebelum kompresi",
        }));
        return;
      }

      // Clear errors
      if (fieldErrors.file) {
        setFieldErrors((prev) => ({
          ...prev,
          file: "",
        }));
      }

      // Reset preview dan statistik sebelumnya
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setCompressionStats(null);

      // Mulai optimasi gambar
      try {
        await optimizeImage(file);
      } catch (error) {
        console.error("Error optimizing image:", error);
        setFieldErrors((prev) => ({
          ...prev,
          file: "Gagal mengoptimasi gambar. Silakan coba lagi.",
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi form
    const errors: Record<string, string> = {};

    if (formData.kegiatan.length < 10) {
      errors.kegiatan = "Minimal 10 karakter";
    }

    if (formData.kendala.length < 5) {
      errors.kendala = "Minimal 5 karakter";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const token = localStorage.getItem("access_token");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Buat FormData dengan 3 FILE
      const formDataToSend = new FormData();
      formDataToSend.append("tanggal", formData.tanggal);
      formDataToSend.append("kegiatan", formData.kegiatan);
      formDataToSend.append("kendala", formData.kendala);

      // Kirim metadata
      if (compressionStats) {
        formDataToSend.append(
          "original_size",
          compressionStats.originalSize.toString()
        );
        formDataToSend.append(
          "compressed_size",
          compressionStats.compressedJpgSize.toString()
        );
        formDataToSend.append(
          "webp_size",
          compressionStats.webpSize.toString()
        );
        formDataToSend.append(
          "thumbnail_size",
          compressionStats.thumbnailSize.toString()
        );
      }

      // KIRIM 3 FILE:
      // 1. JPG terkompresi (untuk kompatibilitas)
      if (formData.compressedImage) {
        formDataToSend.append("file", formData.compressedImage);
      }

      // 2. WebP utama
      if (formData.webpImage) {
        formDataToSend.append("webp_image", formData.webpImage);
      }

      // 3. WebP thumbnail
      if (formData.thumbnailWebp) {
        formDataToSend.append("webp_thumbnail", formData.thumbnailWebp);
      }

      console.log("📤 Mengirim 3 file ke backend:", {
        file: formData.compressedImage?.name,
        webp_image: formData.webpImage?.name,
        webp_thumbnail: formData.thumbnailWebp?.name,
      });

      // Gunakan endpoint YANG SAMA
      const response = await fetch(`${API_URL}/siswa/logbook/create`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: formDataToSend,
      });

      const result = await response.json();
      console.log("API Response:", result);

      if (response.status === 422) {
        if (result.errors) {
          const errors: Record<string, string> = {};
          Object.keys(result.errors).forEach((key) => {
            errors[key] = result.errors[key][0];
          });
          setFieldErrors(errors);
          setError("Terdapat kesalahan dalam pengisian form");
          return;
        }
      }

      if (response.status === 403) {
        setError(result.message || "Anda tidak memiliki magang aktif");
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message || `HTTP error! status: ${response.status}`
        );
      }

      if (result.success) {
        // Reset form
        setFormData({
          tanggal: new Date().toISOString().split("T")[0],
          kegiatan: "",
          kendala: "",
          originalImage: null,
          compressedImage: null,
          webpImage: null,
          thumbnailWebp: null,
        });

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setCompressionStats(null);

        // Tutup modal
        onOpenChange(false);

        // Callback success
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.message || "Gagal menambahkan logbook");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Terjadi kesalahan saat mengirim data");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      tanggal: new Date().toISOString().split("T")[0],
      kegiatan: "",
      kendala: "",
      originalImage: null,
      compressedImage: null,
      webpImage: null,
      thumbnailWebp: null,
    });

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setError(null);
    setFieldErrors({});
    setCompressionStats(null);
    onOpenChange(false);
  };

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 border-b border-gray-200">
          <DialogTitle className="flex items-center gap-2 text-xl py-2">
            <FileText className="h-5 w-5 text-[#0097BB]" />
            Tambah Logbook Harian
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && !Object.keys(fieldErrors).length && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tanggal */}
            <div className="space-y-2">
              <Label
                htmlFor="tanggal"
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <Calendar className="h-4 w-4 text-gray-500" />
                Tanggal Kegiatan
              </Label>
              <Input
                id="tanggal"
                name="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={handleChange}
                required
                disabled={loading || isProcessing}
                className="bg-white"
                max={new Date().toISOString().split("T")[0]}
              />
              {fieldErrors.tanggal && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {fieldErrors.tanggal}
                </p>
              )}
            </div>

            {/* Kegiatan */}
            <div className="space-y-2">
              <Label
                htmlFor="kegiatan"
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <FileText className="h-4 w-4 text-gray-500" />
                Kegiatan Hari Ini
              </Label>
              <Textarea
                id="kegiatan"
                name="kegiatan"
                value={formData.kegiatan}
                onChange={handleChange}
                placeholder="Deskripsikan kegiatan yang dilakukan hari ini (minimal 10 karakter)"
                rows={4}
                required
                disabled={loading || isProcessing}
                className="resize-none bg-white"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Minimal 10 karakter</span>
                <span
                  className={
                    formData.kegiatan.length < 10
                      ? "text-red-500"
                      : "text-green-600"
                  }
                >
                  {formData.kegiatan.length}/10
                </span>
              </div>
              {fieldErrors.kegiatan && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {fieldErrors.kegiatan}
                </p>
              )}
            </div>

            {/* Kendala */}
            <div className="space-y-2">
              <Label
                htmlFor="kendala"
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <AlertCircle className="h-4 w-4 text-gray-500" />
                Kendala yang Dihadapi
              </Label>
              <Textarea
                id="kendala"
                name="kendala"
                value={formData.kendala}
                onChange={handleChange}
                placeholder="Deskripsikan kendala atau hambatan yang dihadapi (minimal 5 karakter)"
                rows={3}
                required
                disabled={loading || isProcessing}
                className="resize-none bg-white"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Minimal 5 karakter</span>
                <span
                  className={
                    formData.kendala.length < 5
                      ? "text-red-500"
                      : "text-green-600"
                  }
                >
                  {formData.kendala.length}/5
                </span>
              </div>
              {fieldErrors.kendala && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {fieldErrors.kendala}
                </p>
              )}
            </div>

            {/* Upload Foto dengan Optimasi */}
            <div className="space-y-2">
              <Label
                htmlFor="file"
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <Upload className="h-4 w-4 text-gray-500" />
                Upload Foto Dokumentasi (Opsional)
              </Label>

              <Input
                id="file"
                name="file"
                type="file"
                accept="image/jpeg, image/jpg, image/png"
                onChange={handleFileChange}
                disabled={loading || isProcessing}
                className="bg-white"
                ref={fileInputRef}
              />

              <div className="text-xs text-gray-500">
                Format: JPEG, JPG, PNG | Maksimal: 10MB (akan dioptimasi ke WebP
                + JPG)
              </div>

              {fieldErrors.file && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {fieldErrors.file}
                </p>
              )}

              {/* Progress Optimasi */}
              {isProcessing && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-700">
                      {progress.message}
                    </span>
                    <span className="text-xs font-medium text-blue-700">
                      {progress.current}/{progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Mengoptimasi gambar untuk performa terbaik...
                  </p>
                </div>
              )}

              {/* Statistik Optimasi */}
              {compressionStats && !isProcessing && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-green-700">
                      ✅ Gambar berhasil dioptimasi
                    </span>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ukuran asli:</span>
                      <span className="font-medium">
                        {formatFileSize(compressionStats.originalSize)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">JPG terkompresi:</span>
                      <span className="font-medium text-blue-600">
                        {formatFileSize(compressionStats.compressedJpgSize)}
                        <span className="ml-1 text-blue-500">
                          ({compressionStats.compressionRatio.toFixed(1)}% lebih
                          kecil)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">WebP (utama):</span>
                      <span className="font-medium text-green-600">
                        {formatFileSize(compressionStats.webpSize)}
                        <span className="ml-1 text-green-500">
                          ({compressionStats.webpRatio.toFixed(1)}% lebih kecil)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thumbnail WebP:</span>
                      <span className="font-medium text-gray-600">
                        {formatFileSize(compressionStats.thumbnailSize)}{" "}
                        (300x300)
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-1">
                      <span className="text-gray-700 font-medium">
                        Total penghematan WebP:
                      </span>
                      <span className="font-bold text-green-600">
                        {formatFileSize(
                          compressionStats.originalSize -
                            compressionStats.webpSize
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800">
                    <strong>📊 3 File yang akan disimpan:</strong>
                    <br />• <strong>compressed_image</strong>: JPG terkompresi
                    (fallback)
                    <br />• <strong>webp_image</strong>: WebP utama (loading
                    tercepat)
                    <br />• <strong>webp_thumbnail</strong>: Thumbnail WebP
                    300x300
                  </div>
                </div>
              )}

              {/* Preview Image */}
              {previewUrl && !isProcessing && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    Preview Gambar WebP:
                  </p>
                  <div className="relative border rounded-lg overflow-hidden">
                    <Image
                      src={previewUrl}
                      alt="Preview gambar WebP"
                      width={400}
                      height={200}
                      className="w-full h-48 object-contain bg-gray-100"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                      {compressionStats
                        ? `Format: WebP | Ukuran: ${formatFileSize(
                            compressionStats.webpSize
                          )} (${compressionStats.webpRatio.toFixed(
                            1
                          )}% lebih kecil dari asli)`
                        : ""}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Informasi Optimasi */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700">
                <strong>🎯 Fitur Optimasi Lengkap:</strong>
                <br />• <strong>Kompresi Client-side</strong>: JPG 70% kualitas,
                max 1200px
                <br />• <strong>Konversi WebP</strong>: 75% kualitas, 30% lebih
                kecil dari JPG
                <br />• <strong>Thumbnail WebP</strong>: 300x300px untuk preview
                cepat
                <br />• <strong>3 Format Database</strong>: JPG fallback + WebP
                utama + thumbnail
                <br />• <strong>Browser Auto-select</strong>: WebP untuk browser
                modern
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={loading || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Batal"
                )}
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  isProcessing ||
                  formData.kegiatan.length < 10 ||
                  formData.kendala.length < 5
                }
                className="flex-1 bg-[#0097BB] hover:bg-[#007b9e] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mengunggah...
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengoptimasi...
                  </>
                ) : (
                  "Simpan Logbook"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
