"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useMagangMutations, useMagangBatch } from "@/hooks/useMagang";
import { useNotification } from "@/components/ui/Notification/NotificationContext";
import {
  User,
  Building2,
  Calendar,
  SquarePen,
  MapPin,
  Phone,
  Mail,
  Trash2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { MagangModal } from "../guru/update/MagangModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ExtendedStatus =
  | "pending"
  | "diterima"
  | "ditolak"
  | "berlangsung"
  | "selesai"
  | "dibatalkan"
  | "terdaftar";

interface ProcessedMagang {
  id: string;
  siswa_id: string;
  dudi_id: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: ExtendedStatus;
  nilai_akhir?: number | null;
  siswa?: {
    id: string;
    nama: string;
    nis: string;
    email?: string;
    kelas: string;
    jurusan: string;
    telepon?: string;
  };
  dudi?: {
    id: string;
    nama_perusahaan: string;
    alamat?: string;
    telepon?: string;
    email?: string;
  };
  originalStatus: string;
}

interface MagangStats {
  total_siswa: number;
  aktif: number;
  selesai: number;
  pending: number;
}

interface MagangTableProps {
  onStatsUpdated?: (stats: MagangStats) => void;
  onDataUpdated?: (updatedMagang: any[]) => void;
}

const getStatusClasses = (status: ExtendedStatus) => {
  switch (status) {
    case "berlangsung":
      return "bg-green-100 text-green-700 border-green-200";
    case "selesai":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "pending":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "diterima":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "ditolak":
      return "bg-red-100 text-red-700 border-red-200";
    case "dibatalkan":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "terdaftar":
      return "bg-cyan-100 text-cyan-700 border-cyan-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusLabel = (status: ExtendedStatus) => {
  switch (status) {
    case "berlangsung":
      return "Berlangsung";
    case "selesai":
      return "Selesai";
    case "pending":
      return "Pending";
    case "diterima":
      return "Diterima";
    case "ditolak":
      return "Ditolak";
    case "dibatalkan":
      return "Dibatalkan";
    case "terdaftar":
      return "Terdaftar";
    default:
      return status;
  }
};

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
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </td>
          
          <td className="px-4 py-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </td>
          
          <td className="px-4 py-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </td>
          
          <td className="px-4 py-4">
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
          </td>
          
          <td className="px-4 py-4">
            <div className="h-6 bg-gray-200 rounded-full w-8 mx-auto"></div>
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

export default function MagangTable({
  onStatsUpdated,
  onDataUpdated,
}: MagangTableProps) {
  const {
    magang: magangData,
    siswa: siswaData,
    isLoading,
    isValidating,
    isCached,
    forceRefresh,
    markAsDeleted,
  } = useMagangBatch({
    realTime: true,
    pollingInterval: 3000,
  });

  const {
    createMagang,
    updateMagang,
    deleteMagang,
    loading: mutating,
    clearCache,
  } = useMagangMutations();

  const { showNotification } = useNotification();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMagang, setEditingMagang] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siswaFilter, setSiswaFilter] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const prevMagangDataRef = useRef<any[]>([]);
  const prevStatsRef = useRef<MagangStats | null>(null);
  const mountedRef = useRef(false);

  const calculateStats = useCallback((data: any[]): MagangStats => {
    const processedData = processMagangData(data);
    
    return {
      total_siswa: processedData.length,
      aktif: processedData.filter((m) => m.status === "berlangsung").length,
      selesai: processedData.filter((m) => m.status === "selesai").length,
      pending: processedData.filter((m) => m.status === "pending").length,
    };
  }, []);

  const processMagangData = useCallback((data: any[]): ProcessedMagang[] => {
    if (!data || data.length === 0) return [];

    const extendedMagangList: ProcessedMagang[] = data.map(
      (item: any) => ({
        ...item,
        status: item.status as ExtendedStatus,
        originalStatus: item.status,
      })
    );

    const magangBySiswa = new Map<string, ProcessedMagang[]>();
    extendedMagangList.forEach((m) => {
      if (!magangBySiswa.has(m.siswa_id)) {
        magangBySiswa.set(m.siswa_id, []);
      }
      magangBySiswa.get(m.siswa_id)!.push(m);
    });

    return extendedMagangList.map((m) => {
      const siswaMagangList = magangBySiswa.get(m.siswa_id) || [];
      const hasActiveOrAccepted = siswaMagangList.some(
        (item) =>
          item.id !== m.id &&
          (item.originalStatus === "diterima" ||
            item.originalStatus === "berlangsung")
      );

      let displayStatus: ExtendedStatus = m.status;
      if (hasActiveOrAccepted) {
        if (
          m.status !== "diterima" &&
          m.status !== "berlangsung" &&
          m.status !== "selesai"
        ) {
          displayStatus = "terdaftar";
        }
      }

      return {
        ...m,
        status: displayStatus,
      };
    });
  }, []);

  useEffect(() => {
    if (!mountedRef.current || !magangData || magangData.length === 0) return;

    const currentStats = calculateStats(magangData);
    
    if (!prevStatsRef.current || 
        JSON.stringify(prevStatsRef.current) !== JSON.stringify(currentStats)) {
      prevStatsRef.current = currentStats;
      
      if (onStatsUpdated) {
        onStatsUpdated(currentStats);
      }
    }

    if (onDataUpdated && 
        JSON.stringify(prevMagangDataRef.current) !== JSON.stringify(magangData)) {
      prevMagangDataRef.current = [...magangData];
      onDataUpdated(magangData);
    }
  }, [magangData, calculateStats, onStatsUpdated, onDataUpdated]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleOpenEditModal = useCallback((magang: any) => {
    setEditingMagang(magang);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingMagang(null);
  }, []);

  const handleSaveMagang = useCallback(async (formData: any) => {
    try {
      const payload = {
        ...formData,
        nilai_akhir: formData.nilai_akhir || undefined,
      };

      if (editingMagang) {
        await updateMagang(editingMagang.id, payload);
        showNotification("Data magang berhasil diperbarui", "success");
      } else {
        await createMagang(payload);
        showNotification("Data magang berhasil ditambahkan", "success");
      }

      handleCloseModal();
      return true;
    } catch (error: any) {
      showNotification(
        error.message || "Terjadi kesalahan saat menyimpan data",
        "error"
      );
      return false;
    }
  }, [editingMagang, updateMagang, createMagang, showNotification, handleCloseModal]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Yakin ingin menghapus data magang ini?")) return;

    try {
      setDeletingIds(prev => new Set([...prev, id]));
      markAsDeleted(id);

      await deleteMagang(id);
      
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      showNotification("Data magang berhasil dihapus", "success");
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
  }, [deleteMagang, markAsDeleted, showNotification]);

  const handleManualRefresh = useCallback(async () => {
    try {
      await forceRefresh();
      showNotification("Data berhasil diperbarui", "success");
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

  const processedMagangList = useMemo(() => {
    return processMagangData(magangData);
  }, [magangData, processMagangData]);

  // Filter siswa berdasarkan unik
  const siswaList = useMemo(() => {
    const uniqueSiswa = new Map();
    processedMagangList.forEach((item) => {
      if (item.siswa && !uniqueSiswa.has(item.siswa.id)) {
        uniqueSiswa.set(item.siswa.id, item.siswa);
      }
    });
    return Array.from(uniqueSiswa.values());
  }, [processedMagangList]);

  // Sort data berdasarkan tanggal mulai terbaru
  const sortedMagangData = useMemo(() => {
    return [...processedMagangList].sort((a, b) => {
      return new Date(b.tanggal_mulai).getTime() - new Date(a.tanggal_mulai).getTime();
    });
  }, [processedMagangList]);

  const filteredData = useMemo(() => {
    return sortedMagangData.filter((m) => {
      if (deletingIds.has(m.id)) return false;
      
      const matchesSearch =
        m.siswa?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.siswa?.nis?.toString().includes(searchTerm) ||
        m.siswa?.kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.siswa?.jurusan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.dudi?.nama_perusahaan
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      const matchesSiswa = siswaFilter === "all" || m.siswa?.id?.toString() === siswaFilter;

      return matchesSearch && matchesStatus && matchesSiswa;
    });
  }, [sortedMagangData, searchTerm, statusFilter, siswaFilter, deletingIds]);

  // ================ PAGINATION LOGIC ================
  const totalPages = Math.max(1, Math.ceil(filteredData.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, filteredData.length);
  
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, startIndex, endIndex]);

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

  const dudiList = useMemo(() => {
    if (!magangData || magangData.length === 0) return [];
    
    const uniqueDudis = new Map();
    magangData.forEach((item: any) => {
      if (item.dudi && !uniqueDudis.has(item.dudi.id)) {
        uniqueDudis.set(item.dudi.id, {
          id: item.dudi.id,
          nama_perusahaan: item.dudi.nama_perusahaan,
          alamat: item.dudi.alamat || "",
          telepon: item.dudi.telepon || "",
          email: item.dudi.email || "",
          penanggung_jawab: item.dudi.penanggung_jawab || "",
        });
      }
    });
    
    return Array.from(uniqueDudis.values());
  }, [magangData]);

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

  return (
    <div className="space-y-6">
      {isModalOpen && (
        <MagangModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveMagang}
          magang={editingMagang}
          title={editingMagang ? "Edit Data Magang" : "Tambah Data Magang"}
          siswaList={siswaData.map((s: any) => ({
            id: s.id,
            name: s.nama,
            nis: s.nis,
            email: s.email || "",
            kelas: s.kelas,
            jurusan: s.jurusan,
            telepon: s.telepon || "",
          }))}
          dudiList={dudiList}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Data Magang</h2>
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

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari siswa, NIS, kelas, jurusan, DUDI..."
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
              disabled={siswaList.length === 0}
              className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-colors text-sm disabled:opacity-50"
            >
              <option value="all">Semua Siswa</option>
              {siswaList.map((siswa: any) => (
                <option key={siswa.id} value={siswa.id.toString()}>
                  {siswa.nama} ({siswa.nis})
                </option>
              ))}
            </select>
          </div>

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
              <option value="pending">Pending</option>
              <option value="diterima">Diterima</option>
              <option value="ditolak">Ditolak</option>
              <option value="berlangsung">Berlangsung</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
              <option value="terdaftar">Terdaftar</option>
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

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Siswa
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kelas & Jurusan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  DUDI
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Periode
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nilai
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>

            {isLoading && magangData.length === 0 ? (
              <TableSkeleton />
            ) : filteredData.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-center py-12">
                      <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium mb-1">
                        {searchTerm || statusFilter !== "all" || siswaFilter !== "all"
                          ? "Tidak ada data yang sesuai"
                          : "Belum ada data magang"}
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedData.map((m) => {
                  const isDeleting = deletingIds.has(m.id);
                  
                  return (
                    <tr 
                      key={m.id} 
                      className={`hover:bg-gray-50 transition-colors ${isDeleting ? 'opacity-50 animate-pulse' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-cyan-100 text-blue-600 shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {m.siswa?.nama || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              NIS: {m.siswa?.nis || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              <Mail className="inline h-3 w-3 mr-1" />
                              {m.siswa?.email || "Email tidak tersedia"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        <p className="font-medium text-gray-800">
                          {m.siswa?.kelas || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {m.siswa?.jurusan || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          <Phone className="inline h-3 w-3 mr-1" />
                          {m.siswa?.telepon || "N/A"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                          <p className="font-medium text-gray-800 truncate">
                            {m.dudi?.nama_perusahaan || "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-1 truncate">
                          <MapPin className="h-3 w-3 mr-2 text-gray-400 shrink-0" />
                          <span className="truncate">
                            {m.dudi?.alamat || "N/A"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-gray-800">
                              {formatDate(m.tanggal_mulai)}
                            </p>
                            <p className="text-xs text-gray-500">
                              s.d {formatDate(m.tanggal_selesai)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusClasses(
                            m.status
                          )}`}
                        >
                          {getStatusLabel(m.status)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {m.nilai_akhir ? (
                          <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                            {m.nilai_akhir}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
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
                              onClick={() => handleOpenEditModal(m)}
                              className="cursor-pointer"
                            >
                              <SquarePen className="h-4 w-4 mr-2" />
                              Edit Data
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(m.id)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus Magang
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

        {/* ================ PAGINATION COMPONENT ================ */}
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