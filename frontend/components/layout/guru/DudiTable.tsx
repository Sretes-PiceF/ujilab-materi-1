// components/layout/guru/DudiTable.tsx
import { useState, useEffect } from 'react';
import { Building2, Phone, Mail, SquarePen, Trash2, User } from 'lucide-react';
import { useDudi } from '@/hooks/useDudi';
import { DudiModal } from './update/DudiModal';
import { DeleteModal } from './delete/DeleteModal';
import { Dudi, DudiFormData } from '@/types/dudi';

export function DudiTable() {
    const { dudiList, loading, error, createDudi, updateDudi, deleteDudi, fetchDudi } = useDudi();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDudi, setSelectedDudi] = useState<Dudi | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [entriesPerPage, setEntriesPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);

    // Pastikan dudiList selalu array
    const safeDudiList = Array.isArray(dudiList) ? dudiList : [];

    // Filter data - SESUAIKAN DENGAN KOLOM DATABASE
    const filteredData = safeDudiList.filter(dudi => {
        const matchesSearch = dudi.nama_perusahaan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dudi.penanggung_jawab?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dudi.alamat?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || dudi.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + entriesPerPage);

    const handleEdit = (dudi: Dudi) => {
        setSelectedDudi(dudi);
        setIsModalOpen(true);
    };

    const handleDelete = (dudi: Dudi) => {
        setSelectedDudi(dudi);
        setIsDeleteModalOpen(true);
    };

    const handleSave = async (formData: DudiFormData): Promise<boolean> => {
        if (selectedDudi) {
            return await updateDudi(selectedDudi.id, formData);
        } else {
            return await createDudi(formData);
        }
    };

    const handleConfirmDelete = async () => {
        if (selectedDudi) {
            const success = await deleteDudi(selectedDudi.id);
            if (success) {
                setIsDeleteModalOpen(false);
                setSelectedDudi(null);
            }
        }
    };

    // Debug: console log untuk melihat struktur data
    useEffect(() => {
        console.log('dudiList:', dudiList);
        console.log('Type of dudiList:', typeof dudiList);
        console.log('Is array:', Array.isArray(dudiList));
    }, [dudiList]);

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">Error: {error}</p>
                <button
                    onClick={fetchDudi}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            {/* Header dengan Search dan Filter */}
            <div className="flex items-center justify-between mb-6 space-x-4">
                {/* Search Input */}
                <input
                    type="text"
                    placeholder="Cari nama perusahaan, penanggung jawab, alamat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-lg px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0097BB] focus:border-transparent transition-colors shadow-sm"
                />

                {/* Filter */}
                <div className="flex items-center space-x-4">
                    {/* Filter Status */}
                    <div className="flex items-center">
                        <label htmlFor="filter-status" className="mr-2 text-sm text-gray-600">Status:</label>
                        <select
                            id="filter-status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0097BB] focus:border-[#0097BB] appearance-none bg-white transition-colors text-sm"
                        >
                            <option value="all">Semua</option>
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    {/* Entries Per Page */}
                    <div className="flex items-center">
                        <label htmlFor="show-entries" className="mr-2 text-sm text-gray-600 whitespace-nowrap">Per halaman:</label>
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

            {/* Table */}
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                    <tr>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">Perusahaan</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">Kontak</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">Penanggung Jawab</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-auto">Siswa Magang</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Aksi</th>
                    </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-100">
                    {loading ? (
                        // Loading State
                        <tr>
                            <td colSpan={5} className="px-3 py-8 text-center">
                                <div className="flex justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0097BB]"></div>
                                </div>
                                <p className="text-gray-500 mt-2">Memuat data DUDI...</p>
                            </td>
                        </tr>
                    ) : safeDudiList.length === 0 ? (
                        // Empty State
                        <tr>
                            <td colSpan={5} className="px-3 py-8 text-center">
                                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">Tidak ada data DUDI</p>
                                {error && (
                                    <p className="text-red-500 text-sm mt-2">{error}</p>
                                )}
                            </td>
                        </tr>
                    ) : paginatedData.length === 0 ? (
                        // No results from search/filter
                        <tr>
                            <td colSpan={5} className="px-3 py-8 text-center">
                                <p className="text-gray-500">Tidak ada data yang sesuai dengan pencarian</p>
                            </td>
                        </tr>
                    ) : (
                        // Data Rows - SESUAIKAN DENGAN KOLOM DATABASE
                        paginatedData.map((dudi) => (
                            <tr key={dudi.id} className="hover:bg-gray-50 transition-colors">
                                {/* Kolom Perusahaan */}
                                <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="flex items-start space-x-3">
                                        <div className="h-9 w-9 flex items-center justify-center rounded-full bg-cyan-100 text-[#0097BB] shrink-0">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{dudi.nama_perusahaan || 'N/A'}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* Kolom Kontak */}
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                                    <p className="text-xs text-gray-500">
                                        <Mail className="inline h-3 w-3 mr-1" />
                                        {dudi.email || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        <Phone className="inline h-3 w-3 mr-1" />
                                        {dudi.telepon || 'N/A'}
                                    </p>
                                </td>

                                {/* Kolom Alamat */}
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <div>
                                    <p className="font-medium text-gray-800">{dudi.penanggung_jawab || 'N/A'}</p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-3 py-4 whitespace-nowrap">
                                 <div className="flex flex-col items-center space-y-1">
        {/* Total Siswa */}
                                    <div className="flex items-center space-x-2 mr-20">
                                    <span className="text-2xl font-bold text-[#0097BB]">
                                        {dudi.total_siswa || 0}
                                    </span>
                                         </div>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        </span>
                                                     </div>
                                                     </td>

                                {/* Kolom Aksi */}
                                <td className="px-3 py-4 whitespace-nowrap text-left text-sm font-medium">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleEdit(dudi)}
                                            className="text-gray-400 hover:text-[#0097BB] transition-colors p-1 rounded-md"
                                            title="Edit DUDI"
                                        >
                                            <SquarePen className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(dudi)}
                                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md"
                                            title="Hapus DUDI"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
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

            {/* Modals */}
            <DudiModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                dudi={selectedDudi}
                title={selectedDudi ? 'Edit DUDI' : 'Tambah DUDI Baru'}
            />

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                itemName={selectedDudi?.nama_perusahaan || 'DUDI'}
            />
        </div>
    );
}