// components/layout/siswa/LogbookTable.tsx
"use client";
import { useState } from 'react';
import { Calendar, Camera, Eye, Pencil, Trash2, Plus } from "lucide-react";

// Interface untuk data logbook siswa
interface LogbookEntry {
    id: number;
    date: string;
    activity: string;
    challenge: string;
    status: 'Disetujui' | 'Belum Diverifikasi' | 'Ditolak';
    verification: {
        guru: string;
        dudi: string;
    };
    hasPhoto: boolean;
}

// Props untuk komponen
interface LogbookTableProps {
    logbookData?: LogbookEntry[]; // Optional, akan menggunakan dummy data jika tidak disediakan
    onAddLogbook?: () => void;
    onViewDetail?: (logbook: LogbookEntry) => void;
    onEdit?: (logbook: LogbookEntry) => void;
    onDelete?: (logbook: LogbookEntry) => void;
}

// Data dummy untuk logbook
const defaultLogbookData: LogbookEntry[] = [
    {
        id: 1,
        date: "2024-03-01",
        activity: "Membuat desain UI aplikasi kasir menggunakan Figma...",
        challenge: "Kesulitan menentukan skema warna yang tepat dan...",
        status: "Disetujui",
        verification: {
            guru: "Bagus, lanjutkan dengan implementasi",
            dudi: "Desain sudah sesuai dengan brief yang diberikan"
        },
        hasPhoto: true
    },
    {
        id: 2,
        date: "2024-03-02",
        activity: "Belajar backend Laravel untuk membangun REST API sistem...",
        challenge: "Error saat menjalankan migration database dan...",
        status: "Belum Diverifikasi",
        verification: {
            guru: "",
            dudi: ""
        },
        hasPhoto: true
    },
    {
        id: 3,
        date: "2024-03-03",
        activity: "Implementasi autentikasi dan authorization menggunakan...",
        challenge: "Token JWT expire terlalu cepat, perlu penyesuaian konfigurasi",
        status: "Ditolak",
        verification: {
            guru: "Perbaiki deskripsi kegiatan, terlalu singkat",
            dudi: "Kurang detail dalam menjelaskan langkah-langkah implementasi"
        },
        hasPhoto: true
    },
    {
        id: 4,
        date: "2024-03-04",
        activity: "Melakukan testing unit pada endpoint API yang telah...",
        challenge: "Beberapa test case gagal karena setup database testing...",
        status: "Disetujui",
        verification: {
            guru: "Sudah bagus, dokumentasikan hasil testingnya",
            dudi: "Testing sudah comprehensive"
        },
        hasPhoto: false
    }
];

export function LogbookTable({ 
    logbookData = defaultLogbookData, 
    onAddLogbook, 
    onViewDetail, 
    onEdit, 
    onDelete 
}: LogbookTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [entriesPerPage, setEntriesPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter data berdasarkan pencarian dan status
    const filteredData = logbookData.filter(log => {
        const matchesSearch = 
            log.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.challenge.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'Semua' || log.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + entriesPerPage);

    // Format tanggal
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Handler untuk tombol aksi default
    const handleViewDetail = (logbook: LogbookEntry) => {
        if (onViewDetail) {
            onViewDetail(logbook);
        } else {
            console.log('View detail:', logbook);
            // Default behavior bisa ditambahkan di sini
        }
    };

    const handleEdit = (logbook: LogbookEntry) => {
        if (onEdit) {
            onEdit(logbook);
        } else {
            console.log('Edit:', logbook);
            // Default behavior bisa ditambahkan di sini
        }
    };

    const handleDelete = (logbook: LogbookEntry) => {
        if (onDelete) {
            onDelete(logbook);
        } else {
            console.log('Delete:', logbook);
            // Default behavior bisa ditambahkan di sini
        }
    };

    const handleAddLogbook = () => {
        if (onAddLogbook) {
            onAddLogbook();
        } else {
            console.log('Add new logbook');
            // Default behavior bisa ditambahkan di sini
        }
    };

    return (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            {/* Header Card dengan Daftar Logbook Harian dan Tombol */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#4FC3F7]" />
                    <h2 className="text-lg font-semibold text-gray-900">Daftar Logbook Harian</h2>
                </div>
                <button 
                    onClick={handleAddLogbook}
                    className="px-4 py-2 bg-[#4FC3F7] text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                    <Plus className="h-4 w-4" /> Tambah Logbook
                </button>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Cari kegiatan atau kendala..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 whitespace-nowrap">Status:</label>
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="Semua">Semua</option>
                                <option value="Disetujui">Disetujui</option>
                                <option value="Belum Diverifikasi">Belum Diverifikasi</option>
                                <option value="Ditolak">Ditolak</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 whitespace-nowrap">Per halaman:</label>
                            <select 
                                value={entriesPerPage}
                                onChange={(e) => {
                                    setEntriesPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white border-b border-gray-200">
                <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Tanggal & Foto</div>
                <div className="col-span-4 text-xs font-semibold text-gray-600 uppercase">Kegiatan & Kendala</div>
                <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase text-center">Status</div>
                <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase">Catatan Verifikasi</div>
                <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase text-center">Aksi</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
                {paginatedData.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                        <p className="text-gray-500">Tidak ada data logbook yang sesuai dengan pencarian</p>
                    </div>
                ) : (
                    paginatedData.map((log) => (
                        <div key={log.id} className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 transition-colors">
                            {/* Tanggal & Foto */}
                            <div className="col-span-2 flex items-start gap-3">
                                <div className="h-11 w-11 rounded-lg bg-[#4FC3F7] flex items-center justify-center flex-shrink-0">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm leading-tight">
                                        {formatDate(log.date)}
                                    </p>
                                    {log.hasPhoto && (
                                        <div className="flex items-center gap-1 mt-1.5">
                                            <Camera className="h-3.5 w-3.5 text-blue-500" />
                                            <span className="text-xs text-blue-600 font-medium">Ada foto</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Kegiatan & Kendala */}
                            <div className="col-span-4 space-y-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Kegiatan:</p>
                                    <p className="text-sm text-gray-900 line-clamp-2 leading-relaxed">{log.activity}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Kendala:</p>
                                    <p className="text-sm text-gray-900 line-clamp-2 leading-relaxed">{log.challenge}</p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="col-span-2 flex items-center justify-center">
                                <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${
                                    log.status === "Disetujui"
                                        ? "bg-green-100 text-green-700 border border-green-200"
                                        : log.status === "Belum Diverifikasi"
                                            ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                            : "bg-red-100 text-red-700 border border-red-200"
                                }`}>
                                    {log.status}
                                </span>
                            </div>

                            {/* Catatan Verifikasi */}
                            <div className="col-span-3 space-y-2">
                                {log.verification.guru ? (
                                    <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-lg">
                                        <p className="text-xs font-semibold text-blue-700 mb-1">Guru:</p>
                                        <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{log.verification.guru}</p>
                                    </div>
                                ) : null}
                                {log.verification.dudi ? (
                                    <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-lg">
                                        <p className="text-xs font-semibold text-purple-700 mb-1">DUDI:</p>
                                        <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{log.verification.dudi}</p>
                                    </div>
                                ) : null}
                                {!log.verification.guru && !log.verification.dudi && (
                                    <p className="text-xs text-gray-400 italic">Belum ada catatan</p>
                                )}
                            </div>

                            {/* Aksi */}
                            <div className="col-span-1 flex items-center justify-center gap-1">
                                <button
                                    onClick={() => handleViewDetail(log)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Lihat Detail"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleEdit(log)}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(log)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Hapus"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {filteredData.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <p className="text-sm text-gray-600">
                        Menampilkan <span className="font-semibold">{startIndex + 1}-{Math.min(startIndex + entriesPerPage, filteredData.length)}</span> dari <span className="font-semibold">{filteredData.length}</span> logbook
                    </p>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Sebelumnya
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                                    currentPage === page
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}