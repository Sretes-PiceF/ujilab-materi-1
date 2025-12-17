"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useMagangMutations } from "@/hooks/useMagang";
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
  Plus,
} from "lucide-react";
import { MagangModal } from "../guru/update/MagangModal";
import initEcho, { disconnectEcho } from "@/lib/echo";

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

interface MagangTableProps {
  magangData: any[];
  siswaData: any[];
  dudiData?: any[];
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

export default function MagangTable({
  magangData: initialMagangData,
  siswaData,
  dudiData = [],
  onDataUpdated,
}: MagangTableProps) {
  const {
    createMagang,
    updateMagang,
    deleteMagang,
    loading: mutating,
  } = useMagangMutations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMagang, setEditingMagang] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [realtimeStatus, setRealtimeStatus] = useState<string>("Not connected");

  const [magangData, setMagangData] = useState<any[]>(initialMagangData || []);
  const [isInitialized, setIsInitialized] = useState(false);
  const prevMagangDataRef = useRef<any[]>([]);

  // ⚠️ FIX: Hanya update saat data awal berubah (sekali saja)
  useEffect(() => {
    if (!isInitialized && initialMagangData.length > 0) {
      setMagangData(initialMagangData);
      setIsInitialized(true);
    }
  }, [initialMagangData, isInitialized]);

  // ⚠️ FIX: Gunakan debounce dan cegah infinite loop
  useEffect(() => {
    if (!onDataUpdated || !isInitialized) return;

    // Cek apakah data benar-benar berubah
    const hasChanged =
      JSON.stringify(magangData) !== JSON.stringify(prevMagangDataRef.current);

    if (hasChanged) {
      console.log("Magang data changed, notifying parent...");
      prevMagangDataRef.current = magangData;

      // Debounce untuk mencegah terlalu banyak update
      const timeoutId = setTimeout(() => {
        onDataUpdated(magangData);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [magangData, onDataUpdated, isInitialized]);

  useEffect(() => {
    console.log("Initializing realtime connection...");

    const echo = initEcho();
    const channel = echo.channel("magang");

    channel.listen(".magang.created", (data: any) => {
      console.log("Realtime: Magang CREATED event received", data);
      setRealtimeStatus(`Created: ${data.siswa_nama}`);

      setMagangData((prev) => {
        const exists = prev.find((item) => item.id === data.id);
        if (!exists) {
          const newMagang = {
            id: data.id,
            siswa_id: data.siswa_id,
            dudi_id: data.dudi_id,
            tanggal_mulai: data.tanggal_mulai || new Date().toISOString(),
            tanggal_selesai: data.tanggal_selesai || new Date().toISOString(),
            status: data.status,
            nilai_akhir: data.nilai_akhir,
            siswa: {
              id: data.siswa_id,
              nama: data.siswa_nama,
              nis: "",
              email: "",
              kelas: "",
              jurusan: "",
              telepon: "",
            },
            dudi: {
              id: data.dudi_id,
              nama_perusahaan: data.dudi_nama,
              alamat: "",
              telepon: "",
              email: "",
            },
          };
          return [newMagang, ...prev];
        }
        return prev;
      });
    });

    channel.listen(".magang.updated", (data: any) => {
      console.log("Realtime: Magang UPDATED event received", data);
      setRealtimeStatus(`Updated: ${data.siswa_nama} → ${data.status}`);

      setMagangData((prev) => {
        return prev.map((item) => {
          if (item.id === data.id) {
            return {
              ...item,
              siswa_id: data.siswa_id,
              dudi_id: data.dudi_id,
              status: data.status,
              nilai_akhir: data.nilai_akhir,
              tanggal_mulai: data.tanggal_mulai || item.tanggal_mulai,
              tanggal_selesai: data.tanggal_selesai || item.tanggal_selesai,
              siswa: {
                ...item.siswa,
                nama: data.siswa_nama || item.siswa?.nama,
              },
              dudi: {
                ...item.dudi,
                nama_perusahaan: data.dudi_nama || item.dudi?.nama_perusahaan,
              },
            };
          }
          return item;
        });
      });
    });

    channel.listen(".magang.deleted", (data: any) => {
      console.log("Realtime: Magang DELETED event received", data);
      setRealtimeStatus(`Deleted: ${data.siswa_nama}`);

      setMagangData((prev) => prev.filter((item) => item.id !== data.id));
    });

    echo.connector.pusher.connection.bind("connected", () => {
      console.log("Connected to Soketi");
      setRealtimeStatus("Connected to Soketi");
    });

    echo.connector.pusher.connection.bind("disconnected", () => {
      console.log("Disconnected from Soketi");
      setRealtimeStatus("Disconnected");
    });

    return () => {
      console.log("Cleaning up realtime connection...");
      disconnectEcho();
    };
  }, []);

  const handleOpenCreateModal = () => {
    setEditingMagang(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (magang: any) => {
    setEditingMagang(magang);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMagang(null);
  };

  const handleSaveMagang = async (formData: any) => {
    try {
      const payload = {
        ...formData,
        nilai_akhir: formData.nilai_akhir || undefined,
      };

      if (editingMagang) {
        const tempId = `temp-${Date.now()}`;
        setMagangData((prev) =>
          prev.map((item) =>
            item.id === editingMagang.id
              ? { ...item, ...payload, id: tempId }
              : item
          )
        );

        await updateMagang(editingMagang.id, payload);

        setMagangData((prev) =>
          prev.map((item) =>
            item.id === tempId ? { ...item, id: editingMagang.id } : item
          )
        );
      } else {
        const tempId = `temp-${Date.now()}`;
        const newMagang = {
          id: tempId,
          ...payload,
          siswa: siswaData.find((s: any) => s.id === payload.siswa_id),
          dudi: dudiData.find((d: any) => d.id === payload.dudi_id),
        };

        setMagangData((prev) => [newMagang, ...prev]);
        await createMagang(payload);
      }

      handleCloseModal();
      alert("Data magang berhasil disimpan");
      return true;
    } catch (err: any) {
      // Rollback ke data awal jika error
      setMagangData(initialMagangData);
      alert(err.message || "Terjadi kesalahan");
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data magang ini?")) return;

    let deletedItem: any;

    try {
      deletedItem = magangData.find((item) => item.id === id);
      setMagangData((prev) => prev.filter((item) => item.id !== id));

      await deleteMagang(id);
      alert("Data magang berhasil dihapus");
    } catch (err: any) {
      if (deletedItem) {
        setMagangData((prev) => [...prev, deletedItem]);
      }
      alert(err.message || "Terjadi kesalahan");
    }
  };

  const processedMagangList = useMemo(() => {
    if (!magangData || magangData.length === 0) return [];

    const extendedMagangList: ProcessedMagang[] = magangData.map(
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
  }, [magangData]);

  const filteredData = useMemo(() => {
    return processedMagangList.filter((m) => {
      const matchesSearch =
        m.siswa?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.siswa?.nis?.toString().includes(searchTerm) ||
        m.siswa?.kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.siswa?.jurusan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.dudi?.nama_perusahaan
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || m.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [processedMagangList, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredData, startIndex, entriesPerPage]);

  const formatDate = (dateString: string) => {
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
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={handleOpenCreateModal}
            disabled={mutating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Tambah Magang
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                realtimeStatus.includes("Connected")
                  ? "bg-green-500"
                  : realtimeStatus.includes("Disconnected")
                  ? "bg-red-500"
                  : "bg-yellow-500"
              }`}
            ></div>
            <span className="max-w-xs truncate">
              Realtime: {realtimeStatus}
            </span>
          </div>
        </div>
      </div>

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
          dudiList={dudiData.map((d: any) => ({
            id: d.id,
            nama_perusahaan: d.nama_perusahaan,
            alamat: d.alamat || "",
            telepon: d.telepon || "",
            email: d.email || "",
            penanggung_jawab: d.penanggung_jawab || "",
          }))}
        />
      )}

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
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Siswa
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kelas & Jurusan
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  DUDI
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Periode
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nilai
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedData.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-4">
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

                  <td className="px-3 py-4 text-sm text-gray-600">
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

                  <td className="px-3 py-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
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

                  <td className="px-3 py-4 text-sm text-gray-600">
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

                  <td className="px-3 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusClasses(
                        m.status
                      )}`}
                    >
                      {getStatusLabel(m.status)}
                    </span>
                  </td>

                  <td className="px-3 py-4">
                    {m.nilai_akhir ? (
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-400 text-gray-800">
                        {m.nilai_akhir}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-3 py-4 text-left text-sm font-medium">
                    <button
                      onClick={() => handleOpenEditModal(m)}
                      disabled={mutating}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-md mr-2 disabled:opacity-50"
                      title="Edit Magang"
                    >
                      <SquarePen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={mutating}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md disabled:opacity-50"
                      title="Hapus Magang"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Tidak ada data yang sesuai dengan pencarian"
                : "Belum ada data magang"}
            </p>
          </div>
        )}

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
                aria-label="Previous page"
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
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
