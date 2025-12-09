// components/layout/guru/MagangTable.tsx
import { useState, useMemo, useEffect, useRef } from "react";
import {
  User,
  Building2,
  Calendar,
  SquarePen,
  MapPin,
  Phone,
  Mail,
  Trash2,
} from "lucide-react";
import { useMagang } from "@/hooks/useMagang";
import { Magang } from "@/types/magang";
import { MagangModal } from "./update/MagangModal";

// Type dari useMagang hook (berdasarkan error, ini punya nilai_akhir: number | null | undefined)
type MagangFromHook = ReturnType<typeof useMagang>["magangList"][0];

// Extend tipe status untuk include "terdaftar" (virtual status)
type ExtendedStatus = Magang["status"] | "terdaftar";

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

// Interface untuk konversi data
interface MagangForModal {
  id?: string;
  siswa_id: string;
  dudi_id: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status:
    | "pending"
    | "diterima"
    | "ditolak"
    | "berlangsung"
    | "selesai"
    | "dibatalkan";
  nilai_akhir?: number | null;
  catatan?: string;
  siswa?: any;
  dudi?: any;
}

// Interface untuk extended magang (dengan status yang bisa berubah)
interface ExtendedMagang extends Omit<MagangFromHook, "status"> {
  status: ExtendedStatus;
  originalStatus: Magang["status"]; // Simpan status asli dari DB
}

// Fix: Function untuk mengonversi MagangFromHook ke ExtendedMagang
const convertToExtendedMagang = (magang: MagangFromHook): ExtendedMagang => {
  // Handle nilai_akhir yang mungkin undefined
  const nilai_akhir =
    magang.nilai_akhir !== undefined ? magang.nilai_akhir : null;

  return {
    ...magang,
    nilai_akhir, // Konversi undefined ke null
    status: magang.status, // Akan diubah nanti di processedMagangList
    originalStatus: magang.status,
  };
};

// Komponen Loading Skeleton untuk Table
const TableLoadingSkeleton = () => {
  return (
    <tbody className="bg-white divide-y divide-gray-100">
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="animate-pulse">
          {/* Kolom Siswa */}
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
          {/* Kolom Kelas & Jurusan */}
          <td className="px-3 py-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-28"></div>
            </div>
          </td>
          {/* Kolom DUDI */}
          <td className="px-3 py-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-40"></div>
            </div>
          </td>
          {/* Kolom Periode */}
          <td className="px-3 py-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </td>
          {/* Kolom Status */}
          <td className="px-3 py-4">
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </td>
          {/* Kolom Nilai */}
          <td className="px-3 py-4">
            <div className="h-6 bg-gray-200 rounded-full w-12"></div>
          </td>
          {/* Kolom Aksi */}
          <td className="px-3 py-4">
            <div className="flex space-x-2">
              <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

export function MagangTable() {
  const {
    magangList,
    siswaList,
    dudiList,
    error,
    fetchMagang,
    deleteMagang,
    updateMagang,
    createMagang,
  } = useMagang();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State untuk modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMagang, setSelectedMagang] = useState<MagangForModal | null>(
    null
  );
  const [modalTitle, setModalTitle] = useState("");

  // Flag untuk menandai apakah sudah load data awal
  const hasInitialLoad = useRef(false);
  const supabaseRef = useRef<any>(null);

  // Load data awal hanya sekali
  useEffect(() => {
    const loadInitialData = async () => {
      if (!hasInitialLoad.current) {
        console.log("🔄 Loading data magang pertama kali...");
        setIsInitialLoading(true);
        try {
          await fetchMagang();
        } finally {
          setIsInitialLoading(false);
          hasInitialLoad.current = true;
        }
      }
    };

    loadInitialData();
  }, [fetchMagang]);

  // Setup realtime subscription
  useEffect(() => {
    const setupRealtime = async () => {
      try {
        // Import supabase secara dinamis
        const { supabase } = await import("@/lib/supabaseClient");
        supabaseRef.current = supabase;

        if (supabase) {
          console.log("🔗 Setting up Supabase realtime subscription...");

          const channel = supabase
            .channel("magang-realtime-updates")
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "magang",
              },
              () => {
                console.log("📥 Realtime: INSERT detected, refreshing...");
                fetchMagang();
              }
            )
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "magang",
              },
              () => {
                console.log("🔄 Realtime: UPDATE detected, refreshing...");
                fetchMagang();
              }
            )
            .on(
              "postgres_changes",
              {
                event: "DELETE",
                schema: "public",
                table: "magang",
              },
              () => {
                console.log("🗑️ Realtime: DELETE detected, refreshing...");
                fetchMagang();
              }
            )
            .subscribe((status) => {
              console.log("📡 Supabase subscription status:", status);
            });

          return () => {
            console.log("🧹 Cleaning up Supabase channel...");
            supabase.removeChannel(channel);
          };
        }
      } catch (error) {
        console.warn("⚠️ Supabase realtime setup failed:", error);
      }
    };

    setupRealtime();
  }, [fetchMagang]);

  // LOGIKA STATUS TERDAFTAR: Process magang list dengan logika status "Terdaftar"
  const processedMagangList = useMemo(() => {
    if (magangList.length === 0) return [];

    // Konversi semua magang ke ExtendedMagang dulu
    const extendedMagangList: ExtendedMagang[] = magangList.map(
      convertToExtendedMagang
    );

    // Group magang berdasarkan siswa_id
    const magangBySiswa = new Map<number, ExtendedMagang[]>();
    extendedMagangList.forEach((magang) => {
      if (!magangBySiswa.has(magang.siswa_id)) {
        magangBySiswa.set(magang.siswa_id, []);
      }
      magangBySiswa.get(magang.siswa_id)!.push(magang);
    });

    // Process setiap magang
    const result: ExtendedMagang[] = extendedMagangList.map((magang) => {
      const siswaId = magang.siswa_id;
      const siswaMagangList = magangBySiswa.get(siswaId) || [];

      // Cek apakah siswa ini punya magang dengan status 'diterima' atau 'berlangsung'
      const hasActiveOrAccepted = siswaMagangList.some(
        (m) =>
          m.id !== magang.id &&
          (m.originalStatus === "diterima" ||
            m.originalStatus === "berlangsung")
      );

      // Jika siswa punya magang aktif/diterima di DUDI lain,
      // dan magang ini bukan yang aktif/diterima, ubah statusnya jadi "terdaftar"
      let displayStatus: ExtendedStatus = magang.originalStatus;

      if (hasActiveOrAccepted) {
        // Jika magang ini bukan yang diterima/berlangsung/selesai, tampilkan sebagai "terdaftar"
        if (
          magang.originalStatus !== "diterima" &&
          magang.originalStatus !== "berlangsung" &&
          magang.originalStatus !== "selesai"
        ) {
          displayStatus = "terdaftar";
        }
      }

      return {
        ...magang,
        status: displayStatus,
      };
    });

    return result;
  }, [magangList]);

  // Filter data
  const filteredData = processedMagangList.filter((magang) => {
    const matchesSearch =
      magang.siswa?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      magang.siswa?.nis?.toString().includes(searchTerm) ||
      magang.siswa?.kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      magang.siswa?.jurusan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      magang.dudi?.nama_perusahaan
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || magang.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  // Format tanggal
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Konversi ExtendedMagang ke MagangForModal
  const convertToModalFormat = (magang: ExtendedMagang): MagangForModal => {
    return {
      id: magang.id.toString(),
      siswa_id: magang.siswa_id.toString(),
      dudi_id: magang.dudi_id.toString(),
      tanggal_mulai: magang.tanggal_mulai,
      tanggal_selesai: magang.tanggal_selesai,
      status: magang.originalStatus, // Gunakan status asli untuk edit
      nilai_akhir: magang.nilai_akhir ?? null,
      siswa: magang.siswa,
      dudi: magang.dudi,
    };
  };

  // Handle buka modal untuk create
  const handleCreateMagang = () => {
    setSelectedMagang(null);
    setModalTitle("Tambah Magang Baru");
    setIsModalOpen(true);
  };

  // Handle buka modal untuk edit
  const handleEditMagang = (magang: ExtendedMagang) => {
    const modalMagang = convertToModalFormat(magang);
    setSelectedMagang(modalMagang);
    setModalTitle("Edit Data Magang");
    setIsModalOpen(true);
  };

  // Handle tutup modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMagang(null);
  };

  // Handle save data dari modal
  const handleSaveMagang = async (formData: any): Promise<boolean> => {
    try {
      let result;

      if (selectedMagang && selectedMagang.id) {
        // Mode update - konversi id ke number
        const magangId = parseInt(selectedMagang.id);
        result = await updateMagang(magangId, formData);
      } else {
        // Mode create
        result = await createMagang(formData);
      }

      if (result.success) {
        // Data akan otomatis di-refresh via realtime subscription
        return true;
      } else {
        alert("Gagal menyimpan data: " + result.message);
        return false;
      }
    } catch (error) {
      console.error("Error saving magang:", error);
      alert("Terjadi kesalahan saat menyimpan data");
      return false;
    }
  };

  // Handle delete magang
  const handleDelete = async (magang: ExtendedMagang) => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus magang untuk siswa ${magang.siswa?.nama}?`
      )
    ) {
      const result = await deleteMagang(magang.id);
      if (result.success) {
        alert("Magang berhasil dihapus");
        // Data akan otomatis di-refresh via realtime subscription
      } else {
        alert("Gagal menghapus magang: " + result.message);
      }
    }
  };

  // Handle manual refresh
  const handleManualRefresh = async () => {
    console.log("🔄 Manual refresh triggered");
    setIsRefreshing(true);
    try {
      await fetchMagang();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error: {error}</p>
        <button
          onClick={handleManualRefresh}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        {/* HEADER DENGAN TOMBOL TAMBAH & REFRESH */}
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold text-gray-800">Data Magang</h1>
          <div className="flex items-center gap-2"></div>
        </div>

        {/* BARIS PENCARIAN & FILTER */}
        <div className="flex items-center justify-between mb-6 space-x-4">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Cari siswa, NIS, kelas, jurusan, DUDI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isInitialLoading}
            className="w-full max-w-lg px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0097BB] focus:border-transparent transition-colors shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />

          {/* Filter Status */}
          <div className="flex items-center text-sm text-gray-600 space-x-4">
            {/* Filter Status */}
            <div className="flex items-center">
              <label htmlFor="filter-status" className="mr-2">
                Status:
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={isInitialLoading}
                className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0097BB] focus:border-[#0097BB] appearance-none bg-white transition-colors text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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

            {/* Filter Per Halaman */}
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
                disabled={isInitialLoading}
                className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0097BB] focus:border-[#0097BB] appearance-none bg-white transition-colors text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE START */}
        <table className="min-w-full divide-y divide-gray-200">
          {/* HEAD TABLE */}
          <thead className="bg-white">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/5">
                Siswa
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/5">
                Kelas & Jurusan
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/5">
                DUDI
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-auto">
                Periode
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-auto">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                Nilai
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                Aksi
              </th>
            </tr>
          </thead>

          {/* BODY TABLE */}
          {isInitialLoading ? (
            // Loading Skeleton saat initial load
            <TableLoadingSkeleton />
          ) : magangList.length === 0 ? (
            // Empty State - Tidak ada data sama sekali
            <tbody className="bg-white">
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Tidak ada data magang</p>
                  <button
                    onClick={handleCreateMagang}
                    className="mt-2 px-4 py-2 bg-[#0097BB] text-white rounded-lg hover:bg-[#007b9e] transition-colors"
                  >
                    Tambah Magang Pertama
                  </button>
                </td>
              </tr>
            </tbody>
          ) : paginatedData.length === 0 ? (
            // No results from search/filter
            <tbody className="bg-white">
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center">
                  <p className="text-gray-500">
                    Tidak ada data yang sesuai dengan pencarian
                  </p>
                </td>
              </tr>
            </tbody>
          ) : (
            // Data Rows
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedData.map((magang) => (
                <tr
                  key={magang.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Kolom Siswa */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-start space-x-3">
                      <div className="h-9 w-9 flex items-center justify-center rounded-full bg-cyan-100 text-[#0097BB] shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {magang.siswa?.nama || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          NIS: {magang.siswa?.nis || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">
                          <Mail className="inline h-3 w-3 mr-1" />
                          {magang.siswa?.email || "Email tidak tersedia"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Kolom Kelas & Jurusan */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                    <p className="font-medium text-gray-800">
                      {magang.siswa?.kelas || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {magang.siswa?.jurusan || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">
                      <Phone className="inline h-3 w-3 mr-1" />
                      {magang.siswa?.telepon || "N/A"}
                    </p>
                  </td>

                  {/* Kolom DUDI */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-800">
                        {magang.dudi?.nama_perusahaan || "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                      {magang.dudi?.alamat || "N/A"}
                    </div>
                  </td>

                  {/* Kolom Periode */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          {formatDate(magang.tanggal_mulai)}
                        </p>
                        <p className="text-xs text-gray-500">
                          s.d {formatDate(magang.tanggal_selesai)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Kolom Status */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusClasses(
                          magang.status
                        )}`}
                      >
                        {getStatusLabel(magang.status)}
                      </span>
                    </div>
                  </td>

                  {/* Kolom Nilai */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    {magang.nilai_akhir ? (
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-400 text-gray-800">
                        {magang.nilai_akhir}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  {/* Kolom Aksi */}
                  <td className="px-3 py-4 whitespace-nowrap text-left text-sm font-medium">
                    <button
                      className="text-gray-400 hover:text-[#0097BB] transition-colors p-1 rounded-md mr-2"
                      title="Edit Magang"
                      onClick={() => handleEditMagang(magang)}
                    >
                      <SquarePen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(magang)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md"
                      title="Hapus Magang"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>

        {/* Pagination */}
        {!isInitialLoading && filteredData.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t mt-4 text-sm text-gray-600">
            <span>
              Menampilkan {startIndex + 1} sampai{" "}
              {Math.min(startIndex + entriesPerPage, filteredData.length)} dari{" "}
              {filteredData.length} entri
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isRefreshing}
                className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    disabled={isRefreshing}
                    className={`p-2 border rounded-lg transition-colors disabled:cursor-not-allowed ${
                      currentPage === page
                        ? "bg-[#0097BB] text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || isRefreshing}
                className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Magang Modal */}
      <MagangModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveMagang}
        magang={selectedMagang}
        title={modalTitle}
        siswaList={siswaList.map((siswa) => ({
          id: siswa.id.toString(),
          name: siswa.nama,
          nis: siswa.nis,
          email: siswa.email || "Email tidak tersedia",
          kelas: siswa.kelas,
          jurusan: siswa.jurusan,
          telepon: siswa.telepon,
        }))}
        dudiList={dudiList.map((dudi) => ({
          id: dudi.id.toString(),
          nama_perusahaan: dudi.nama_perusahaan,
          alamat: dudi.alamat,
          telepon: dudi.telepon,
          email: dudi.email || "",
          penanggung_jawab: dudi.penanggung_jawab,
        }))}
      />
    </>
  );
}
