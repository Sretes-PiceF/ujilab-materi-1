// components/layout/siswa/LogbookTable.tsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Camera,
  Eye,
  Pencil,
  Trash2,
  Plus,
  BookOpen,
} from "lucide-react";
import { useLogbook, LogbookData } from "@/hooks/siswa/useLogbook";
import { TambahLogbookModal } from "./create/LogbookModal";
import { LogbookUpdateModal } from "./update/LogbookUpdate";
import { supabase } from "@/lib/supabaseClient";

interface LogbookTableProps {
  onAddLogbook?: () => void;
  onViewDetail?: (logbook: LogbookData) => void;
  onEdit?: (logbook: LogbookData) => void;
  onDelete?: (logbook: LogbookData) => void;
  statusMagang?: string;
  showAddButton?: boolean;
  refreshTrigger?: number;
}

const mapStatus = (status: string): string => {
  switch (status) {
    case "pending":
      return "Belum Diverifikasi";
    case "disetujui":
      return "Disetujui";
    case "ditolak":
      return "Ditolak";
    default:
      return status;
  }
};

const mapStatusToBackend = (status: string): string => {
  switch (status) {
    case "Belum Diverifikasi":
      return "pending";
    case "Disetujui":
      return "disetujui";
    case "Ditolak":
      return "ditolak";
    default:
      return "all";
  }
};

// Komponen Loading Skeleton yang disesuaikan
const TableLoadingSkeleton = () => {
  return (
    <tbody className="bg-white divide-y divide-gray-100">
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-3 py-4">
            <div className="flex items-start space-x-3">
              <div className="h-11 w-11 bg-gray-200 rounded-lg shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </td>
          <td className="px-3 py-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          </td>
          <td className="px-3 py-4">
            <div className="h-6 bg-gray-200 rounded-lg w-24 mx-auto"></div>
          </td>
          <td className="px-3 py-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </td>
          <td className="px-3 py-4">
            <div className="flex items-center justify-center gap-1">
              <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

export function LogbookTable({
  showAddButton = false,
  onAddLogbook,
  onViewDetail,
  onEdit,
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

  // ✅ Penanda loading hanya pertama kali
  const isFirstLoad = useRef(true);

  const canAddLogbook =
    statusMagang === "berlangsung" || statusMagang === "diterima";

  // ✅ Fungsi refresh data dengan parameter yang jelas
  const refreshData = useCallback(
    async (page: number, perPage: number, search: string, status: string) => {
      const backendStatus =
        status === "Semua" ? "all" : mapStatusToBackend(status);
      await fetchLogbooks(page, perPage, search, backendStatus);
    },
    [fetchLogbooks]
  );

  // ✅ INITIAL DATA FETCH - sekali saat mount
  useEffect(() => {
    const initialFetch = async () => {
      try {
        await refreshData(1, 10, "", "Semua");
      } finally {
        isFirstLoad.current = false;
      }
    };

    initialFetch();
  }, [refreshData]);

  // ✅ REFRESH TRIGGER dari parent
  useEffect(() => {
    if (!isFirstLoad.current && refreshTrigger > 0) {
      refreshData(currentPage, entriesPerPage, searchTerm, statusFilter);
    }
  }, [
    refreshTrigger,
    currentPage,
    entriesPerPage,
    searchTerm,
    statusFilter,
    refreshData,
  ]);

  // ✅ REALTIME SUBSCRIPTION - refresh dengan state saat ini
  useEffect(() => {
    if (!supabase || isFirstLoad.current) return;

    const channel = supabase
      .channel("logbook-siswa-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "logbook",
        },
        async (payload) => {
          console.log("Logbook realtime event:", payload.eventType);
          // ✅ Silent refresh dengan state pagination saat ini
          await refreshData(
            currentPage,
            entriesPerPage,
            searchTerm,
            statusFilter
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPage, entriesPerPage, searchTerm, statusFilter, refreshData]);

  // ✅ SEARCH & FILTER dengan debounce (skip saat initial load)
  useEffect(() => {
    if (isFirstLoad.current) return;

    const timer = setTimeout(() => {
      refreshData(1, entriesPerPage, searchTerm, statusFilter);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, entriesPerPage, refreshData]);

  // Handler untuk perubahan halaman
  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    await refreshData(page, entriesPerPage, searchTerm, statusFilter);
  };

  // Handler untuk perubahan entries per page
  const handleEntriesPerPageChange = async (value: number) => {
    setEntriesPerPage(value);
    setCurrentPage(1);
    await refreshData(1, value, searchTerm, statusFilter);
  };

  const shouldShowActions = (logbook: LogbookData): boolean => {
    return logbook.status_verifikasi === "pending";
  };

  const handleViewDetail = (logbook: LogbookData) => {
    if (onViewDetail) {
      onViewDetail(logbook);
    } else {
      console.log("View detail:", logbook);
    }
  };

  const handleEdit = (logbook: LogbookData) => {
    if (!canAddLogbook) {
      alert(
        "Anda tidak dapat mengedit logbook karena magang sudah selesai atau belum dimulai"
      );
      return;
    }

    if (logbook.status_verifikasi !== "pending") {
      alert("Logbook yang sudah diverifikasi tidak dapat diedit");
      return;
    }

    setSelectedLogbook(logbook);
    setShowUpdateModal(true);

    if (onEdit) {
      onEdit(logbook);
    }
  };

  const handleDelete = async (logbook: LogbookData) => {
    if (!canAddLogbook) {
      alert(
        "Anda tidak dapat menghapus logbook karena magang sudah selesai atau belum dimulai"
      );
      return;
    }

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

    setShowTambahModal(true);

    if (onAddLogbook) {
      onAddLogbook();
    }
  };

  const handleSuccessTambahLogbook = () => {
    console.log("Logbook berhasil ditambahkan");
    setShowTambahModal(false);
  };

  const handleSuccessUpdate = () => {
    console.log("Logbook berhasil diupdate");
    setShowUpdateModal(false);
    setSelectedLogbook(null);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "disetujui":
        return "bg-green-100 text-green-700 border border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "ditolak":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getStatusMessage = () => {
    switch (statusMagang) {
      case "selesai":
      case "berlangsung":
        return {
          message: "Magang Anda sedang / telah selesai.",
          style: {
            bg: "bg-green-50 border-green-200",
            text: "text-green-800",
            icon: "text-green-600",
          },
        };

      case "ditolak":
      case "dibatalkan":
        return {
          message:
            "Magang Anda ditolak atau dibatalkan. Anda tidak dapat menambah atau mengedit logbook.",
          style: {
            bg: "bg-red-50 border-red-200",
            text: "text-red-800",
            icon: "text-red-600",
          },
        };

      case "diterima":
        return {
          message:
            "Magang Anda telah diterima. Silakan menunggu hingga magang berlangsung.",
          style: {
            bg: "bg-blue-100 border-blue-300",
            text: "text-blue-900",
            icon: "text-blue-700",
          },
        };

      case "pending":
      default:
        return {
          message: "Magang Anda masih dalam proses verifikasi.",
          style: {
            bg: "bg-amber-50 border-amber-200",
            text: "text-amber-800",
            icon: "text-amber-600",
          },
        };
    }
  };

  const statusMessage = getStatusMessage();

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 mb-4">Error: {error}</p>
        <button
          onClick={() =>
            refreshData(currentPage, entriesPerPage, searchTerm, statusFilter)
          }
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {statusMessage && (
        <div
          className={`rounded-xl p-4 flex items-start gap-3 border ${statusMessage.style.bg}`}
        >
          <p className={`text-sm ${statusMessage.style.text}`}>
            {statusMessage.message}
          </p>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#4FC3F7]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Daftar Logbook Harian
            </h2>
          </div>

          {showAddButton && (
            <button
              onClick={handleAddLogbook}
              className="px-4 py-2 bg-[#4FC3F7] text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading && isFirstLoad.current}
            >
              <Plus className="h-4 w-4" /> Tambah Logbook
            </button>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari kegiatan atau kendala..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading && isFirstLoad.current}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={loading && isFirstLoad.current}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={loading && isFirstLoad.current}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tanggal & Foto
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kegiatan & Kendala
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Catatan Verifikasi
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                  Aksi
                </th>
              </tr>
            </thead>

            {/* ✅ Loading State hanya untuk initial load */}
            {loading && isFirstLoad.current ? (
              <TableLoadingSkeleton />
            ) : logbooks.length === 0 ? (
              <tbody className="bg-white">
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">
                      {searchTerm || statusFilter !== "Semua"
                        ? "Tidak ada data logbook yang sesuai dengan pencarian"
                        : "Belum ada data logbook"}
                    </p>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="bg-white divide-y divide-gray-100">
                {logbooks.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-4 align-top whitespace-nowrap">
                      <div className="flex items-start space-x-3">
                        <div className="h-11 w-11 rounded-lg bg-[#4FC3F7] flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
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
                    </td>

                    <td className="px-3 py-4 align-top text-sm">
                      <div className="space-y-3">
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
                    </td>

                    <td className="px-3 py-4 align-top whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusClass(
                          log.status_verifikasi
                        )}`}
                      >
                        {mapStatus(log.status_verifikasi)}
                      </span>
                    </td>

                    <td className="px-3 py-4 align-top text-sm text-gray-600">
                      <div className="space-y-2">
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
                    </td>

                    <td className="px-3 py-4 align-top whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewDetail(log)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {shouldShowActions(log) && canAddLogbook && (
                          <button
                            onClick={() => handleEdit(log)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}

                        {shouldShowActions(log) && canAddLogbook && (
                          <button
                            onClick={() => handleDelete(log)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}

                        {!shouldShowActions(log) && (
                          <span className="text-xs text-gray-400 italic">
                            Tidak ada aksi
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {/* Pagination */}
          {logbooks.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <p className="text-sm text-gray-600">
                Menampilkan{" "}
                <span className="font-semibold">{pagination.from}</span> sampai{" "}
                <span className="font-semibold">{pagination.to}</span> dari{" "}
                <span className="font-semibold">{pagination.total}</span>{" "}
                logbook
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

      <TambahLogbookModal
        open={showTambahModal}
        onOpenChange={setShowTambahModal}
        onSuccess={handleSuccessTambahLogbook}
      />
    </div>
  );
}
