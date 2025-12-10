// components/layout/siswa/DudiTable.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
// ... (imports lainnya tetap sama)
import {
  Building2,
  MapPin,
  User,
  ArrowRight,
  CheckCircle,
  XCircle,
  Check,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// ... (Interface DudiData dan DudiTableProps tetap sama)
// ... (Komponen SkeletonCard tetap sama)

// Interface untuk data DUDI dari API
interface DudiData {
  id: number;
  nama_perusahaan: string;
  alamat: string;
  telepon: string;
  email: string;
  penanggung_jawab: string;
  status_dudi: string;
  bidang_usaha: string;
  deskripsi: string;
  kuota: {
    terisi: number;
    total: number;
    tersisa: number;
  };
  fasilitas: string[];
  persyaratan: string[];
  sudah_daftar: boolean;
}

// Props untuk komponen
interface DudiTableProps {
  onApply?: (dudiId: number) => void;
  onViewDetail?: (dudi: DudiData) => void;
}

// Skeleton Card Component
const SkeletonCard = () => (
  <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-100 animate-pulse">
    {/* Header Skeleton */}
    <div className="flex items-start gap-3 mb-4">
      <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>

    {/* Address & PIC Skeleton */}
    <div className="space-y-2 mb-4">
      <div className="flex items-start gap-2">
        <div className="h-4 w-4 bg-gray-200 rounded mt-0.5"></div>
        <div className="flex-1 space-y-1">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>

    {/* Quota Skeleton */}
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <div className="h-3 bg-gray-200 rounded w-20"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2"></div>
      <div className="h-2 bg-gray-200 rounded w-16 mt-1"></div>
    </div>

    {/* Description Skeleton */}
    <div className="space-y-2 mb-4">
      <div className="h-2 bg-gray-200 rounded w-full"></div>
      <div className="h-2 bg-gray-200 rounded w-full"></div>
      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
    </div>

    {/* Buttons Skeleton */}
    <div className="flex justify-between items-center">
      <div className="h-6 bg-gray-200 rounded w-12"></div>
      <div className="h-7 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
);

export function DudiTable({ onApply, onViewDetail }: DudiTableProps) {
  const [dudiData, setDudiData] = useState<DudiData[]>([]);
  const [loading, setLoading] = useState(true); // Default ke true untuk initial load
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(6);
  const [jumlahPendaftaran, setJumlahPendaftaran] = useState(0);
  const [maksimalPendaftaran, setMaksimalPendaftaran] = useState(3);
  const [bisaDaftar, setBisaDaftar] = useState(true);
  const [sudahPunyaMagangAktif, setSudahPunyaMagangAktif] = useState(false);
  const [sudahPernahMagang, setSudahPernahMagang] = useState(false);
  const [magangAktif, setMagangAktif] = useState<any>(null);
  const [magangSelesai, setMagangSelesai] = useState<any>(null);

  // **********************************************
  // 💡 FUNGSI INI HANYA UNTUK FETCH DATA, TIDAK ADA LOGIKA LOADING/ERROR
  // **********************************************
  const fetchDudi = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
        }/siswa/dudi/aktif`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDudiData(result.data.dudi_aktif || []);
          setJumlahPendaftaran(result.data.jumlah_pendaftaran || 0);
          setMaksimalPendaftaran(result.data.maksimal_pendaftaran || 3);
          setBisaDaftar(result.data.bisa_daftar ?? true);
          setSudahPunyaMagangAktif(
            result.data.sudah_punya_magang_aktif || false
          );
          setMagangAktif(result.data.magang_aktif || null);
          setSudahPernahMagang(result.data.sudah_pernah_magang || false);
          setMagangSelesai(result.data.magang_selesai || null);
          return { success: true };
        } else {
          return {
            success: false,
            message: result.message || "Gagal mengambil data DUDI",
          };
        }
      } else {
        return { success: false, message: "Gagal terhubung ke server" };
      }
    } catch (err: any) {
      console.error("Error fetching DUDI data:", err);
      return {
        success: false,
        message: "Terjadi kesalahan saat mengambil data",
      };
    }
  }, []);

  // **********************************************
  // 💡 FUNGSI INI DIGUNAKAN UNTUK INITIAL LOAD DAN MANUAL REFRESH (Tombol Coba Lagi)
  // **********************************************
  const fetchDudiAktif = useCallback(async () => {
    // Hanya set loading=true jika belum pernah selesai loading
    // Jika dipanggil dari tombol 'Coba Lagi' saat error, set true.
    if (dudiData.length === 0 && !error) {
      setLoading(true);
    }
    setError(null);

    const result = await fetchDudi();

    if (!result.success) {
      setError(result.message);
    }

    // Pastikan loading dimatikan setelah fetch pertama
    setLoading(false);
  }, [fetchDudi, dudiData.length, error]); // Tambahkan dependensi fetchDudi

  // Initial fetch
  useEffect(() => {
    // Hanya dipanggil sekali saat komponen pertama kali dimuat
    fetchDudiAktif();
  }, [fetchDudiAktif]); // Dependensi fetchDudiAktif

  // Real-time subscription untuk DUDI dan Magang
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("dudi-magang-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "dudi",
        },
        async (payload) => {
          console.log("DUDI changed (Real-time):", payload);
          // 💡 Menggunakan fetchDudi() yang tidak mengaktifkan loading skeleton
          await fetchDudi();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "magang",
        },
        async (payload) => {
          console.log("Magang changed (Real-time):", payload);
          // 💡 Menggunakan fetchDudi() yang tidak mengaktifkan loading skeleton
          await fetchDudi();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDudi]); // Dependensi fetchDudi

  // ... (Logika Filter data, Pagination, dan showNotification tetap sama)
  // ... (Handler handleApply diubah sedikit)

  // Handler untuk mendaftar ke DUDI
  const handleApply = async (dudiId: number) => {
    // ... (Logika pengecekan tetap sama)
    if (sudahPernahMagang) {
      showNotification(
        "Anda sudah pernah menyelesaikan magang dan tidak dapat mendaftar lagi",
        "error"
      );
      return;
    }

    if (!bisaDaftar) {
      showNotification(
        `Anda sudah mencapai batas maksimal pendaftaran (${maksimalPendaftaran} DUDI)`,
        "error"
      );
      return;
    }

    if (sudahPunyaMagangAktif) {
      showNotification("Anda sudah memiliki magang aktif", "error");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
        }/siswa/dudi/${dudiId}/daftar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.error("JSON parse error:", e);
        showNotification(
          "Server mengembalikan response yang tidak valid",
          "error"
        );
        return;
      }

      if (response.ok && result.success) {
        // Update UI untuk instant feedback
        setDudiData((prevData) =>
          prevData.map((dudi) =>
            dudi.id === dudiId ? { ...dudi, sudah_daftar: true } : dudi
          )
        );

        setJumlahPendaftaran((prev) => prev + 1);

        if (jumlahPendaftaran + 1 >= maksimalPendaftaran) {
          setBisaDaftar(false);
        }

        showNotification(
          "Pendaftaran magang berhasil dikirim! Menunggu verifikasi dari perusahaan.",
          "success"
        );

        // 💡 Menggunakan fetchDudi() untuk auto-refresh tanpa loading skeleton
        setTimeout(() => {
          fetchDudi();
        }, 1000);

        if (onApply) {
          onApply(dudiId);
        }
      } else {
        const errorMessage = result.message || "Gagal mengirim pendaftaran";
        showNotification(errorMessage, "error");
        console.error("Backend error:", result);
      }
    } catch (err: any) {
      console.error("Apply error:", err);
      showNotification(
        "Terjadi kesalahan saat mengirim pendaftaran. Silakan coba lagi.",
        "error"
      );
    }
  };

  // ... (Handler handleViewDetail tetap sama)
  // ... (Bagian render tetap sama)

  // ... (Sisanya dari komponen DudiTable)
  const filteredData = dudiData.filter(
    (dudi) =>
      dudi.nama_perusahaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dudi.bidang_usaha.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dudi.alamat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const paginatedData = filteredData.slice(0, entriesPerPage);

  // Fungsi untuk menampilkan notifikasi
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Handler untuk melihat detail DUDI
  const handleViewDetail = (dudi: DudiData) => {
    if (onViewDetail) {
      onViewDetail(dudi);
    } else {
      console.log("View detail DUDI:", dudi);
      showNotification(`Melihat detail ${dudi.nama_perusahaan}`, "success");
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <XCircle className="h-8 w-8 text-red-500" />
          <p className="text-red-700 mb-4">Error: {error}</p>
          <button
            onClick={fetchDudiAktif}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Info Magang Selesai */}
      {sudahPernahMagang && magangSelesai && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-green-800 font-medium">
                    Selamat! Anda telah menyelesaikan program magang
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    DUDI:{" "}
                    <span className="font-medium">
                      {magangSelesai.dudi?.nama_perusahaan}
                    </span>{" "}
                    • Bidang:{" "}
                    <span className="font-medium">
                      {magangSelesai.dudi?.bidang_usaha}
                    </span>{" "}
                    • Status:{" "}
                    <span className="font-medium capitalize">
                      {magangSelesai.status}
                    </span>
                  </p>
                  {magangSelesai.tanggal_mulai &&
                    magangSelesai.tanggal_selesai && (
                      <p className="text-xs text-green-500 mt-1">
                        Periode: {magangSelesai.tanggal_mulai} -{" "}
                        {magangSelesai.tanggal_selesai}
                      </p>
                    )}
                </div>
                <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                  Selesai
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="text-xs text-green-600">
                  ⓘ Anda tidak dapat mendaftar magang lagi karena sudah
                  menyelesaikan program magang. Setiap siswa hanya diperbolehkan
                  magang satu kali.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Status Magang Aktif */}
      {sudahPunyaMagangAktif && magangAktif && !sudahPernahMagang && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Anda sudah memiliki magang aktif
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Status:{" "}
                <span className="font-medium capitalize">
                  {magangAktif.status}
                </span>{" "}
                • DUDI:{" "}
                <span className="font-medium">
                  {magangAktif.dudi?.nama_perusahaan}
                </span>{" "}
                • Bidang:{" "}
                <span className="font-medium">
                  {magangAktif.dudi?.bidang_usaha}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Pendaftaran - Hanya tampil jika belum pernah magang */}
      {!sudahPernahMagang && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Status Pendaftaran: {jumlahPendaftaran} dari{" "}
                {maksimalPendaftaran} DUDI
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {bisaDaftar && !sudahPunyaMagangAktif
                  ? `Anda masih bisa mendaftar ke ${
                      maksimalPendaftaran - jumlahPendaftaran
                    } DUDI lainnya`
                  : sudahPunyaMagangAktif
                  ? "Anda sudah memiliki magang aktif dan tidak bisa mendaftar lagi"
                  : "Anda sudah mencapai batas maksimal pendaftaran"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Pagination */}
      <div className="bg-white shadow-sm rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari perusahaan, bidang usaha, lokasi"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Tampilkan:</span>
          <select
            value={entriesPerPage}
            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
          <span className="text-sm text-gray-600">per halaman</span>
        </div>
      </div>

      {/* DUDI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Skeleton Loading - Tampilkan 6 skeleton cards
          <>
            {[...Array(6)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </>
        ) : paginatedData.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm
                ? "Tidak ada perusahaan yang sesuai dengan pencarian"
                : "Tidak ada DUDI aktif yang tersedia"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Reset pencarian
              </button>
            )}
          </div>
        ) : (
          paginatedData.map((dudi) => (
            <div
              key={dudi.id}
              className="bg-white shadow-sm rounded-xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200"
            >
              {/* Header: Company Name & Industry */}
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-[#4FC3F7] flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {dudi.nama_perusahaan}
                  </h3>
                  <p className="text-sm text-blue-600 truncate">
                    {dudi.bidang_usaha}
                  </p>
                </div>
              </div>

              {/* Address & PIC */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{dudi.alamat}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">PIC: {dudi.penanggung_jawab}</span>
                </div>
              </div>

              {/* Quota Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Kuota Magang
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {dudi.kuota.terisi}/{dudi.kuota.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(dudi.kuota.terisi / dudi.kuota.total) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {dudi.kuota.tersisa} slot tersisa
                </p>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 mb-4 line-clamp-3 leading-relaxed">
                {dudi.deskripsi}
              </p>

              {/* Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleViewDetail(dudi)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Detail
                </button>

                {/* Tombol Daftar dengan berbagai kondisi */}
                {sudahPernahMagang ? (
                  // Jika sudah pernah magang (selesai)
                  <button className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg cursor-not-allowed transition-colors flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Selesai Magang
                  </button>
                ) : dudi.sudah_daftar ? (
                  <button className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg cursor-not-allowed flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Sudah Mendaftar
                  </button>
                ) : sudahPunyaMagangAktif ? (
                  <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg cursor-not-allowed">
                    Sudah Magang
                  </button>
                ) : !bisaDaftar ? (
                  <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg cursor-not-allowed">
                    Batas Maksimal
                  </button>
                ) : dudi.kuota.tersisa === 0 ? (
                  <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg cursor-not-allowed">
                    Kuota Penuh
                  </button>
                ) : (
                  <button
                    onClick={() => handleApply(dudi.id)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ArrowRight className="h-3 w-3" /> Daftar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Info */}
      {!loading && filteredData.length > entriesPerPage && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Menampilkan {paginatedData.length} dari {filteredData.length}{" "}
            perusahaan
          </p>
          {filteredData.length > entriesPerPage && (
            <button
              onClick={() => setEntriesPerPage(entriesPerPage + 6)}
              className="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Tampilkan lebih banyak
            </button>
          )}
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
