// components/logbook/LogbookTable.tsx
"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLogbookMutations, LogbookEntry, useLogbookBatch, Siswa } from "@/hooks/useLogbook";
import { useNotification } from "@/components/ui/Notification/NotificationContext";
import {
  User,
  Calendar,
  BookOpen,
  Eye,
  Trash2,
  CheckSquare,
  Search,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogbookUpdateModal } from "../guru/update/LogbookModal";
import LogbookDetailModal from "./detail/LogbookDetail";

interface LogbookTableProps {
  onStatsUpdated?: (stats: any) => void;
  onDataUpdated?: (updatedLogbook: LogbookEntry[]) => void;
}

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

// ================ SKELETON LOADING COMPONENT ================
const TableSkeleton = () => {
  return (
    <tbody className="bg-white divide-y divide-gray-100">
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-4">
            <div className="flex items-start space-x-3">
              <div className="h-9 w-9 bg-gray-200 rounded-full shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
          </td>
          <td className="px-4 py-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

export default function LogbookTable({
  onStatsUpdated,
  onDataUpdated,
}: LogbookTableProps) {
  const {
    logbook: logbookData,
    stats: logbookStats,
    isLoading,
    isValidating,
    isCached,
    forceRefresh,
    markAsDeleted,
  } = useLogbookBatch({
    realTime: true,
    pollingInterval: 3000,
  });

  const {
    updateLogbook,
    verifikasiLogbook,
    deleteLogbook,
    clearCache,
    loading: mutating,
    clearErrors,
  } = useLogbookMutations();

  const { showNotification } = useNotification();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siswaFilter, setSiswaFilter] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogbook, setEditingLogbook] = useState<LogbookEntry | null>(null);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailLogbook, setSelectedDetailLogbook] = useState<LogbookEntry | null>(null);

  const prevLogbookDataRef = useRef<LogbookEntry[]>([]);
  const prevStatsRef = useRef<any>(null);
  const mountedRef = useRef(false);

  // ================ REAL-TIME STATS UPDATE ================
  useEffect(() => {
    if (!mountedRef.current || !logbookData || logbookData.length === 0) return;

    if (!prevStatsRef.current || 
        JSON.stringify(prevStatsRef.current) !== JSON.stringify(logbookStats)) {
      prevStatsRef.current = logbookStats;
      
      if (onStatsUpdated) {
        onStatsUpdated(logbookStats);
      }
    }

    if (onDataUpdated && 
        JSON.stringify(prevLogbookDataRef.current) !== JSON.stringify(logbookData)) {
      prevLogbookDataRef.current = [...logbookData];
      onDataUpdated(logbookData);
    }
  }, [logbookData, logbookStats, onStatsUpdated, onDataUpdated]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ================ HANDLERS ================
  const handleOpenEditModal = useCallback((logbook: LogbookEntry, statusUpdate: boolean = false) => {
    setEditingLogbook(logbook);
    setShowStatusUpdate(statusUpdate);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingLogbook(null);
    setShowStatusUpdate(false);
    clearErrors();
  }, [clearErrors]);

  const handleSaveLogbook = useCallback(async (formData: any) => {
    if (!editingLogbook) return false;

    try {
      if (showStatusUpdate) {
        await verifikasiLogbook(editingLogbook.id, {
          status_verifikasi: formData.status_verifikasi,
          catatan_guru: formData.catatan_guru,
        });
      } else {
        const updateData: any = {};
        if (formData.kegiatan) updateData.kegiatan = formData.kegiatan;
        if (formData.kendala) updateData.kendala = formData.kendala;
        if (formData.file) updateData.file = formData.file;
        if (formData.catatan_guru) updateData.catatan_guru = formData.catatan_guru;
        
        await updateLogbook(editingLogbook.id, updateData);
      }

      showNotification(
        showStatusUpdate
          ? "Status logbook berhasil diperbarui"
          : "Logbook berhasil diperbarui",
        "success"
      );

      handleCloseModal();
      return true;
    } catch (error: any) {
      showNotification(
        error.message || "Terjadi kesalahan saat menyimpan data",
        "error"
      );
      return false;
    }
  }, [editingLogbook, showStatusUpdate, verifikasiLogbook, updateLogbook, showNotification, handleCloseModal]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Yakin ingin menghapus logbook ini?")) return;

    try {
      setDeletingIds(prev => new Set([...prev, id]));
      markAsDeleted(id);

      await deleteLogbook(id);
      
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      showNotification("Logbook berhasil dihapus", "success");
    } catch (error: any) {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      showNotification(
        error.message || "Terjadi kesalahan saat menghapus data",
        "error"
      );
    }
  }, [deleteLogbook, markAsDeleted, showNotification]);

  const handleViewDetail = useCallback((logbook: LogbookEntry) => {
    const baseUrl = process.env.NEXT_PUBLIC_LARAVEL_BASE_URL || "http://localhost:8000";

    const formattedLogbook = {
      ...logbook,
      optimized_size: logbook.optimized_size || 0,
      original_size: logbook.original_size || 0,
      webp_image_url: logbook.webp_image
        ? `${baseUrl}/storage/${logbook.webp_image}`
        : logbook.file
        ? `${baseUrl}/storage/${logbook.file}`
        : undefined,
      file_url: logbook.file ? `${baseUrl}/storage/${logbook.file}` : undefined,
      webp_thumbnail_url: logbook.webp_thumbnail
        ? `${baseUrl}/storage/${logbook.webp_thumbnail}`
        : undefined,
    };

    setSelectedDetailLogbook(formattedLogbook);
    setIsDetailModalOpen(true);
  }, []);

  const handleManualRefresh = useCallback(async () => {
    try {
      await forceRefresh();
      showNotification("Data logbook berhasil diperbarui", "success");
    } catch {
      showNotification("Gagal memperbarui data", "error");
    }
  }, [forceRefresh, showNotification]);

  const handleClearCache = useCallback(async () => {
    try {
      await clearCache();
      showNotification("Cache berhasil dibersihkan", "success");
    } catch {
      showNotification("Gagal membersihkan cache", "error");
    }
  }, [clearCache, showNotification]);

  // ================ FILTER & PAGINATION ================
  const siswaList = useMemo(() => {
    const uniqueSiswa = new Map<number, Siswa>();
    logbookData.forEach((item) => {
      if (item.siswa && !uniqueSiswa.has(item.siswa.id)) {
        uniqueSiswa.set(item.siswa.id, item.siswa);
      }
    });
    return Array.from(uniqueSiswa.values());
  }, [logbookData]);

  // Sort data berdasarkan tanggal terbaru (descending)
  const sortedLogbookData = useMemo(() => {
    return [...logbookData].sort((a, b) => {
      return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
    });
  }, [logbookData]);

  // Filter data (tidak termasuk yang sedang di-delete)
  const filteredData = useMemo(() => {
    return sortedLogbookData.filter((item) => {
      // Skip data yang sedang di-delete
      if (deletingIds.has(item.id)) return false;
      
      const matchesSearch =
        item.siswa?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.siswa?.nis?.toString().includes(searchTerm) ||
        item.kegiatan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kendala?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || item.status_verifikasi === statusFilter;
      const matchesSiswa = siswaFilter === "all" || item.siswa?.id?.toString() === siswaFilter;

      return matchesSearch && matchesStatus && matchesSiswa;
    });
  }, [sortedLogbookData, searchTerm, statusFilter, siswaFilter, deletingIds]);

  // Hitung total pages berdasarkan filteredData
  const totalPages = Math.max(1, Math.ceil(filteredData.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredData.length);
  
  // Data yang ditampilkan untuk halaman saat ini
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, startIndex, endIndex]);

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, siswaFilter, entriesPerPage]);

  // Fungsi untuk generate nomor halaman yang ditampilkan
  const getVisiblePageNumbers = useCallback(() => {
    const maxVisiblePages = 5;
    const halfVisiblePages = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisiblePages);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }, [currentPage, totalPages]);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  }, []);

  // Tambah kolom No jika ada data
  const tableHeaders = useMemo(() => {
    const headers = [
      "Siswa & Tanggal",
      "Kegiatan & Kendala",
      "Status",
      "Catatan",
      "Aksi"
    ];
    
    return headers;
  }, []);

  return (
    <div className="space-y-6">
      {isModalOpen && editingLogbook && (
        <LogbookUpdateModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveLogbook}
          logbook={editingLogbook}
          title={showStatusUpdate ? "Verifikasi Logbook" : "Edit Logbook"}
          showStatusUpdate={showStatusUpdate}
        />
      )}

      <LogbookDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailLogbook(null);
        }}
        entry={selectedDetailLogbook}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Data Logbook</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className={`h-2 w-2 rounded-full ${isCached ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className="text-xs text-gray-500">
              {isValidating ? "Memperbarui..." : isCached ? "Data cache" : "Data realtime"}
            </span>
            {deletingIds.size > 0 && (
              <span className="text-xs text-orange-500">
                • Menghapus {deletingIds.size} data
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleClearCache}
            disabled={mutating || isValidating}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Clear Cache
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={mutating}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? "Memperbarui..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari siswa, NIS, kegiatan, atau kendala..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <label htmlFor="filter-siswa" className="mr-2 whitespace-nowrap">
              <User className="h-4 w-4 inline mr-1" />
              Siswa:
            </label>
            <select
              id="filter-siswa"
              value={siswaFilter}
              onChange={(e) => setSiswaFilter(e.target.value)}
              className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors text-sm"
            >
              <option value="all">Semua Siswa</option>
              {siswaList.map((siswa) => (
                <option key={siswa.id} value={siswa.id.toString()}>
                  {siswa.nama} ({siswa.nis})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label htmlFor="filter-status" className="mr-2 whitespace-nowrap">
              <Filter className="h-4 w-4 inline mr-1" />
              Status:
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors text-sm"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Belum Diverifikasi</option>
              <option value="disetujui">Disetujui</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>

          <div className="flex items-center">
            <label htmlFor="show-entries" className="mr-2 whitespace-nowrap">
              Per halaman:
            </label>
            <select
              id="show-entries"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {tableHeaders.map((header, index) => (
                  <th 
                    key={index}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            {isLoading && logbookData.length === 0 ? (
              <TableSkeleton />
            ) : filteredData.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium mb-1">
                        {searchTerm || statusFilter !== "all" || siswaFilter !== "all"
                          ? "Tidak ada data logbook yang sesuai dengan pencarian"
                          : "Belum ada data logbook"}
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedData.map((entry, index) => {
                  const isDeleting = deletingIds.has(entry.id);
                  
                  return (
                    <tr 
                      key={entry.id} 
                      className={`hover:bg-gray-50 transition-colors ${isDeleting ? 'opacity-50 animate-pulse' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-9 w-9 flex items-center justify-center rounded-full bg-cyan-100 text-blue-600">
                              <User className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {entry.siswa?.nama || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              NIS: {entry.siswa?.nis || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 truncate flex items-center mt-1">
                              <Calendar className="h-3 w-3 mr-1 shrink-0" />
                              {entry.tanggal_formatted || formatDate(entry.tanggal)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm">
                        <div className="space-y-2">
                          <p className="font-medium text-gray-800">
                            <span className="font-bold text-gray-600">Kegiatan:</span>{" "}
                            {entry.kegiatan.length > 80
                              ? `${entry.kegiatan.substring(0, 80)}...`
                              : entry.kegiatan}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-bold text-gray-600">Kendala:</span>{" "}
                            {entry.kendala.length > 80
                              ? `${entry.kendala.substring(0, 80)}...`
                              : entry.kendala}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusClasses(
                            entry.status_verifikasi
                          )}`}
                        >
                          {getStatusLabel(entry.status_verifikasi)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div className="space-y-1">
                          <p>
                            <span className="font-bold">Guru:</span>{" "}
                            {entry.catatan_guru || "Belum ada"}
                          </p>
                          {entry.catatan_dudi && (
                            <p>
                              <span className="font-bold">DUDI:</span>{" "}
                              {entry.catatan_dudi}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-left text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-md"
                              title="Aksi Lainnya"
                              disabled={mutating || isDeleting}
                            >
                              <MoreHorizontal className="h-5 w-5" />
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
                              onClick={() => handleOpenEditModal(entry, true)}
                              className="cursor-pointer"
                            >
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(entry.id)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus Logbook
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {/* PAGINATION YANG TETAP AKTIF MESKIPUN CACHE BERJALAN */}
        {!isLoading && filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-200 text-sm text-gray-600 gap-4">
            <div className="text-center sm:text-left">
              <span className="text-gray-700">
                Menampilkan <span className="font-semibold">{startIndex + 1}-{endIndex}</span> dari{" "}
                <span className="font-semibold">{filteredData.length}</span> entri
              </span>
            </div>
            
            {/* Navigasi halaman - TOMBOL SELALU AKTIF */}
            <div className="flex items-center space-x-1">
              {/* Tombol Previous */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || mutating} // Hanya disabled saat mutating
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                title="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {/* Tombol halaman pertama */}
              {currentPage > 3 && totalPages > 5 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={mutating} // Hanya disabled saat mutating
                    className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors ${
                      currentPage === 1
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 hover:bg-gray-100"
                    } ${mutating ? 'opacity-50' : ''}`}
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                </>
              )}
              
              {/* Tombol halaman yang terlihat */}
              {getVisiblePageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  disabled={mutating} // Hanya disabled saat mutating
                  className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors ${
                    currentPage === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-100"
                  } ${mutating ? 'opacity-50' : ''}`}
                >
                  {page}
                </button>
              ))}
              
              {/* Tombol halaman terakhir */}
              {currentPage < totalPages - 2 && totalPages > 5 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={mutating} // Hanya disabled saat mutating
                    className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 hover:bg-gray-100"
                    } ${mutating ? 'opacity-50' : ''}`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              {/* Tombol Next */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || mutating} // Hanya disabled saat mutating
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                title="Halaman berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}