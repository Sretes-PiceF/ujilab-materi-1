// components/layout/siswa/update/LogbookUpdateModal.tsx
"use client";
import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Upload,
  Image,
  FileText,
  AlertCircle,
} from "lucide-react";
import { LogbookData } from "@/hooks/siswa/useLogbook";

interface LogbookUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  logbook?: LogbookData | null;
}

interface UpdateFormData {
  tanggal: string;
  kegiatan: string;
  kendala: string;
  file: File | null;
}

export function LogbookUpdateModal({
  isOpen,
  onClose,
  onSuccess,
  logbook,
}: LogbookUpdateModalProps) {
  const [formData, setFormData] = useState<UpdateFormData>({
    tanggal: "",
    kegiatan: "",
    kendala: "",
    file: null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Reset form ketika modal dibuka/tutup atau logbook berubah
  useEffect(() => {
    if (isOpen && logbook) {
      setError(null);
      setShowError(false);
      setFieldErrors({});
      setPreviewUrl(null);

      // Format tanggal untuk input date (YYYY-MM-DD)
      const tanggal = new Date(logbook.tanggal).toISOString().split("T")[0];

      setFormData({
        tanggal: tanggal,
        kegiatan: logbook.kegiatan || "",
        kendala: logbook.kendala || "",
        file: null,
      });

      // Set preview URL jika ada file
      if (logbook.file_url) {
        setPreviewUrl(logbook.file_url);
      }
    }
  }, [isOpen, logbook]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      // Validasi tipe file
      if (!file.type.startsWith("image/")) {
        setFieldErrors((prev) => ({
          ...prev,
          file: "File harus berupa gambar (JPEG, JPG, PNG)",
        }));
        return;
      }

      // Validasi ukuran file (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setFieldErrors((prev) => ({
          ...prev,
          file: "Ukuran file maksimal 2MB",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        file,
      }));

      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Clear field error
      if (fieldErrors.file) {
        setFieldErrors((prev) => ({
          ...prev,
          file: "",
        }));
      }
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      file: null,
    }));
    setPreviewUrl(null);

    // Clear field error
    if (fieldErrors.file) {
      setFieldErrors((prev) => ({
        ...prev,
        file: "",
      }));
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

    // Clear field error ketika user mulai mengetik
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (error) {
      setError(null);
      setShowError(false);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setShowError(false);
    setFieldErrors({});

    // Validasi client-side
    const errors: Record<string, string> = {};

    if (!formData.tanggal) {
      errors.tanggal = "Tanggal wajib diisi";
    } else {
      const selectedDate = new Date(formData.tanggal);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (selectedDate > today) {
        errors.tanggal = "Tanggal tidak boleh melebihi hari ini";
      }
    }

    if (!formData.kegiatan) {
      errors.kegiatan = "Kegiatan wajib diisi";
    } else if (formData.kegiatan.length < 10) {
      errors.kegiatan = "Kegiatan minimal 10 karakter";
    }

    if (!formData.kendala) {
      errors.kendala = "Kendala wajib diisi";
    } else if (formData.kendala.length < 5) {
      errors.kendala = "Kendala minimal 5 karakter";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append("tanggal", formData.tanggal);
      submitData.append("kegiatan", formData.kegiatan);
      submitData.append("kendala", formData.kendala);

      if (formData.file) {
        submitData.append("file", formData.file);
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${baseUrl}/siswa/logbook/update/${logbook?.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: submitData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 422) {
          setFieldErrors(result.errors || {});
          throw new Error(
            result.message || "Validasi gagal, periksa kembali data yang diisi"
          );
        } else if (response.status === 403) {
          throw new Error(result.message || "Logbook tidak dapat diedit");
        } else if (response.status === 401) {
          throw new Error("Sesi telah berakhir. Silakan login kembali.");
        } else {
          throw new Error(result.message || "Gagal mengupdate logbook");
        }
      }

      if (!result.success) {
        throw new Error(result.message || "Gagal mengupdate logbook");
      }

      // Success
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengupdate logbook");
      setShowError(true);

      // Auto-hide error setelah 6 detik
      setTimeout(() => {
        setShowError(false);
      }, 6000);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      tanggal: "",
      kegiatan: "",
      kendala: "",
      file: null,
    });
    setPreviewUrl(null);
    setError(null);
    setShowError(false);
    setFieldErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#0097BB]" />
            Edit Logbook
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Error Alert dengan Animasi */}
          {showError && error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-400 rounded-lg p-4 shadow-lg relative overflow-hidden animate-slideDown">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 animate-bounce">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 mb-1">
                    Update Gagal
                  </h3>
                  <p className="text-xs text-red-700">{error}</p>
                </div>
                <button
                  onClick={handleCloseError}
                  className="flex-shrink-0 text-red-600 hover:text-red-800 hover:bg-red-200 rounded-full p-1 transition-all"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 h-1 bg-red-600 rounded-b-lg animate-shrink"></div>
            </div>
          )}

          <div className="space-y-4">
            {/* Tanggal */}
            <div className="space-y-2">
              <label
                htmlFor="tanggal"
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <Calendar className="h-4 w-4 text-gray-500" />
                Tanggal Kegiatan
              </label>
              <input
                id="tanggal"
                type="date"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleChange}
                disabled={loading}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white"
              />
              {fieldErrors.tanggal && (
                <p className="text-red-500 text-xs animate-fadeIn">
                  {fieldErrors.tanggal}
                </p>
              )}
            </div>

            {/* Kegiatan */}
            <div className="space-y-2">
              <label
                htmlFor="kegiatan"
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <FileText className="h-4 w-4 text-gray-500" />
                Kegiatan Harian
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="kegiatan"
                name="kegiatan"
                value={formData.kegiatan}
                onChange={handleChange}
                disabled={loading}
                rows={4}
                placeholder="Deskripsikan kegiatan yang dilakukan hari ini (minimal 10 karakter)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white resize-none"
              />
              {fieldErrors.kegiatan && (
                <p className="text-red-500 text-xs animate-fadeIn">
                  {fieldErrors.kegiatan}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {formData.kegiatan.length}/10 karakter (minimal 10)
              </p>
            </div>

            {/* Kendala */}
            <div className="space-y-2">
              <label
                htmlFor="kendala"
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <FileText className="h-4 w-4 text-gray-500" />
                Kendala yang Dihadapi
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="kendala"
                name="kendala"
                value={formData.kendala}
                onChange={handleChange}
                disabled={loading}
                rows={3}
                placeholder="Deskripsikan kendala atau masalah yang dihadapi (minimal 5 karakter)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white resize-none"
              />
              {fieldErrors.kendala && (
                <p className="text-red-500 text-xs animate-fadeIn">
                  {fieldErrors.kendala}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {formData.kendala.length}/5 karakter (minimal 5)
              </p>
            </div>

            {/* Upload Foto */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Image className="h-4 w-4 text-gray-500" />
                Foto Dokumentasi (Opsional)
              </label>

              {/* File Input */}
              <div className="flex items-center gap-3">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="hidden"
                  />
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">
                        {formData.file ? formData.file.name : "Pilih file..."}
                      </span>
                    </div>
                  </div>
                </label>

                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    disabled={loading}
                    className="px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors text-sm"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {fieldErrors.file && (
                <p className="text-red-500 text-xs animate-fadeIn">
                  {fieldErrors.file}
                </p>
              )}

              {/* Preview */}
              {previewUrl && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 mb-2">Preview:</p>
                  <div className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Format: JPEG, JPG, PNG (maksimal 2MB)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#0097BB] text-white rounded-lg hover:bg-[#007b9e] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Mengupdate...
                </>
              ) : (
                "Update Logbook"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }

        .animate-shrink {
          animation: shrink 6s linear;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
      `}</style>
    </div>
  );
}
