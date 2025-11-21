// components/layout/siswa/DudiTable.tsx
"use client";
import { useState, useEffect } from "react";
import { Building2, MapPin, User, ArrowRight, CheckCircle, XCircle, Check, AlertCircle } from "lucide-react";

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

interface DudiResponse {
    dudi_aktif: DudiData[];
    jumlah_pendaftaran: number;
    maksimal_pendaftaran: number;
    bisa_daftar: boolean;
    sudah_punya_magang_aktif: boolean;
    magang_aktif?: {
        id: number;
        status: string;
        dudi: {
            nama_perusahaan: string;
            bidang_usaha: string;
        };
    };
}

// Props untuk komponen
interface DudiTableProps {
    onApply?: (dudiId: number) => void;
    onViewDetail?: (dudi: DudiData) => void;
}

export function DudiTable({ onApply, onViewDetail }: DudiTableProps) {
    const [dudiData, setDudiData] = useState<DudiData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(6);
    const [jumlahPendaftaran, setJumlahPendaftaran] = useState(0);
    const [maksimalPendaftaran, setMaksimalPendaftaran] = useState(3);
    const [bisaDaftar, setBisaDaftar] = useState(true);
    const [sudahPunyaMagangAktif, setSudahPunyaMagangAktif] = useState(false);
    const [magangAktif, setMagangAktif] = useState<any>(null);

    // Fetch data DUDI aktif dari API
    const fetchDudiAktif = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Simulasi API call - ganti dengan API real Anda
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/siswa/dudi/aktif`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.success) {
                    setDudiData(result.data.dudi_aktif || []);
                    setJumlahPendaftaran(result.data.jumlah_pendaftaran || 0);
                    setMaksimalPendaftaran(result.data.maksimal_pendaftaran || 3);
                    setBisaDaftar(result.data.bisa_daftar ?? true);
                    setSudahPunyaMagangAktif(result.data.sudah_punya_magang_aktif || false);
                    setMagangAktif(result.data.magang_aktif || null);
                } else {
                    // Fallback ke dummy data jika API error
                    setDudiData(dummyDudiData);
                    setJumlahPendaftaran(1);
                    setMaksimalPendaftaran(3);
                    setBisaDaftar(true);
                    setSudahPunyaMagangAktif(false);
                }
            } else {
                // Fallback ke dummy data jika API tidak tersedia
                setDudiData(dummyDudiData);
                setJumlahPendaftaran(1);
                setMaksimalPendaftaran(3);
                setBisaDaftar(true);
                setSudahPunyaMagangAktif(false);
            }
        } catch (err: any) {
            console.error('Error fetching DUDI data:', err);
            // Fallback ke dummy data
            setDudiData(dummyDudiData);
            setJumlahPendaftaran(1);
            setMaksimalPendaftaran(3);
            setBisaDaftar(true);
            setSudahPunyaMagangAktif(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDudiAktif();
    }, []);

    // Dummy data sebagai fallback
    const dummyDudiData: DudiData[] = [
        {
            id: 1,
            nama_perusahaan: "PT Kreatif Teknologi",
            alamat: "Jl. Merdeka No. 123, Jakarta",
            telepon: "(021) 1234567",
            email: "info@kreatiftekno.com",
            penanggung_jawab: "Andi Wijaya",
            status_dudi: "aktif",
            bidang_usaha: "Teknologi Informasi",
            deskripsi: "Perusahaan teknologi yang bergerak dalam pengembangan aplikasi web dan mobile. Memberikan kesempatan magang bagi siswa SMK jurusan RPL.",
            kuota: { terisi: 8, total: 12, tersisa: 4 },
            fasilitas: ["Laptop", "Internet", "Makan Siang"],
            persyaratan: ["Surat Pengantar", "CV", "Transkrip Nilai"],
            sudah_daftar: false
        },
        {
            id: 2,
            nama_perusahaan: "CV Digital Solusi",
            alamat: "Jl. Sudirman No. 45, Surabaya",
            telepon: "(031) 7654321",
            email: "hr@digitalsolusi.co.id",
            penanggung_jawab: "Sari Dewi",
            status_dudi: "aktif",
            bidang_usaha: "Digital Marketing",
            deskripsi: "Konsultan digital marketing yang membantu UMKM berkembang di era digital. Menyediakan program magang untuk siswa SMK jurusan multimedia.",
            kuota: { terisi: 5, total: 8, tersisa: 3 },
            fasilitas: ["Workshop", "Mentoring", "Sertifikat"],
            persyaratan: ["Portfolio", "Surat Pengantar"],
            sudah_daftar: false
        },
        {
            id: 3,
            nama_perusahaan: "PT Inovasi Mandiri",
            alamat: "Jl. Diponegoro No. 78, Surabaya",
            telepon: "(031) 8889999",
            email: "recruitment@inovasimandiri.com",
            penanggung_jawab: "Budi Santoso",
            status_dudi: "aktif",
            bidang_usaha: "Software Development",
            deskripsi: "Perusahaan software house yang mengembangkan sistem informasi untuk berbagai industri. Menawarkan program magang untuk siswa jurusan RPL.",
            kuota: { terisi: 12, total: 15, tersisa: 3 },
            fasilitas: ["Flexible Time", "Project Based", "Certificate"],
            persyaratan: ["Basic Programming", "Surat Pengantar"],
            sudah_daftar: true
        },
        {
            id: 4,
            nama_perusahaan: "PT Teknologi Maju",
            alamat: "Jl. Ahmad Yani No. 90, Malang",
            telepon: "(0341) 4445555",
            email: "info@teknologimaju.com",
            penanggung_jawab: "Rina Setiawan",
            status_dudi: "aktif",
            bidang_usaha: "Hardware & Networking",
            deskripsi: "Spesialis hardware dan jaringan komputer. Membuka kesempatan magang untuk siswa jurusan TKJ dan TITL.",
            kuota: { terisi: 3, total: 6, tersisa: 3 },
            fasilitas: ["Toolkit", "Training", "Transport Allowance"],
            persyaratan: ["Surat Pengantar", "CV"],
            sudah_daftar: false
        },
        {
            id: 5,
            nama_perusahaan: "CV Solusi Digital Prima",
            alamat: "Jl. Gatot Subroto No. 15, Bandung",
            telepon: "(022) 3332222",
            email: "career@solusidigital.com",
            penanggung_jawab: "Dian Prasetyo",
            status_dudi: "aktif",
            bidang_usaha: "E-commerce",
            deskripsi: "Platform e-commerce lokal yang menyediakan layanan logistik dan pemasaran digital. Menerima magang untuk siswa jurusan pemasaran.",
            kuota: { terisi: 7, total: 10, tersisa: 3 },
            fasilitas: ["Laptop", "Internet", "Lunch"],
            persyaratan: ["Surat Pengantar", "Motivation Letter"],
            sudah_daftar: false
        },
        {
            id: 6,
            nama_perusahaan: "PT Inovasi Global",
            alamat: "Jl. Thamrin No. 22, Jakarta",
            telepon: "(021) 9998888",
            email: "hr@inovasiglobal.com",
            penanggung_jawab: "Fajar Hidayat",
            status_dudi: "aktif",
            bidang_usaha: "Konsultan IT",
            deskripsi: "Konsultan IT yang membantu perusahaan dalam transformasi digital. Membuka program magang untuk siswa SMK jurusan RPL dan TKJ.",
            kuota: { terisi: 9, total: 12, tersisa: 3 },
            fasilitas: ["Mentor", "Certificate", "Networking"],
            persyaratan: ["CV", "Surat Pengantar", "Basic IT Knowledge"],
            sudah_daftar: false
        }
    ];

    // Filter data berdasarkan pencarian
    const filteredData = dudiData.filter(dudi => 
        dudi.nama_perusahaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dudi.bidang_usaha.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dudi.alamat.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const paginatedData = filteredData.slice(0, entriesPerPage);

    // Fungsi untuk menampilkan notifikasi
    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    // Handler untuk mendaftar ke DUDI
   // Handler untuk mendaftar ke DUDI
const handleApply = async (dudiId: number) => {
    if (!bisaDaftar) {
        showNotification(`Anda sudah mencapai batas maksimal pendaftaran (${maksimalPendaftaran} DUDI)`, "error");
        return;
    }

    if (sudahPunyaMagangAktif) {
        showNotification("Anda sudah memiliki magang aktif", "error");
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/siswa/dudi/${dudiId}/daftar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                surat_pengantar: "Surat pengantar dari sekolah",
                cv: null,
                portofolio: null
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showNotification("Pendaftaran magang berhasil dikirim! Menunggu verifikasi dari perusahaan.", "success");
            
            // REFRESH DATA - Ini yang penting!
            await fetchDudiAktif();
            
            if (onApply) {
                onApply(dudiId);
            }
        } else {
            showNotification(result.message || "Gagal mengirim pendaftaran", "error");
        }
    } catch (err: any) {
        showNotification("Terjadi kesalahan saat mengirim pendaftaran", "error");
        console.error('Apply error:', err);
    }
};

    // Handler untuk melihat detail DUDI
    const handleViewDetail = (dudi: DudiData) => {
        if (onViewDetail) {
            onViewDetail(dudi);
        } else {
            console.log('View detail DUDI:', dudi);
            // Bisa ditambahkan modal atau navigasi ke halaman detail
            showNotification(`Melihat detail ${dudi.nama_perusahaan}`, "success");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Memuat data DUDI...</span>
            </div>
        );
    }

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
            {/* Info Status Magang Aktif */}
            {sudahPunyaMagangAktif && magangAktif && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-green-800 font-medium">
                                Anda sudah memiliki magang aktif
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                                Status: <span className="font-medium capitalize">{magangAktif.status}</span> • 
                                DUDI: <span className="font-medium">{magangAktif.dudi.nama_perusahaan}</span> • 
                                Bidang: <span className="font-medium">{magangAktif.dudi.bidang_usaha}</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Pendaftaran */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-blue-800 font-medium">
                            Status Pendaftaran: {jumlahPendaftaran} dari {maksimalPendaftaran} DUDI
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            {bisaDaftar && !sudahPunyaMagangAktif
                                ? `Anda masih bisa mendaftar ke ${maksimalPendaftaran - jumlahPendaftaran} DUDI lainnya`
                                : sudahPunyaMagangAktif
                                ? 'Anda sudah memiliki magang aktif dan tidak bisa mendaftar lagi'
                                : 'Anda sudah mencapai batas maksimal pendaftaran'
                            }
                        </p>
                    </div>
                </div>
            </div>

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
                {paginatedData.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">
                            {searchTerm 
                                ? 'Tidak ada perusahaan yang sesuai dengan pencarian'
                                : 'Tidak ada DUDI aktif yang tersedia'
                            }
                        </p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
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
                                    <h3 className="font-semibold text-gray-900 truncate">{dudi.nama_perusahaan}</h3>
                                    <p className="text-sm text-blue-600 truncate">{dudi.bidang_usaha}</p>
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
                                    <span className="text-sm font-medium text-gray-700">Kuota Magang</span>
                                    <span className="text-sm font-medium text-gray-700">
                                        {dudi.kuota.terisi}/{dudi.kuota.total}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${(dudi.kuota.terisi / dudi.kuota.total) * 100}%`
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
                                {dudi.sudah_daftar ? (
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
                                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
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
            {filteredData.length > entriesPerPage && (
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Menampilkan {paginatedData.length} dari {filteredData.length} perusahaan
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
                <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 ${
                    notification.type === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                }`}>
                    <div className="flex items-center gap-2">
                        {notification.type === 'success' ? (
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