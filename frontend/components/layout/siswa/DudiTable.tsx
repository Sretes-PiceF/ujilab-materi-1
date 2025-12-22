  "use client";
  import { useState, useEffect, useCallback, useRef } from "react";
  import {
    Building2,
    MapPin,
    User,
    CheckCircle,
    XCircle,
    Check,
    AlertCircle,
    RefreshCw,
  } from "lucide-react";
  import initEcho from "@/lib/echo";

  interface DudiBatchData {
    dudi_aktif: {
      dudi_aktif: DudiData[];
      bisa_daftar: boolean;
      jumlah_pendaftaran: number;
      maksimal_pendaftaran: number;
      sudah_punya_magang_aktif: boolean;
      magang_aktif: any;
      sudah_pernah_magang: boolean;
      magang_selesai: any;
    };
  }

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

  interface DudiTableProps {
    onViewDetail?: (dudi: DudiData) => void;
  }

  const SkeletonCard = () => (
    <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-100 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
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
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2"></div>
        <div className="h-2 bg-gray-200 rounded w-16 mt-1"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-2 bg-gray-200 rounded w-full"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-12"></div>
        <div className="h-7 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );

  export function DudiTable({ onViewDetail }: DudiTableProps) {
    const [dudiData, setDudiData] = useState<DudiData[]>([]);
    const [loading, setLoading] = useState(true);
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
    const [isDaftarLoading, setIsDaftarLoading] = useState<number | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isCached, setIsCached] = useState(false);
    const [cacheStatus, setCacheStatus] = useState<string>("");

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const echoRef = useRef<any>(null);
    const lastFetchTimeRef = useRef<Date | null>(null);

    const fetchDudiBatch = useCallback(async (forceRefresh = false) => {
      if (isValidating && !forceRefresh) return;
      
      setIsValidating(true);
      setError(null);

      const token = localStorage.getItem("access_token");
      try {
        const endpoint = forceRefresh 
          ? `${API_URL}/siswa/dudi/batch/fresh`
          : `${API_URL}/siswa/dudi/batch`;
        
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          cache: forceRefresh ? 'no-store' : 'default'
        });

        if (response.ok) {
          const result = await response.json();

          if (result.success) {
            const batchData = result.data as DudiBatchData;
            const dudiArray = batchData.dudi_aktif?.dudi_aktif || [];
            setDudiData(dudiArray);
            setJumlahPendaftaran(batchData.dudi_aktif.jumlah_pendaftaran || 0);
            setMaksimalPendaftaran(batchData.dudi_aktif.maksimal_pendaftaran || 3);
            setBisaDaftar(batchData.dudi_aktif.bisa_daftar ?? true);
            setSudahPunyaMagangAktif(
              batchData.dudi_aktif.sudah_punya_magang_aktif || false
            );
            setMagangAktif(batchData.dudi_aktif.magang_aktif || null);
            setSudahPernahMagang(batchData.dudi_aktif.sudah_pernah_magang || false);
            setMagangSelesai(batchData.dudi_aktif.magang_selesai || null);
            
            // Cache status untuk debugging
            setIsCached(result.cached || false);
            setCacheStatus(result.cached 
              ? `Cache (${result.cache_ttl}s)` 
              : forceRefresh ? 'Fresh data' : 'No cache'
            );
            lastFetchTimeRef.current = new Date();
            
            if (forceRefresh) {
              showNotification("Data diperbarui", "success");
            }
          } else {
            setError(result.message || "Gagal mengambil data DUDI");
          }
        } else {
          setError("Gagal terhubung ke server");
        }
      } catch {
        setError("Terjadi kesalahan saat mengambil data");
      } finally {
        setLoading(false);
        setIsValidating(false);
      }
    }, [API_URL, isValidating]);

    const handleDaftar = async (dudiId: number) => {
      if (isDaftarLoading === dudiId) return;
      
      setIsDaftarLoading(dudiId);
      const token = localStorage.getItem("access_token");
      if (!token) {
        showNotification("Silakan login terlebih dahulu", "error");
        setIsDaftarLoading(null);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/siswa/dudi/${dudiId}/daftar`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ dudi_id: dudiId }),
        });

        const result = await response.json();

        if (result.success) {
          showNotification("Pendaftaran berhasil dikirim!", "success");
          
          // Update state lokal
          setDudiData(prev => prev.map(dudi => 
            dudi.id === dudiId 
              ? { ...dudi, sudah_daftar: true }
              : dudi
          ));
          
          // Update jumlah pendaftaran
          const newJumlah = jumlahPendaftaran + 1;
          setJumlahPendaftaran(newJumlah);
          
          // Cek apakah sudah mencapai batas maksimal
          if (newJumlah >= maksimalPendaftaran) {
            setBisaDaftar(false);
          }
          
          // Refresh data setelah 1 detik untuk sinkronisasi
          setTimeout(() => {
            fetchDudiBatch(true);
          }, 1000);
          
        } else {
          showNotification(
            result.message || "Gagal mendaftar magang",
            "error"
          );
        }
      } catch {
        showNotification("Terjadi kesalahan saat mendaftar", "error");
      } finally {
        setIsDaftarLoading(null);
      }
    };

    const checkBolehDaftar = useCallback((magangAktif: any, jumlahPendaftaran: number, maksimalPendaftaran: number, sudahPernahMagang: boolean) => {
      if (sudahPernahMagang) {
        return false;
      }
      
      if (magangAktif) {
        const statusAktif = ['diterima', 'berlangsung'];
        if (statusAktif.includes(magangAktif.status)) {
          return false;
        }
        if (['ditolak', 'dibatalkan'].includes(magangAktif.status)) {
          return jumlahPendaftaran < maksimalPendaftaran;
        }
      }
      
      if (jumlahPendaftaran >= maksimalPendaftaran) {
        return false;
      }
      
      return true;
    }, []);

    const setupRealtimeChannels = useCallback(() => {
      try {
        const echo = initEcho();
        echoRef.current = echo;

        const dudiChannel = echo.channel('dudi');
        
        dudiChannel
          .listen('.DudiUpdated', (event: any) => {
            showNotification("Data DUDI diperbarui", "success");
            
            setDudiData(prevData =>
              prevData.map(dudi =>
                dudi.id === event.id 
                  ? { 
                      ...dudi, 
                      nama_perusahaan: event.nama_perusahaan || dudi.nama_perusahaan,
                      alamat: event.alamat || dudi.alamat,
                      telepon: event.telepon || dudi.telepon,
                      email: event.email || dudi.email,
                      kuota: event.kuota ? {
                        ...dudi.kuota,
                        terisi: event.kuota.terisi || dudi.kuota.terisi,
                        tersisa: event.kuota.tersisa || dudi.kuota.tersisa
                      } : dudi.kuota
                    }
                  : dudi
              )
            );
            
            // Refresh data untuk sinkronisasi
            setTimeout(() => {
              fetchDudiBatch(true);
            }, 500);
          })
          .listen('.KuotaUpdated', (event: any) => {
            if (event.dudi_id) {
              showNotification("Kuota DUDI diperbarui", "success");
              
              setDudiData(prevData =>
                prevData.map(dudi =>
                  dudi.id === event.dudi_id 
                    ? { 
                        ...dudi, 
                        kuota: {
                          ...dudi.kuota,
                          terisi: event.terisi || dudi.kuota.terisi,
                          tersisa: event.tersisa || dudi.kuota.tersisa
                        }
                      }
                    : dudi
                )
              );
            }
          });

        const magangChannel = echo.channel('magang');
        
        magangChannel
          .listen('.MagangCreated', (event: any) => {
            const userDataStr = localStorage.getItem("user");
            if (!userDataStr) return;
            
            try {
              const userData = JSON.parse(userDataStr);
              if (userData.siswa_id === event.siswa_id) {
                showNotification("Status magang diperbarui", "success");
                fetchDudiBatch(true);
              }
            } catch {
              // Ignore parsing errors
            }
          })
          .listen('.MagangUpdated', (event: any) => {
            const userDataStr = localStorage.getItem("user");
            if (!userDataStr) return;
            
            try {
              const userData = JSON.parse(userDataStr);
              if (userData.siswa_id === event.siswa_id) {
                showNotification("Status magang diperbarui", "success");
                fetchDudiBatch(true);
              }
            } catch {
              // Ignore parsing errors
            }
          })
          .listen('.MagangDeleted', (event: any) => {
            const userDataStr = localStorage.getItem("user");
            if (!userDataStr) return;
            
            try {
              const userData = JSON.parse(userDataStr);
              if (userData.siswa_id === event.siswa_id) {
                showNotification("Status magang diperbarui", "success");
                fetchDudiBatch(true);
              }
            } catch {
              // Ignore parsing errors
            }
          });

      } catch (error) {
        // Silent error for WebSocket
      }
    }, [fetchDudiBatch]);

    useEffect(() => {
      fetchDudiBatch();

      // Auto refresh setiap 15 detik
      const intervalId = setInterval(() => {
        fetchDudiBatch(false);
      }, 15000);

      // Setup WebSocket setelah 1 detik
      const timer = setTimeout(() => {
        setupRealtimeChannels();
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(intervalId);
        if (echoRef.current) {
          try {
            echoRef.current.leaveChannel('dudi');
            echoRef.current.leaveChannel('magang');
          } catch {
            // Ignore cleanup errors
          }
        }
      };
    }, [fetchDudiBatch, setupRealtimeChannels]);

    useEffect(() => {
      const bolehDaftar = checkBolehDaftar(
        magangAktif, 
        jumlahPendaftaran, 
        maksimalPendaftaran, 
        sudahPernahMagang
      );
      setBisaDaftar(bolehDaftar);
    }, [magangAktif, jumlahPendaftaran, maksimalPendaftaran, sudahPernahMagang, checkBolehDaftar]);

    const showNotification = (
      message: string,
      type: "success" | "error" | "info"
    ) => {
      setNotification({ message, type: type as "success" | "error" });

      const duration = type === "error" ? 5000 : 3000;
      setTimeout(() => {
        setNotification(null);
      }, duration);
    };

    const handleViewDetail = (dudi: DudiData) => {
      if (onViewDetail) {
        onViewDetail(dudi);
      }
    };

    const handleManualRefresh = () => {
      fetchDudiBatch(true);
    };

    const filteredData = dudiData.filter(
      (dudi) =>
        dudi.nama_perusahaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dudi.bidang_usaha.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dudi.alamat.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedData = filteredData.slice(0, entriesPerPage);

    const getButtonForDudi = (dudi: DudiData) => {
      if (sudahPernahMagang) {
        return (
          <button
            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg flex items-center gap-1 cursor-not-allowed"
            title="Sudah menyelesaikan magang"
          >
            <CheckCircle className="h-3 w-3 text-green-600" />
            Selesai Magang
          </button>
        );
      }

      if (sudahPunyaMagangAktif && magangAktif && 
          (magangAktif.status === 'diterima' || magangAktif.status === 'berlangsung')) {
        return (
          <button
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg cursor-not-allowed"
            title="Sudah memiliki magang aktif"
          >
            Sudah Magang
          </button>
        );
      }

      if (dudi.sudah_daftar) {
        return (
          <button
            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg flex items-center gap-1 cursor-not-allowed"
            title="Sudah mendaftar ke DUDI ini"
          >
            <CheckCircle className="h-3 w-3" /> Sudah Mendaftar
          </button>
        );
      }

      if (!bisaDaftar) {
        return (
          <button
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg cursor-not-allowed"
            title="Sudah mencapai batas maksimal pendaftaran"
          >
            Batas Maksimal
          </button>
        );
      }

      if (dudi.kuota.tersisa === 0) {
        return (
          <button
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg cursor-not-allowed"
            title="Kuota magang sudah penuh"
          >
            Kuota Penuh
          </button>
        );
      }

      if (bisaDaftar && dudi.kuota.tersisa > 0 && !dudi.sudah_daftar) {
        const isLoading = isDaftarLoading === dudi.id;
        
        return (
          <button
            className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors cursor-pointer ${
              isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={() => !isLoading && handleDaftar(dudi.id)}
            title="Daftar magang"
            disabled={isLoading}
          >
            {isLoading ? 'Mendaftar...' : 'Daftar'}
          </button>
        );
      }

      return (
        <button
          className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
          title="Fitur pendaftaran tidak tersedia"
        >
          Tidak Tersedia
        </button>
      );
    };

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <p className="text-red-700 mb-4">Error: {error}</p>
            <button
              onClick={() => fetchDudiBatch()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Header dengan status cache */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Daftar DUDI</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`h-2 w-2 rounded-full ${isCached ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span className="text-xs text-gray-500">
                {isValidating ? "Memperbarui..." : cacheStatus}
              </span>
              {lastFetchTimeRef.current && (
                <span className="text-xs text-gray-400 ml-2">
                  • Terakhir: {lastFetchTimeRef.current.toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={handleManualRefresh}
            disabled={isValidating}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? "Memperbarui..." : "Refresh"}
          </button>
        </div>

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
                    menyelesaikan program magang.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {sudahPunyaMagangAktif && magangAktif && 
        (magangAktif.status === 'diterima' || magangAktif.status === 'berlangsung') && 
        !sudahPernahMagang && (
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
                    ? `Anda bisa mendaftar ke ${maksimalPendaftaran - jumlahPendaftaran} DUDI lagi`
                    : sudahPunyaMagangAktif
                    ? "Anda sudah memiliki magang aktif"
                    : "Anda sudah mencapai batas maksimal pendaftaran"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari perusahaan, bidang usaha, lokasi"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-text"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Tampilkan:</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
            <span className="text-sm text-gray-600">per halaman</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
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
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
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

                <p className="text-xs text-gray-500 mb-4 line-clamp-3 leading-relaxed">
                  {dudi.deskripsi}
                </p>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handleViewDetail(dudi)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
                  >
                    Detail
                  </button>

                  {getButtonForDudi(dudi)}
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && filteredData.length > entriesPerPage && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Menampilkan {paginatedData.length} dari {filteredData.length}{" "}
              perusahaan
            </p>
            {filteredData.length > entriesPerPage && (
              <button
                onClick={() => setEntriesPerPage(entriesPerPage + 6)}
                className="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Tampilkan lebih banyak
              </button>
            )}
          </div>
        )}

        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 ${
              notification.type === "success"
                ? "bg-green-500 text-white"
                : notification.type === "error"
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle className="h-5 w-5" />
              ) : notification.type === "error" ? (
                <XCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="text-sm">{notification.message}</span>
            </div>
          </div>
        )}
      </>
    );
  }