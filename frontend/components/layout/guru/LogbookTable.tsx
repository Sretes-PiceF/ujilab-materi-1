"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User,
  Calendar,
  BookOpen,
  Eye,
  MoreHorizontal,
  Trash2,
  CheckSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogbook, LogbookEntry } from "@/hooks/useLogbook";
import { LogbookUpdateModal } from "../guru/update/LogbookModal";
import LogbookDetailModal from "./detail/LogbookDetail";
import { supabase } from "@/lib/supabaseClient";

// Fungsi untuk mendapatkan class CSS berdasarkan status
const getStatusClasses = (status: LogbookEntry["status_verifikasi"]) => {
  switch (status) {
    case "disetujui":
      return "bg-green-100 text-green-700 border-green-200";
    case "pending":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "ditolak":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusLabel = (status: LogbookEntry["status_verifikasi"]) => {
  switch (status) {
    case "disetujui":
      return "Disetujui";
    case "pending":
      return "Belum Diverifikasi";
    case "ditolak":
      return "Ditolak";
    default:
      return status;
  }
};

// Komponen Loading Skeleton
const TableLoadingSkeleton = () => {
  return (
    <tbody className="bg-white divide-y divide-gray-100">
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-3 py-4">
            <div className="flex items-start space-x-3">
              <div className="h-9 w-9 bg-gray-200 rounded-full shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </td>
          <td className="px-3 py-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            </div>
          </td>
          <td className="px-3 py-4">
            <div className="h-6 bg-gray-200 rounded-lg w-24"></div>
          </td>
          <td className="px-3 py-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </td>
          <td className="px-3 py-4">
            <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

export function LogbookTable() {
  const { logbookList, meta, error, fetchLogbook } = useLogbook();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [processing, setProcessing] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State untuk modal
  const [selectedUpdateLogbook, setSelectedUpdateLogbook] =
    useState<LogbookEntry | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailLogbook, setSelectedDetailLogbook] =
    useState<LogbookEntry | null>(null);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await fetchLogbook({
          page: currentPage,
          per_page: entriesPerPage,
          search: searchTerm,
          status: statusFilter,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Debounced search
  useEffect(() => {
    if (isLoading) return; // Skip jika masih loading awal

    const timer = setTimeout(async () => {
      setIsRefreshing(true);
      try {
        await fetchLogbook({
          page: currentPage,
          per_page: entriesPerPage,
          search: searchTerm,
          status: statusFilter,
        });
      } finally {
        setIsRefreshing(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, entriesPerPage, currentPage]);

  // Real-time subscription
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("logbook-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "logbook",
        },
        async () => {
          await handleAutoRefresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "logbook",
        },
        async (payload) => {
          if (
            payload.new.status_verifikasi !== payload.old?.status_verifikasi
          ) {
            await handleAutoRefresh();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "logbook",
        },
        async () => {
          await handleAutoRefresh();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Auto-refresh function
  const handleAutoRefresh = useCallback(async () => {
    try {
      await fetchLogbook({
        page: currentPage,
        per_page: entriesPerPage,
        search: searchTerm,
        status: statusFilter,
      });
    } catch (error) {
      // Silent error handling
    }
  }, [currentPage, entriesPerPage, searchTerm, statusFilter, fetchLogbook]);

  // Handle filter changes
  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const handleEntriesPerPageChange = (newPerPage: number) => {
    setEntriesPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handler untuk delete logbook
  const handleDelete = async (entry: LogbookEntry) => {
    if (!confirm("Apakah Anda yakin ingin menghapus logbook ini?")) {
      return;
    }

    setProcessing(entry.id);

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          `http://localhost:8000/api/logbook/delete/${entry.id}`
        }/logbook/delete/${entry.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        await fetchLogbook({
          page: currentPage,
          per_page: entriesPerPage,
          search: searchTerm,
          status: statusFilter,
        });
        alert("Logbook berhasil dihapus");
      } else {
        alert(result.message || "Gagal menghapus logbook");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menghapus logbook");
    } finally {
      setProcessing(null);
    }
  };

  // Handler untuk update status
  const handleUpdateStatus = (entry: LogbookEntry) => {
    setSelectedUpdateLogbook(entry);
    setShowStatusUpdate(true);
    setShowUpdateModal(true);
  };

  // Handler untuk update logbook
  const handleUpdateLogbook = async (data: any) => {
    if (!selectedUpdateLogbook) return false;

    setProcessing(selectedUpdateLogbook.id);

    try {
      const token = localStorage.getItem("access_token");

      const formDataToSend = new FormData();
      formDataToSend.append("kegiatan", data.kegiatan);
      formDataToSend.append("kendala", data.kendala);

      if (data.file) {
        formDataToSend.append("file", data.file);
      }

      if (data.removeFile) {
        formDataToSend.append("remove_file", "1");
      }

      if (showStatusUpdate && data.status_verifikasi) {
        formDataToSend.append("status_verifikasi", data.status_verifikasi);
        if (data.catatan_guru) {
          formDataToSend.append("catatan_guru", data.catatan_guru);
        }
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          `http://localhost:8000/api/logbook/update/${selectedUpdateLogbook.id}`
        }/logbook/update/${selectedUpdateLogbook.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: formDataToSend,
        }
      );

      const result = await response.json();

      if (result.success) {
        await fetchLogbook({
          page: currentPage,
          per_page: entriesPerPage,
          search: searchTerm,
          status: statusFilter,
        });

        if (showStatusUpdate) {
          alert("Logbook dan status verifikasi berhasil diupdate");
        } else {
          alert("Logbook berhasil diupdate");
        }
        return true;
      } else {
        alert(result.message || "Gagal mengupdate logbook");
        return false;
      }
    } catch (err) {
      alert("Terjadi kesalahan saat mengupdate logbook");
      return false;
    } finally {
      setProcessing(null);
    }
  };

  // Handler untuk view detail
  const handleViewDetail = (entry: LogbookEntry) => {
    const baseUrl =
      process.env.NEXT_PUBLIC_LARAVEL_BASE_URL || "http://localhost:8000";

    const formattedEntry = {
      ...entry,
      optimized_size: entry.optimized_size || 0,
      original_size: entry.original_size || 0,
      webp_image_url: entry.webp_image
        ? `${baseUrl}/storage/${entry.webp_image}`
        : entry.file
        ? `${baseUrl}/storage/${entry.file}`
        : undefined,
      file_url: entry.file ? `${baseUrl}/storage/${entry.file}` : undefined,
      webp_thumbnail_url: entry.webp_thumbnail
        ? `${baseUrl}/storage/${entry.webp_thumbnail}`
        : undefined,
    };

    setSelectedDetailLogbook(formattedEntry);
    setIsDetailModalOpen(true);
  };

  const getPageNumbers = () => {
    const totalPages = meta.last_page || 1;
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  if (error) {
    return (
      <Card className="shadow-sm rounded-lg border-0">
        <CardContent className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error: {error}</p>
            <button
              onClick={() => fetchLogbook()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm rounded-lg border-0">
        <CardHeader className="py-4 px-6 border-b border-gray-200">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
              <BookOpen className="h-5 w-5 mr-2 text-cyan-600" />
              Daftar Logbook Harian
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* BARIS PENCARIAN & FILTER */}
          <div className="flex items-center justify-between mb-6 space-x-4">
            <div className="w-full max-w-lg">
              <input
                type="text"
                placeholder="Cari siswa, kegiatan, atau kendala..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0097BB] focus:border-transparent transition-colors shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center text-sm text-gray-600 space-x-4">
              <div className="flex items-center">
                <label htmlFor="filter-status" className="mr-2">
                  Status:
                </label>
                <select
                  id="filter-status"
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isLoading}
                  className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0097BB] focus:border-[#0097BB] appearance-none bg-white transition-colors text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="all">Semua</option>
                  <option value="pending">Belum Diverifikasi</option>
                  <option value="disetujui">Disetujui</option>
                  <option value="ditolak">Ditolak</option>
                </select>
              </div>

              <div className="flex items-center">
                <label
                  htmlFor="show-entries"
                  className="mr-2 whitespace-nowrap"
                >
                  Per halaman:
                </label>
                <select
                  id="show-entries"
                  value={entriesPerPage}
                  onChange={(e) =>
                    handleEntriesPerPageChange(Number(e.target.value))
                  }
                  disabled={isLoading}
                  className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0097BB] focus:border-[#0097BB] appearance-none bg-white transition-colors text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE LOGBOOK */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/6">
                    Tanggal & Foto
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">
                    Kegiatan & Kendala
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-auto">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">
                    Catatan Verifikasi
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                    Aksi
                  </th>
                </tr>
              </thead>

              {/* Loading State */}
              {isLoading ? (
                <TableLoadingSkeleton />
              ) : logbookList.length === 0 ? (
                <tbody className="bg-white">
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center">
                      <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">
                        {searchTerm || statusFilter !== "all"
                          ? "Tidak ada data logbook yang sesuai dengan pencarian"
                          : "Belum ada data logbook"}
                      </p>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="bg-white divide-y divide-gray-100">
                  {logbookList.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-4 align-top whitespace-nowrap">
                        <div className="flex items-start space-x-3">
                          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-cyan-100 text-[#0097BB] shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {entry.siswa.nama}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              NIS: {entry.siswa.nis}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              {entry.tanggal_formatted}
                            </p>
                            {(entry.file || entry.webp_image) && (
                              <p className="text-xs text-[#0097BB] mt-1 italic">
                                Ada foto dokumentasi
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4 align-top text-sm">
                        <p className="font-medium text-gray-800">
                          <span className="font-bold text-gray-900">
                            Kegiatan:
                          </span>{" "}
                          {entry.kegiatan.length > 100
                            ? `${entry.kegiatan.substring(0, 100)}...`
                            : entry.kegiatan}
                        </p>
                        <p className="mt-2 text-gray-600">
                          <span className="font-bold text-gray-900">
                            Kendala:
                          </span>{" "}
                          {entry.kendala.length > 100
                            ? `${entry.kendala.substring(0, 100)}...`
                            : entry.kendala}
                        </p>
                      </td>

                      <td className="px-3 py-4 align-top whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusClasses(
                            entry.status_verifikasi
                          )}`}
                        >
                          {getStatusLabel(entry.status_verifikasi)}
                        </span>
                      </td>

                      <td className="px-3 py-4 align-top text-sm text-gray-600">
                        <div className="space-y-2">
                          <p>
                            <span className="font-bold text-gray-900">
                              Guru:
                            </span>{" "}
                            {entry.catatan_guru || "Belum ada catatan"}
                          </p>
                          {entry.catatan_dudi && (
                            <p>
                              <span className="font-bold text-gray-900">
                                DUDI:
                              </span>{" "}
                              {entry.catatan_dudi}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-4 align-top whitespace-nowrap text-left text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="text-gray-400 hover:text-[#0097BB] transition-colors p-1 rounded-md"
                                title="Aksi Lainnya"
                                disabled={processing === entry.id}
                              >
                                {processing === entry.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0097BB]"></div>
                                ) : (
                                  <MoreHorizontal className="h-5 w-5" />
                                )}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem
                                onClick={() => handleViewDetail(entry)}
                                className="cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(entry)}
                                className="cursor-pointer"
                              >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(entry)}
                                className="cursor-pointer text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus Logbook
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>

            {/* Pagination */}
            {!isLoading && logbookList.length > 0 && (
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4 text-sm text-gray-600">
                <span>
                  Menampilkan {meta.from || 0} sampai {meta.to || 0} dari{" "}
                  {meta.total} entri
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isRefreshing}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &lt;
                  </button>
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={isRefreshing}
                      className={`p-2 border border-gray-200 rounded-lg transition-colors disabled:cursor-not-allowed ${
                        currentPage === page
                          ? "bg-[#0097BB] text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === meta.last_page || isRefreshing}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Update */}
      <LogbookUpdateModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedUpdateLogbook(null);
          setShowStatusUpdate(false);
        }}
        onSave={handleUpdateLogbook}
        logbook={selectedUpdateLogbook}
        title={
          showStatusUpdate
            ? "Edit Logbook & Update Status"
            : "Edit Logbook Siswa"
        }
        showStatusUpdate={showStatusUpdate}
      />

      {/* Modal Detail */}
      <LogbookDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailLogbook(null);
        }}
        entry={selectedDetailLogbook}
      />
    </>
  );
}
