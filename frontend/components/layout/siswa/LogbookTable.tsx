// components/layout/siswa/LogbookTable.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Calendar,
  Camera,
  Eye,
  Pencil,
  Trash2,
  Plus,
  AlertCircle,
} from "lucide-react";
import { useLogbook, LogbookData } from "@/hooks/siswa/useLogbook";
import { TambahLogbookModal } from "./create/LogbookModal"; // Import modal
import { LogbookUpdateModal } from "./update/LogbookUpdate";

// Props untuk komponen
interface LogbookTableProps {
  onAddLogbook?: () => void;
  onViewDetail?: (logbook: LogbookData) => void;
  onEdit?: (logbook: LogbookData) => void;
  onDelete?: (logbook: LogbookData) => void;
  statusMagang?: string;
  showAddButton?: boolean;
  refreshTrigger?: number; // Untuk refresh data setelah tambah logbook
}

// Map status dari backend ke frontend
const mapStatus = (status: string): string => {
  switch (status) {
    case "pending":
      return "Belum Diverifikasi";
    case "approved":
      return "Disetujui";
    case "rejected":
      return "Ditolak";
    default:
      return status;
  }
};

// Map status untuk filter
const mapStatusToBackend = (status: string): string => {
  switch (status) {
    case "Belum Diverifikasi":
      return "pending";
    case "Disetujui":
      return "approved";
    case "Ditolak":
      return "rejected";
    default:
      return "all";
  }
};

export function LogbookTable({
  showAddButton = false,
  onAddLogbook,
  onViewDetail,
  onEdit,
  onDelete,
  statusMagang,
  refreshTrigger = 0,
}: LogbookTableProps) {
  const { logbooks, loading, error, pagination, fetchLogbooks, deleteLogbook } =
    useLogbook();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTambahModal, setShowTambahModal] = useState(false);
  const [selectedLogbook, setSelectedLogbook] = useState<LogbookData | null>(
    null
  );
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Cek apakah siswa bisa menambah logbook (magang sedang berlangsung)
  const canAddLogbook = statusMagang === "berlangsung";

  // Refresh data ketika refreshTrigger berubah atau modal tambah ditutup
  useEffect(() => {
    const backendStatus =
      statusFilter === "Semua" ? "all" : mapStatusToBackend(statusFilter);
    fetchLogbooks(currentPage, entriesPerPage, searchTerm, backendStatus);
  }, [refreshTrigger]);

  // Handler untuk search dan filter
  const handleSearch = () => {
    const backendStatus =
      statusFilter === "Semua" ? "all" : mapStatusToBackend(statusFilter);
    fetchLogbooks(1, entriesPerPage, searchTerm, backendStatus);
    setCurrentPage(1);
  };

  // Handler untuk perubahan halaman
  const handlePageChange = (page: number) => {
    const backendStatus =
      statusFilter === "Semua" ? "all" : mapStatusToBackend(statusFilter);
    fetchLogbooks(page, entriesPerPage, searchTerm, backendStatus);
    setCurrentPage(page);
  };

  // Handler untuk perubahan entries per page
  const handleEntriesPerPageChange = (value: number) => {
    setEntriesPerPage(value);
    const backendStatus =
      statusFilter === "Semua" ? "all" : mapStatusToBackend(statusFilter);
    fetchLogbooks(1, value, searchTerm, backendStatus);
    setCurrentPage(1);
  };

  // Auto search ketika search term berubah (dengan debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== "" || statusFilter !== "Semua") {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  // Fungsi untuk menentukan apakah aksi (edit/hapus) harus ditampilkan
  const shouldShowActions = (logbook: LogbookData): boolean => {
    // Hanya tampilkan aksi jika status belum diverifikasi (pending)
    return logbook.status_verifikasi === "pending";
  };

  // Handler untuk tombol aksi
  const handleViewDetail = (logbook: LogbookData) => {
    if (onViewDetail) {
      onViewDetail(logbook);
    } else {
      console.log("View detail:", logbook);
    }
  };

  // Handler untuk edit logbook
  const handleEdit = (logbook: LogbookData) => {
    // Cek apakah magang masih berlangsung
    if (!canAddLogbook) {
      alert(
        "Anda tidak dapat mengedit logbook karena magang sudah selesai atau belum dimulai"
      );
      return;
    }

    // Cek apakah logbook masih bisa diedit (hanya yang pending)
    if (logbook.status_verifikasi !== "pending") {
      alert("Logbook yang sudah diverifikasi tidak dapat diedit");
      return;
    }

    // Buka modal edit
    setSelectedLogbook(logbook);
    setShowUpdateModal(true);

    // Call parent callback jika ada
    if (onEdit) {
      onEdit(logbook);
    }
  };

  const handleDelete = async (logbook: LogbookData) => {
    // Cek apakah magang masih berlangsung
    if (!canAddLogbook) {
      alert(
        "Anda tidak dapat menghapus logbook karena magang sudah selesai atau belum dimulai"
      );
      return;
    }

    // Cek apakah logbook masih bisa dihapus (hanya yang pending)
    if (logbook.status_verifikasi !== "pending") {
      alert("Logbook yang sudah diverifikasi tidak dapat dihapus");
      return;
    }

    if (
      confirm(
        `Apakah Anda yakin ingin menghapus logbook tanggal ${logbook.tanggal_formatted}?`
      )
    ) {
      try {
        const result = await deleteLogbook(logbook.id);
        if (result.success) {
          alert("Logbook berhasil dihapus");
          // Refresh data
          const backendStatus =
            statusFilter === "Semua" ? "all" : mapStatusToBackend(statusFilter);
          fetchLogbooks(currentPage, entriesPerPage, searchTerm, backendStatus);

          // Call parent callback jika ada
          if (onDelete) {
            onDelete(logbook);
          }
        } else {
          alert("Gagal menghapus logbook: " + result.message);
        }
      } catch (error) {
        console.error("Error deleting logbook:", error);
        alert("Terjadi kesalahan saat menghapus logbook");
      }
    }
  };

  const handleAddLogbook = () => {
    if (!canAddLogbook) {
      alert(
        "Anda tidak dapat menambah logbook karena magang belum dimulai atau sudah selesai"
      );
      return;
    }

    // Buka modal tambah logbook
    setShowTambahModal(true);

    // Call parent callback jika ada
    if (onAddLogbook) {
      onAddLogbook();
    }
  };

  const handleSuccessTambahLogbook = () => {
    console.log("Logbook berhasil ditambahkan");
    // Refresh data
    const backendStatus =
      statusFilter === "Semua" ? "all" : mapStatusToBackend(statusFilter);
    fetchLogbooks(currentPage, entriesPerPage, searchTerm, backendStatus);

    // Tutup modal
    setShowTambahModal(false);
  };

  // Format status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  // Get status message untuk info box
  const getStatusMessage = () => {
    if (statusMagang === "pending" || statusMagang === "diterima") {
      return {
        type: "info",
        message:
          "Magang Anda belum dimulai. Anda dapat menambah logbook setelah magang berlangsung.",
      };
    } else if (
      statusMagang === "selesai" ||
      statusMagang === "ditolak" ||
      statusMagang === "dibatalkan"
    ) {
      return {
        type: "warning",
        message:
          "Magang Anda sudah selesai/dibatalkan. Anda tidak dapat menambah atau mengedit logbook.",
      };
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 mb-4">Error: {error}</p>
        <button
          onClick={() => fetchLogbooks()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // Handler setelah update berhasil
  const handleSuccessUpdate = () => {
    console.log("Logbook berhasil diupdate");
    // Refresh data
    const backendStatus =
      statusFilter === "Semua" ? "all" : mapStatusToBackend(statusFilter);
    fetchLogbooks(currentPage, entriesPerPage, searchTerm, backendStatus);

    // Tutup modal
    setShowUpdateModal(false);
    setSelectedLogbook(null);
  };

  return (
    <div className="space-y-4">
      {/* Info Status Magang - Hanya muncul jika magang belum mulai atau sudah selesai */}
      {statusMessage && (
        <div
          className={`rounded-xl p-4 flex items-start gap-3 ${
            statusMessage.type === "info"
              ? "bg-blue-50 border border-blue-200"
              : "bg-amber-50 border border-amber-200"
          }`}
        >
          <AlertCircle
            className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
              statusMessage.type === "info" ? "text-blue-600" : "text-amber-600"
            }`}
          />
          <p
            className={`text-sm ${
              statusMessage.type === "info" ? "text-blue-800" : "text-amber-800"
            }`}
          >
            {statusMessage.message}
          </p>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        {/* Header Card dengan Daftar Logbook Harian dan Tombol */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#4FC3F7]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Daftar Logbook Harian
            </h2>
          </div>

          {/* Tombol Tambah Logbook - Hanya muncul jika magang berlangsung */}
          {showAddButton && (
            <button
              onClick={handleAddLogbook}
              className="px-4 py-2 bg-[#4FC3F7] text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow"
            >
              <Plus className="h-4 w-4" /> Tambah Logbook
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari kegiatan atau kendala..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">
                  Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Semua">Semua</option>
                  <option value="Belum Diverifikasi">Belum Diverifikasi</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">
                  Per halaman:
                </label>
                <select
                  value={entriesPerPage}
                  onChange={(e) =>
                    handleEntriesPerPageChange(Number(e.target.value))
                  }
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white border-b border-gray-200 min-w-[800px]">
            <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">
              Tanggal & Foto
            </div>
            <div className="col-span-4 text-xs font-semibold text-gray-600 uppercase">
              Kegiatan & Kendala
            </div>
            <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase text-center">
              Status
            </div>
            <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase">
              Catatan Verifikasi
            </div>
            <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase text-center">
              Aksi
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100 min-w-[800px]">
            {loading ? (
              <div className="px-6 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4FC3F7] mx-auto"></div>
                <p className="text-gray-500 mt-2">Memuat data logbook...</p>
              </div>
            ) : logbooks.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== "Semua"
                    ? "Tidak ada data logbook yang sesuai dengan pencarian"
                    : "Belum ada data logbook"}
                </p>
              </div>
            ) : (
              logbooks.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  {/* Tanggal & Foto */}
                  <div className="col-span-2 flex items-start gap-3">
                    <div className="h-11 w-11 rounded-lg bg-[#4FC3F7] flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">
                        {log.tanggal_formatted}
                      </p>
                      {log.file && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Camera className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-xs text-blue-600 font-medium">
                            Ada foto
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kegiatan & Kendala */}
                  <div className="col-span-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        Kegiatan:
                      </p>
                      <p className="text-sm text-gray-900 line-clamp-2 leading-relaxed">
                        {log.kegiatan}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        Kendala:
                      </p>
                      <p className="text-sm text-gray-900 line-clamp-2 leading-relaxed">
                        {log.kendala}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusClass(
                        log.status_verifikasi
                      )}`}
                    >
                      {mapStatus(log.status_verifikasi)}
                    </span>
                  </div>

                  {/* Catatan Verifikasi */}
                  <div className="col-span-3 space-y-2">
                    {log.catatan_guru ? (
                      <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-lg">
                        <p className="text-xs font-semibold text-blue-700 mb-1">
                          Guru:
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                          {log.catatan_guru}
                        </p>
                      </div>
                    ) : null}
                    {log.catatan_dudi ? (
                      <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-lg">
                        <p className="text-xs font-semibold text-purple-700 mb-1">
                          DUDI:
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                          {log.catatan_dudi}
                        </p>
                      </div>
                    ) : null}
                    {!log.catatan_guru && !log.catatan_dudi && (
                      <p className="text-xs text-gray-400 italic">
                        Belum ada catatan
                      </p>
                    )}
                  </div>

                  {/* Aksi */}
                  <div className="col-span-1 flex items-center justify-center gap-1">
                    {/* Tombol Lihat Detail - SELALU muncul untuk semua status */}
                    <button
                      onClick={() => handleViewDetail(log)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Tombol Edit - Hanya muncul jika status pending DAN magang berlangsung */}
                    {shouldShowActions(log) && canAddLogbook && (
                      <button
                        onClick={() => handleEdit(log)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}

                    {/* Tombol Hapus - Hanya muncul jika status pending DAN magang berlangsung */}
                    {shouldShowActions(log) && canAddLogbook && (
                      <button
                        onClick={() => handleDelete(log)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    {/* Pesan jika tidak ada aksi yang tersedia */}
                    {!shouldShowActions(log) && (
                      <span className="text-xs text-gray-400 italic">
                        Tidak ada aksi
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {!loading && logbooks.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-600">
              Menampilkan{" "}
              <span className="font-semibold">{pagination.from}</span> sampai{" "}
              <span className="font-semibold">{pagination.to}</span> dari{" "}
              <span className="font-semibold">{pagination.total}</span> logbook
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              {Array.from(
                { length: pagination.last_page },
                (_, i) => i + 1
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                    currentPage === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.last_page}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
      <LogbookUpdateModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedLogbook(null);
        }}
        onSuccess={handleSuccessUpdate}
        logbook={selectedLogbook}
      />
      {/* Modal Tambah Logbook */}
      <TambahLogbookModal
        open={showTambahModal}
        onOpenChange={setShowTambahModal}
        onSuccess={handleSuccessTambahLogbook}
      />
    </div>
  );
}
