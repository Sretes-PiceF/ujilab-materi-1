// components/layout/guru/MagangTable.tsx
import { useEffect, useState, useCallback } from 'react';
import { User, Building2, Calendar, SquarePen, MapPin, Phone, Mail, Trash2 } from "lucide-react";
import { useMagang } from '@/hooks/useMagang';
import { Magang } from '@/types/magang';
import { MagangModal } from './update/MagangModal';

const getStatusClasses = (status: Magang['status']) => {
    switch (status) {
        case 'berlangsung':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'selesai':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'pending':
            return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'diterima':
            return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'ditolak':
            return 'bg-red-100 text-red-700 border-red-200';
        case 'dibatalkan':
            return 'bg-gray-100 text-gray-700 border-gray-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const getStatusLabel = (status: Magang['status']) => {
    switch (status) {
        case 'berlangsung':
            return 'Berlangsung';
        case 'selesai':
            return 'Selesai';
        case 'pending':
            return 'Pending';
        case 'diterima':
            return 'Diterima';
        case 'ditolak':
            return 'Ditolak';
        case 'dibatalkan':
            return 'Dibatalkan';
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
    status: 'pending' | 'diterima' | 'ditolak' | 'berlangsung' | 'selesai' | 'dibatalkan';
    nilai_akhir?: number | null;
    catatan?: string;
    siswa?: any;
    dudi?: any;
}

export function MagangTable() {
    const { 
        magangList, 
        siswaList,
        dudiList,
        loading, 
        error, 
        fetchMagang, 
        deleteMagang,
        updateMagang,
        createMagang,
    } = useMagang();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [entriesPerPage, setEntriesPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [userEmails, setUserEmails] = useState<{[key: number]: string}>({});
    const [loadingEmails, setLoadingEmails] = useState(false);
    
    // State untuk modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMagang, setSelectedMagang] = useState<MagangForModal | null>(null);
    const [modalTitle, setModalTitle] = useState('');

    // Fetch email users berdasarkan user_id dari siswa
    const fetchUserEmails = useCallback(async () => {
        setLoadingEmails(true);
        try {
            // Kumpulkan semua user_id unik dari siswaList
            const uniqueUserIds = Array.from(new Set(siswaList
                .filter(siswa => siswa.user_id)
                .map(siswa => siswa.user_id)
            ));

            if (uniqueUserIds.length === 0) {
                setLoadingEmails(false);
                return;
            }

            const emails: {[key: number]: string} = {};
            
            // Fetch data user untuk setiap user_id
            for (const userId of uniqueUserIds) {
                try {
                    const response = await fetch(`/api/users/${userId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        if (userData.success && userData.data) {
                            emails[userId] = userData.data.email;
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching user ${userId}:`, error);
                }
            }

            setUserEmails(emails);
        } catch (error) {
            console.error('Error fetching user emails:', error);
        } finally {
            setLoadingEmails(false);
        }
    }, [siswaList]); // Tambahkan siswaList sebagai dependency

    // Fetch emails ketika siswaList berubah
    useEffect(() => {
        if (siswaList.length > 0) {
            fetchUserEmails();
        }
    }, [siswaList, fetchUserEmails]); // Tambahkan fetchUserEmails sebagai dependency

    // Get email dari siswa berdasarkan user_id
    const getSiswaEmail = (siswa: any): string => {
        if (!siswa) return 'Loading...';
        
        // Jika loading masih berlangsung
        if (loadingEmails) return 'Loading...';
        
        // Cek jika ada user_id dan email tersedia di state
        if (siswa.user_id && userEmails[siswa.user_id]) {
            return userEmails[siswa.user_id];
        }
        
        // Fallback: cek di berbagai kemungkinan properti
        if (siswa.email) return siswa.email;
        if (siswa.user?.email) return siswa.user.email;
        if (siswa.user_email) return siswa.user_email;
        if (siswa.email_siswa) return siswa.email_siswa;
        
        return 'Email tidak tersedia';
    };

    // Filter data
    const filteredData = magangList.filter(magang => {
        const matchesSearch = 
            magang.siswa?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            magang.siswa?.nis?.toString().includes(searchTerm) ||
            magang.siswa?.kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            magang.siswa?.jurusan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            magang.dudi?.nama_perusahaan?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || magang.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + entriesPerPage);

    // Format tanggal
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Konversi Magang ke MagangForModal
    const convertToModalFormat = (magang: Magang): MagangForModal => {
        return {
            id: magang.id.toString(),
            siswa_id: magang.siswa_id.toString(),
            dudi_id: magang.dudi_id.toString(),
            tanggal_mulai: magang.tanggal_mulai,
            tanggal_selesai: magang.tanggal_selesai,
            status: magang.status,
            nilai_akhir: magang.nilai_akhir ?? null,
            siswa: magang.siswa,
            dudi: magang.dudi
        };
    };

    // Handle buka modal untuk create
    const handleCreateMagang = () => {
        setSelectedMagang(null);
        setModalTitle('Tambah Magang Baru');
        setIsModalOpen(true);
    };

    // Handle buka modal untuk edit
    const handleEditMagang = (magang: Magang) => {
        const modalMagang = convertToModalFormat(magang);
        setSelectedMagang(modalMagang);
        setModalTitle('Edit Data Magang');
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
                await fetchMagang(); // Refresh data
                // Refresh emails juga
                await fetchUserEmails();
                return true;
            } else {
                alert('Gagal menyimpan data: ' + result.message);
                return false;
            }
        } catch (error) {
            console.error('Error saving magang:', error);
            alert('Terjadi kesalahan saat menyimpan data');
            return false;
        }
    };

    // Handle delete magang
    const handleDelete = async (magang: Magang) => {
        if (confirm(`Apakah Anda yakin ingin menghapus magang untuk siswa ${magang.siswa?.nama}?`)) {
            const result = await deleteMagang(magang.id);
            if (result.success) {
                alert('Magang berhasil dihapus');
            } else {
                alert('Gagal menghapus magang: ' + result.message);
            }
        }
    };

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">Error: {error}</p>
                <button
                    onClick={fetchMagang}
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
                {/* HEADER DENGAN TOMBOL TAMBAH */}
                <div className="flex justify-between items-center mb-3">
                    <h1 className="text-2xl font-bold text-gray-800">Data Magang</h1>
                </div>

                {/* BARIS PENCARIAN & FILTER */}
                <div className="flex items-center justify-between mb-6 space-x-4">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Cari siswa, NIS, kelas, jurusan, DUDI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-lg px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0097BB] focus:border-transparent transition-colors shadow-sm"
                    />

                    {/* Filter Status */}
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                        {/* Filter Status */}
                        <div className="flex items-center">
                            <label htmlFor="filter-status" className="mr-2">Status:</label>
                            <select
                                id="filter-status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0097BB] focus:border-[#0097BB] appearance-none bg-white transition-colors text-sm"
                            >
                                <option value="all">Semua</option>
                                <option value="pending">Pending</option>
                                <option value="diterima">Diterima</option>
                                <option value="ditolak">Ditolak</option>
                                <option value="berlangsung">Berlangsung</option>
                                <option value="selesai">Selesai</option>
                                <option value="dibatalkan">Dibatalkan</option>
                            </select>
                        </div>

                        {/* Filter Per Halaman */}
                        <div className="flex items-center">
                            <label htmlFor="show-entries" className="mr-2 whitespace-nowrap">Per halaman:</label>
                            <select
                                id="show-entries"
                                value={entriesPerPage}
                                onChange={(e) => {
                                    setEntriesPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0097BB] focus:border-[#0097BB] appearance-none bg-white transition-colors text-sm"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading indicator untuk emails */}
                {loadingEmails && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            Memuat data email...
                        </p>
                    </div>
                )}

                {/* TABLE START */}
                <table className="min-w-full divide-y divide-gray-200">
                    {/* HEAD TABLE */}
                    <thead className="bg-white">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/5">Siswa</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/5">Kelas & Jurusan</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/5">DUDI</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-auto">Periode</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-auto">Status</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">Nilai</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">Aksi</th>
                        </tr>
                    </thead>

                    {/* BODY TABLE */}
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            // Loading State
                            <tr>
                                <td colSpan={7} className="px-3 py-8 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0097BB]"></div>
                                    </div>
                                    <p className="text-gray-500 mt-2">Memuat data magang...</p>
                                </td>
                            </tr>
                        ) : magangList.length === 0 ? (
                            // Empty State
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
                        ) : paginatedData.length === 0 ? (
                            // No results from search/filter
                            <tr>
                                <td colSpan={7} className="px-3 py-8 text-center">
                                    <p className="text-gray-500">Tidak ada data yang sesuai dengan pencarian</p>
                                </td>
                            </tr>
                        ) : (
                            // Data Rows
                            paginatedData.map((magang) => (
                                <tr key={magang.id} className="hover:bg-gray-50 transition-colors">
                                    {/* Kolom Siswa */}
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        <div className="flex items-start space-x-3">
                                            <div className="h-9 w-9 flex items-center justify-center rounded-full bg-cyan-100 text-[#0097BB] shrink-0">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{magang.siswa?.nama || 'N/A'}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">NIS: {magang.siswa?.nis || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">
                                                    <Mail className="inline h-3 w-3 mr-1" />
                                                    {getSiswaEmail(magang.siswa)}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Kolom Kelas & Jurusan */}
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <p className="font-medium text-gray-800">{magang.siswa?.kelas || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{magang.siswa?.jurusan || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">
                                            <Phone className="inline h-3 w-3 mr-1" />
                                            {magang.siswa?.telepon || 'N/A'}
                                        </p>
                                    </td>

                                    {/* Kolom DUDI */}
                                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center space-x-2">
                                            <Building2 className="h-4 w-4 text-gray-400" />
                                            <p className="font-medium text-gray-800">{magang.dudi?.nama_perusahaan || 'N/A'}</p>
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                            <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                                            {magang.dudi?.alamat || 'N/A'}
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
                                                className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusClasses(magang.status)}`}
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
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {!loading && filteredData.length > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t mt-4 text-sm text-gray-600">
                        <span>
                            Menampilkan {startIndex + 1} sampai {Math.min(startIndex + entriesPerPage, filteredData.length)} dari {filteredData.length} entri
                        </span>
                        <div className="flex space-x-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                &lt;
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`p-2 border rounded-lg transition-colors ${
                                        currentPage === page
                                            ? 'bg-[#0097BB] text-white'
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
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
                siswaList={siswaList.map(siswa => ({
                    id: siswa.id.toString(),
                    name: siswa.nama,
                    nis: siswa.nis,
                    email: getSiswaEmail(siswa),
                    kelas: siswa.kelas,
                    jurusan: siswa.jurusan,
                    telepon: siswa.telepon
                }))}
                dudiList={dudiList.map(dudi => ({
                    id: dudi.id.toString(),
                    nama_perusahaan: dudi.nama_perusahaan,
                    alamat: dudi.alamat,
                    telepon: dudi.telepon,
                    email: dudi.email || '',
                    penanggung_jawab: dudi.penanggung_jawab
                }))}
            />
        </>
    );
}