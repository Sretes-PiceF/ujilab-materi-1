"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useLogbookMutations, LogbookEntry } from "@/hooks/useLogbook";
import { useNotification } from "@/components/ui/Notification/NotificationContext";
import {
  User,
  Calendar,
  BookOpen,
  Eye,
  MoreHorizontal,
  Trash2,
  CheckSquare,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogbookUpdateModal } from "../guru/update/LogbookModal";
import LogbookDetailModal from "./detail/LogbookDetail";
import initEcho, { disconnectEcho } from "@/lib/echo";

interface LogbookTableProps {
  logbookData: LogbookEntry[];
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

export default function LogbookTable({
  logbookData: initialLogbookData,
  onDataUpdated,
}: LogbookTableProps) {
  const { updateLogbook, deleteLogbook, loading: mutating } = useLogbookMutations();
  const { showNotification } = useNotification();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [logbookData, setLogbookData] = useState<LogbookEntry[]>(initialLogbookData || []);
  const [isInitialized, setIsInitialized] = useState(false);
  const prevLogbookDataRef = useRef<LogbookEntry[]>([]);

  const [selectedUpdateLogbook, setSelectedUpdateLogbook] = useState<LogbookEntry | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailLogbook, setSelectedDetailLogbook] = useState<LogbookEntry | null>(null);

  // ✅ INISIALISASI DATA
  useEffect(() => {
    if (!isInitialized && initialLogbookData.length > 0) {
      setLogbookData(initialLogbookData);
      setIsInitialized(true);
    }
  }, [initialLogbookData, isInitialized]);

  // ✅ CALLBACK UNTUK UPDATE DATA KE PARENT
  useEffect(() => {
    if (!onDataUpdated || !isInitialized) return;

    const hasChanged = JSON.stringify(logbookData) !== JSON.stringify(prevLogbookDataRef.current);

    if (hasChanged) {
      prevLogbookDataRef.current = logbookData;

      const timeoutId = setTimeout(() => {
        onDataUpdated(logbookData);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [logbookData, onDataUpdated, isInitialized]);

  // ✅ REALTIME ECHO LISTENERS
  useEffect(() => {
    const echo = initEcho();
    const channel = echo.channel("logbook");

    channel.listen(".logbook.created", (data: any) => {
      showNotification(`Logbook ${data.siswa_nama} berhasil ditambahkan`, "success");

      setLogbookData((prev) => {
        const exists = prev.find((item) => item.id === data.id);
        if (!exists) {
          const newLogbook: LogbookEntry = {
            id: data.id,
            magang_id: data.magang_id,
            tanggal: data.tanggal || new Date().toISOString(),
            tanggal_formatted: data.tanggal_formatted || "",
            kegiatan: data.kegiatan || "",
            kendala: data.kendala || "",
            file: data.file || null,
            status_verifikasi: data.status_verifikasi || "pending",
            catatan_guru: data.catatan_guru || null,
            catatan_dudi: data.catatan_dudi || null,
            siswa: {
              id: data.siswa_id,
              nama: data.siswa_nama,
              nis: "",
              kelas: "",
              jurusan: "",
              email: "",
            },
            dudi: {
              id: data.dudi_id,
              nama_perusahaan: data.dudi_nama || "",
            },
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
          };
          return [newLogbook, ...prev];
        }
        return prev;
      });
    });

    channel.listen(".logbook.updated", (data: any) => {
      showNotification(`Logbook ${data.siswa_nama} berhasil diperbarui`, "success");

      setLogbookData((prev) => {
        return prev.map((item) => {
          if (item.id === data.id) {
            return {
              ...item,
              kegiatan: data.kegiatan || item.kegiatan,
              kendala: data.kendala || item.kendala,
              status_verifikasi: data.status_verifikasi || item.status_verifikasi,
              catatan_guru: data.catatan_guru || item.catatan_guru,
              file: data.file || item.file,
            };
          }
          return item;
        });
      });
    });

    channel.listen(".logbook.deleted", (data: any) => {
      showNotification(`Logbook ${data.siswa_nama} berhasil dihapus`, "success");
      setLogbookData((prev) => prev.filter((item) => item.id !== data.id));
    });

    return () => {
      disconnectEcho();
    };
  }, [showNotification]);

  // ✅ HANDLERS
  const handleUpdateStatus = (entry: LogbookEntry) => {
    setSelectedUpdateLogbook(entry);
    setShowStatusUpdate(true);
    setShowUpdateModal(true);
  };

  const handleUpdateLogbook = async (data: any) => {
    if (!selectedUpdateLogbook) return false;

    const tempId = selectedUpdateLogbook.id;

    try {
      // Optimistic update
      setLogbookData((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? {
                ...item,
                kegiatan: data.kegiatan,
                kendala: data.kendala,
                status_verifikasi: data.status_verifikasi || item.status_verifikasi,
                catatan_guru: data.catatan_guru || item.catatan_guru,
              }
            : item
        )
      );

      await updateLogbook(selectedUpdateLogbook.id, data);

      showNotification(
        showStatusUpdate
          ? "Logbook dan status verifikasi berhasil diupdate"
          : "Logbook berhasil diupdate",
        "success"
      );

      handleCloseModal();
      return true;
    } catch (err: any) {
      // Rollback
      setLogbookData(initialLogbookData);
      showNotification(err.message || "Terjadi kesalahan saat menyimpan data", "error");
      return false;
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus logbook ini?")) return;

    let deletedItem: LogbookEntry | undefined;

    try {
      deletedItem = logbookData.find((item) => item.id === id);
      setLogbookData((prev) => prev.filter((item) => item.id !== id));

      await deleteLogbook(id);
      showNotification("Logbook berhasil dihapus", "success");
    } catch (err: any) {
      if (deletedItem) {
        setLogbookData((prev) => [...prev, deletedItem!]);
      }
      showNotification(err.message || "Terjadi kesalahan saat menghapus data", "error");
    }
  };

  const handleViewDetail = (entry: LogbookEntry) => {
    const baseUrl = process.env.NEXT_PUBLIC_LARAVEL_BASE_URL || "http://localhost:8000";

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

    setSelectedDetailLogbook(formattedEntry as any);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setShowUpdateModal(false);
    setSelectedUpdateLogbook(null);
    setShowStatusUpdate(false);
  };

  // ✅ FILTERING & PAGINATION
  const filteredData = useMemo(() => {
    return logbookData.filter((item) => {
      const matchesSearch =
        item.siswa?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.siswa?.nis?.toString().includes(searchTerm) ||
        item.kegiatan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kendala?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || item.status_verifikasi === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [logbookData, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredData, startIndex, entriesPerPage]);

  return (
    <div className="space-y-6">
      {/* SEARCH & FILTER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari siswa, kegiatan, atau kendala..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <label htmlFor="filter-status" className="mr-2 whitespace-nowrap">
              Status:
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors text-sm"
            >
              <option value="all">Semua</option>
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
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Siswa & Tanggal
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kegiatan & Kendala
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Catatan
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedData.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="h-9 w-9 flex items-center justify-center rounded-full bg-cyan-100 text-blue-600 shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {entry.siswa?.nama || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          NIS: {entry.siswa?.nis || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {entry.tanggal_formatted}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-4 text-sm">
                    <p className="font-medium text-gray-800">
                      <span className="font-bold">Kegiatan:</span>{" "}
                      {entry.kegiatan.length > 100
                        ? `${entry.kegiatan.substring(0, 100)}...`
                        : entry.kegiatan}
                    </p>
                    <p className="mt-2 text-gray-600">
                      <span className="font-bold">Kendala:</span>{" "}
                      {entry.kendala.length > 100
                        ? `${entry.kendala.substring(0, 100)}...`
                        : entry.kendala}
                    </p>
                  </td>

                  <td className="px-3 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusClasses(
                        entry.status_verifikasi
                      )}`}
                    >
                      {getStatusLabel(entry.status_verifikasi)}
                    </span>
                  </td>

                  <td className="px-3 py-4 text-sm text-gray-600">
                    <p>
                      <span className="font-bold">Guru:</span>{" "}
                      {entry.catatan_guru || "Belum ada"}
                    </p>
                    {entry.catatan_dudi && (
                      <p className="mt-1">
                        <span className="font-bold">DUDI:</span> {entry.catatan_dudi}
                      </p>
                    )}
                  </td>

                  <td className="px-3 py-4 text-left text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-md"
                          disabled={mutating}
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
                          onClick={() => handleUpdateStatus(entry)}
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
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Tidak ada data yang sesuai dengan pencarian"
                : "Belum ada data logbook"}
            </p>
          </div>
        )}

        {/* PAGINATION */}
        {filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-200 text-sm text-gray-600 gap-4">
            <span className="text-center sm:text-left">
              Menampilkan {startIndex + 1} sampai{" "}
              {Math.min(startIndex + entriesPerPage, filteredData.length)} dari{" "}
              {filteredData.length} entri
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &lt;
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`p-2 border rounded-lg transition-colors w-10 ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      <LogbookUpdateModal
        isOpen={showUpdateModal}
        onClose={handleCloseModal}
        onSave={handleUpdateLogbook}
        logbook={selectedUpdateLogbook}
        title={showStatusUpdate ? "Edit Logbook & Update Status" : "Edit Logbook Siswa"}
        showStatusUpdate={showStatusUpdate}
      />

      <LogbookDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailLogbook(null);
        }}
        entry={selectedDetailLogbook}
      />
    </div>
  );
}