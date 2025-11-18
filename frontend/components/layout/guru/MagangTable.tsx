// components/layout/guru/MagangTable.tsx

import { User, Building2, Calendar, SquarePen, Globe, Phone, Mail } from "lucide-react";

// Tipe data untuk entri Siswa Magang
interface MagangEntry {
    nis: string;
    name: string;
    email: string;
    class: string;
    major: string;
    phone: string;
    dudi: string;
    dudiCity: string;
    periodStart: string;
    periodEnd: string;
    status: 'Aktif' | 'Selesai' | 'Pending';
    score: number | '-';
}

const dummyData: MagangEntry[] = [
    { nis: '2024001', name: "Ahmad Rizki", email: "ahmad.rizki@email.com", class: 'XII RPL 1', major: 'Rekayasa Perangkat Lunak', phone: '081234567890', dudi: 'PT Kreatif Teknologi', dudiCity: 'Jakarta', periodStart: '1 Feb 2024', periodEnd: '1 Mei 2024', status: 'Aktif', score: '-' },
    { nis: '2024002', name: "Siti Nurhaliza", email: "siti.nur@email.com", class: 'XII RPL 2', major: 'Rekayasa Perangkat Lunak', phone: '081987654321', dudi: 'CV Digital Solusi', dudiCity: 'Surabaya', periodStart: '15 Jan 2024', periodEnd: '15 Apr 2024', status: 'Selesai', score: 87 },
    { nis: '2024003', name: "Budi Santoso", email: "budi.santoso@email.com", class: 'XII TKJ 1', major: 'Teknik Komputer Jaringan', phone: '082345678901', dudi: 'PT Inovasi Mandiri', dudiCity: 'Surabaya', periodStart: '1 Mar 2024', periodEnd: '1 Jun 2024', status: 'Pending', score: '-' },
    { nis: '2024004', name: "Dewi Lestari", email: "dewi.lestari@email.com", class: 'XII RPL 1', major: 'Rekayasa Perangkat Lunak', phone: '083456789012', dudi: 'PT Kreatif Teknologi', dudiCity: 'Jakarta', periodStart: '15 Feb 2024', periodEnd: '15 Mei 2024', status: 'Aktif', score: '-' },
];

const getStatusClasses = (status: MagangEntry['status']) => {
    switch (status) {
        case 'Aktif':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'Selesai':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Pending':
            return 'bg-orange-100 text-orange-700 border-orange-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

export function MagangTable() {
    return (
        <div className="overflow-x-auto">

            {/* BARIS PENCARIAN & FILTER (Sesuai image_60cc2b.png) */}
            <div className="flex items-center justify-between mb-6 space-x-4">

                {/* Search Input */}
                <input
                    type="text"
                    placeholder="Cari siswa, NIS, kelas, jurusan, DUDI..."
                    className="w-full max-w-lg px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0097BB] focus:border-transparent transition-colors shadow-sm"
                />

                {/* Filter Status */}
                <div className="flex items-center text-sm text-gray-600 space-x-4">

                    {/* Filter Status */}
                    <div className="flex items-center">
                        <label htmlFor="filter-status" className="mr-2">Status:</label>
                        <select
                            id="filter-status"
                            className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0097BB] focus:border-[#0097BB] appearance-none bg-white transition-colors text-sm"
                            defaultValue={'Semua'}
                        >
                            <option value="Semua">Semua</option>
                            <option value="Aktif">Aktif</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>

                    {/* Filter Per Halaman */}
                    <div className="flex items-center">
                        <label htmlFor="show-entries" className="mr-2 whitespace-nowrap">Per halaman:</label>
                        <select
                            id="show-entries"
                            className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0097BB] focus:border-[#0097BB] appearance-none bg-white transition-colors text-sm"
                            defaultValue={5}
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
                    {dummyData.map((siswa) => (
                        <tr key={siswa.nis} className="hover:bg-gray-50 transition-colors">

                            {/* Kolom Siswa */}
                            <td className="px-3 py-4 whitespace-nowrap">
                                <div className="flex items-start space-x-3">
                                    <div className="h-9 w-9 flex items-center justify-center rounded-full bg-cyan-100 text-[#0097BB] shrink-0">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{siswa.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">NIS: {siswa.nis}</p>
                                        <p className="text-xs text-gray-500"><Mail className="inline h-3 w-3 mr-1" />{siswa.email}</p>
                                    </div>
                                </div>
                            </td>

                            {/* Kolom Kelas & Jurusan */}
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                                <p className="font-medium text-gray-800">{siswa.class}</p>
                                <p className="text-xs text-gray-500">{siswa.major}</p>
                                <p className="text-xs text-gray-500"><Phone className="inline h-3 w-3 mr-1" />{siswa.phone}</p>
                            </td>

                            {/* Kolom DUDI */}
                            <td className="px-3 py-4 whitespace-nowrap text-sm">
                                <div className="flex items-center space-x-2">
                                    <Building2 className="h-4 w-4 text-gray-400" />
                                    <p className="font-medium text-gray-800">{siswa.dudi}</p>
                                </div>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <Globe className="h-3 w-3 mr-2 text-gray-400" />
                                    {siswa.dudiCity}
                                </div>
                            </td>

                            {/* Kolom Periode */}
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs font-medium text-gray-800">{siswa.periodStart}</p>
                                        <p className="text-xs text-gray-500">s.d {siswa.periodEnd}</p>
                                    </div>
                                </div>
                            </td>

                            {/* Kolom Status & Nilai */}
                            <td className="px-3 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                    <span
                                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusClasses(siswa.status)}`}
                                    >
                                        {siswa.status}
                                    </span>
                                </div>
                            </td>

                            {/* Kolom Nilai */}
                            <td className="px-3 py-4 whitespace-nowrap">
                                {siswa.score !== '-' ? (
                                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-400 text-gray-800">
                                        {siswa.score}
                                    </span>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </td>

                            {/* Kolom Aksi */}
                            <td className="px-3 py-4 whitespace-nowrap text-left text-sm font-medium">
                                <button className="text-gray-400 hover:text-[#0097BB] transition-colors p-1 rounded-md">
                                    <SquarePen className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Bagian Footer Pagination */}
            <div className="flex justify-between items-center pt-4 border-t mt-4 text-sm text-gray-600">
                <span>Menampilkan 1 sampai {dummyData.length} dari {dummyData.length} entri</span>
                <div className="flex space-x-1">
                    <button className="p-2 border rounded-lg hover:bg-gray-100"> &lt; </button>
                    <button className="p-2 border rounded-lg bg-[#0097BB] text-white"> 1 </button>
                    <button className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50" disabled={dummyData.length <= 5}> 2 </button>
                    <button className="p-2 border rounded-lg hover:bg-gray-100"> &gt; </button>
                </div>
            </div>
        </div>
    );
}