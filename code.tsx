"use client";

import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  FileText,
  AlertCircle,
  Upload,
  Loader2,
  Check,
  X,
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
import imageCompression from "browser-image-compression";

interface TambahLogbookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface LogbookFormData {
  tanggal: string;
  kegiatan: string;
  kendala: string;
  file: File | null;
}

interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  timeTaken: number;
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
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressionStats, setCompressionStats] =
    useState<CompressionStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fungsi untuk format ukuran file
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Fungsi kompresi gambar di client-side
  const compressImage = async (file: File): Promise<File> => {
    setIsCompressing(true);
    setCompressionProgress(0);

    const startTime = Date.now();
    const originalSize = file.size;

    console.log(
      `🖼️ Memulai kompresi: ${file.name} (${formatFileSize(originalSize)})`
    );

    const options = {
      maxSizeMB: 1, // Maksimal 1MB setelah kompresi
      maxWidthOrHeight: 1920, // Resize ke maksimal 1920px
      useWebWorker: true, // Gunakan web worker untuk performa lebih baik
      initialQuality: 0.8, // Kualitas awal 80%
      onProgress: (progress: number) => {
        setCompressionProgress(Math.round(progress));
      },
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      const compressedSize = compressedFile.size;
      const compressionRatio =
        ((originalSize - compressedSize) / originalSize) * 100;

      console.log(`✅ Kompresi selesai:`);
      console.log(`   - Sebelum: ${formatFileSize(originalSize)}`);
      console.log(`   - Sesudah: ${formatFileSize(compressedSize)}`);
      console.log(`   - Rasio: ${compressionRatio.toFixed(1)}%`);
      console.log(`   - Waktu: ${timeTaken}ms`);

      setCompressionStats({
        originalSize,
        compressedSize,
        compressionRatio,
        timeTaken,
      });

      return compressedFile;
    } catch (error) {
      console.error("❌ Error kompresi:", error);
      throw error;
    } finally {
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  };

  // Konversi ke WebP (opsional, bisa dilakukan di server)
  const convertToWebP = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const webpFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, "") + ".webp",
                {
                  type: "image/webp",
                  lastModified: Date.now(),
                }
              );
              resolve(webpFile);
            } else {
              reject(new Error("Gagal mengonversi ke WebP"));
            }
          },
          "image/webp",
          0.8 // Kualitas 80%
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      // Validasi tipe file
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setFieldErrors((prev) => ({
          ...prev,
          file: "File harus berformat JPEG, JPG, PNG, atau WebP",
        }));
        return;
      }

      // Validasi ukuran file (max 5MB sebelum kompresi)
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors((prev) => ({
          ...prev,
          file: "Ukuran file maksimal 5MB sebelum kompresi",
        }));
        return;
      }

      try {
        // Langkah 1: Kompresi gambar
        console.log("📦 Memulai proses optimasi gambar...");
        const compressedFile = await compressImage(file);

        // Langkah 2: Buat preview
        const url = URL.createObjectURL(compressedFile);
        setPreviewUrl(url);

        // Set file yang sudah dikompres
        setFormData((prev) => ({
          ...prev,
          file: compressedFile,
        }));

        // Clear file error
        if (fieldErrors.file) {
          setFieldErrors((prev) => ({
            ...prev,
            file: "",
          }));
        }

        console.log("🎉 Optimasi gambar selesai!");
      } catch (error) {
        console.error("Error dalam proses optimasi:", error);
        setFieldErrors((prev) => ({
          ...prev,
          file: "Gagal mengoptimasi gambar. Silakan coba file lain.",
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi form
    if (formData.kegiatan.length < 10) {
      setFieldErrors((prev) => ({ ...prev, kegiatan: "Minimal 10 karakter" }));
      return;
    }

    if (formData.kendala.length < 5) {
      setFieldErrors((prev) => ({ ...prev, kendala: "Minimal 5 karakter" }));
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const token = localStorage.getItem("access_token");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Buat FormData
      const formDataToSend = new FormData();
      formDataToSend.append("tanggal", formData.tanggal);
      formDataToSend.append("kegiatan", formData.kegiatan);
      formDataToSend.append("kendala", formData.kendala);

      if (formData.file) {
        formDataToSend.append("file", formData.file);
        formDataToSend.append("file_name", formData.file.name);
        formDataToSend.append("file_size", formData.file.size.toString());
        formDataToSend.append("file_type", formData.file.type);
      }

      const response = await fetch(`${API_URL}/api/siswa/logbook/create`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
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
          file: null,
        });
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
      console.error("Error adding logbook:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      tanggal: new Date().toISOString().split("T")[0],
      kegiatan: "",
      kendala: "",
      file: null,
    });
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
                disabled={loading || isCompressing}
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
                disabled={loading || isCompressing}
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
                disabled={loading || isCompressing}
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

            {/* Upload Foto dengan Kompresi */}
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
                accept="image/jpeg, image/jpg, image/png, image/webp"
                onChange={handleFileChange}
                disabled={loading || isCompressing}
                className="bg-white"
                ref={fileInputRef}
              />

              <div className="text-xs text-gray-500">
                Format: JPEG, JPG, PNG, WebP | Maksimal: 5MB (akan dikompres
                otomatis)
              </div>

              {fieldErrors.file && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {fieldErrors.file}
                </p>
              )}

              {/* Progress Bar Kompresi */}
              {isCompressing && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-700">
                      Mengoptimasi gambar...
                    </span>
                    <span className="text-xs font-medium text-blue-700">
                      {compressionProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${compressionProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Mengurangi ukuran file untuk pengunggahan lebih cepat...
                  </p>
                </div>
              )}

              {/* Statistik Kompresi */}
              {compressionStats && !isCompressing && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">
                      ✅ Gambar berhasil dioptimasi
                    </span>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Ukuran asli:</span>
                      <span className="ml-2 font-medium">
                        {formatFileSize(compressionStats.originalSize)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Ukuran akhir:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {formatFileSize(compressionStats.compressedSize)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Penghematan:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {compressionStats.compressionRatio.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Waktu:</span>
                      <span className="ml-2 font-medium">
                        {compressionStats.timeTaken}ms
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Image */}
              {previewUrl && !isCompressing && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    Preview Gambar:
                  </p>
                  <div className="relative border rounded-lg overflow-hidden">
                    <Image
                      src={previewUrl}
                      alt="Preview gambar yang sudah dioptimasi"
                      width={400}
                      height={200}
                      className="w-full h-48 object-contain bg-gray-100"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                      Gambar siap diunggah (
                      {formatFileSize(formData.file?.size || 0)})
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Informasi */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>📸 Fitur Optimasi Gambar:</strong>
                <br />
                • Gambar dikompres otomatis sebelum upload
                <br />
                • Ukuran maksimal: 1MB setelah kompresi
                <br />
                • Resolusi disesuaikan untuk optimalisasi
                <br />• Proses berjalan di browser Anda
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={loading || isCompressing}
                className="flex-1"
              >
                {isCompressing ? (
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
                  isCompressing ||
                  formData.kegiatan.length < 10 ||
                  formData.kendala.length < 5
                }
                className="flex-1 bg-[#0097BB] hover:bg-[#007b9e] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mengunggah...
                  </>
                ) : isCompressing ? (
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
