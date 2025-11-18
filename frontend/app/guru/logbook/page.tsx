// app/guru/logbook/page.tsx (atau lokasi yang sesuai)

import { CardStats } from "@/components/ui/CardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ThumbsUp,
    ThumbsDown,
    BookOpen,
    User,
    Calendar,
    MoreHorizontal, // Untuk tombol titik tiga (Aksi)
    Clock, // Mengganti ClockFading
} from "lucide-react";

// Tipe data untuk entri Logbook
interface LogbookEntry {
    id: number;
    name: string;
    date: string;
    photo: boolean;
    activity: string;
    constraint: string;
    status: 'Disetujui' | 'Belum Diverifikasi' | 'Ditolak';
    teacherNote: string;
    dudiNote: string;
}

const logbookData: LogbookEntry[] = [
    {
        id: 1, name: "Ahmad Rizki", date: "1 Mar 2024", photo: true,
        activity: "Membuat desain UI aplikasi kasir menggunakan Figma. Melakukan analisis...",
        constraint: "Kesulitan menentukan skema warna yang tepat dan konsisten untuk seluruh aplikasi",
        status: 'Disetujui',
        teacherNote: "Bagus, lanjutkan dengan implementasi",
        dudiNote: "Desain sudah sesuai dengan brief yang diberikan"
    },
    {
        id: 2, name: "Ahmad Rizki", date: "2 Mar 2024", photo: true,
        activity: "Belajar backend Laravel untuk membangun REST API sistem kasir. Mempelajari konsep...",
        constraint: "Error saat menjalankan migration database dan kesulitan memahami relationship antar...",
        status: 'Belum Diverifikasi',
        teacherNote: "Belum ada catatan",
        dudiNote: ""
    },
    {
        id: 3, name: "Siti Nurhaliza", date: "1 Mar 2024", photo: false,
        activity: "Setup server Linux Ubuntu untuk deployment aplikasi web. Konfigurasi Apache dan MySQL.",
        constraint: "Belum familiar dengan command line interface dan permission system di Linux",
        status: 'Ditolak',
        teacherNote: "Perbaiki deskripsi kegiatan, terlalu singkat",
        dudiNote: "Kurang detail dalam"
    },
];

const getStatusClasses = (status: LogbookEntry['status']) => {
    switch (status) {
        case 'Disetujui':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'Belum Diverifikasi':
            return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'Ditolak':
            return 'bg-red-100 text-red-700 border-red-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

export default function LogBookPage() {
    return (
        <div className="p-8">

            {/* 1. HEADER HALAMAN */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Manajamen LogBook Magang</h1>
                <p className="text-gray-600 mt-1">
                    Kelola dan verifikasi laporan harian kegiatan siswa magang <span className="font-semibold">SIMNAS</span>
                </p>
            </div>

            {/* 2. GRID CARDS STATS */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">

                <CardStats
                    title="Total Logbook"
                    value={350} // Data dummy
                    description="Keseluruhan catatan harian"
                    icon={BookOpen}
                />

                <CardStats
                    title="Belum Diverifikasi"
                    value={45}
                    description="Menunggu persetujuan Guru/DUDI"
                    icon={Clock} // Menggunakan ikon Clock
                />

                <CardStats
                    title="Disetujui"
                    value={280} // Data dummy
                    description="Telah disetujui Guru & DUDI"
                    icon={ThumbsUp}
                />

                <CardStats
                    title="Ditolak"
                    value={25} // Data dummy
                    description="Perlu revisi siswa"
                    icon={ThumbsDown}
                />
            </div>

            {/* 3. CARD TABEL LOGBOOK */}
            <Card className="shadow-lg rounded-xl">
                <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                        <BookOpen className="h-5 w-5 mr-2 text-cyan-600" /> Daftar Logbook Harian
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-6">
                    {/* BARIS PENCARIAN & FILTER (Sesuai image_613908.png) */}
                    <div className="flex items-center justify-between mb-6 space-x-4">

                        {/* Search Input */}
                        <div className="w-full max-w-lg">
                            <input
                                type="text"
                                placeholder="Cari siswa, kegiatan, atau kendala..."
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0097BB] focus:border-transparent transition-colors shadow-sm"
                            />
                        </div>

                        {/* Filter Status dan Per Halaman */}
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
                                    <option value="Disetujui">Disetujui</option>
                                    <option value="Belum Diverifikasi">Belum Diverifikasi</option>
                                    <option value="Ditolak">Ditolak</option>
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

                    {/* TABLE LOGBOOK */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">

                            {/* HEAD TABLE */}
                            <thead>
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/6">Siswa & Tanggal</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">Kegiatan & Kendala</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-auto">Status</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">Catatan</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">Aksi</th>
                                </tr>
                            </thead>

                            {/* BODY TABLE */}
                            <tbody className="bg-white divide-y divide-gray-100">
                                {logbookData.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">

                                        {/* Kolom Siswa & Tanggal */}
                                        <td className="px-3 py-4 align-top whitespace-nowrap">
                                            <div className="flex items-start space-x-3">
                                                <div className="h-9 w-9 flex items-center justify-center rounded-full bg-cyan-100 text-[#0097BB] shrink-0">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{entry.name}</p>
                                                    <p className="text-xs text-gray-500 mt-1"><Calendar className="inline h-3 w-3 mr-1" />{entry.date}</p>
                                                    {entry.photo && (
                                                        <p className="text-xs text-[#0097BB] mt-1 italic">
                                                            Ada foto
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Kolom Kegiatan & Kendala */}
                                        <td className="px-3 py-4 align-top text-sm">
                                            <p className="font-medium text-gray-800">
                                                <span className="font-bold text-gray-900">Kegiatan:</span> {entry.activity}
                                            </p>
                                            <p className="mt-2 text-gray-600">
                                                <span className="font-bold text-gray-900">Kendala:</span> {entry.constraint}
                                            </p>
                                        </td>

                                        {/* Kolom Status */}
                                        <td className="px-3 py-4 align-top whitespace-nowrap">
                                            <span
                                                className={`px-3 py-1 text-xs font-semibold rounded-lg border ${getStatusClasses(entry.status)}`}
                                            >
                                                {entry.status}
                                            </span>
                                        </td>

                                        {/* Kolom Catatan (Guru & DUDI) */}
                                        <td className="px-3 py-4 align-top text-sm text-gray-600">
                                            <div className="space-y-2">
                                                <p>
                                                    <span className="font-bold text-gray-900">Guru:</span> {entry.teacherNote || 'Belum ada catatan'}
                                                </p>
                                                {entry.dudiNote && (
                                                    <p>
                                                        <span className="font-bold text-gray-900">DUDI:</span> {entry.dudiNote}
                                                    </p>
                                                )}
                                            </div>
                                        </td>


                                        {/* Kolom Aksi (Titik Tiga) */}
                                        <td className="px-3 py-4 align-top whitespace-nowrap text-left text-sm font-medium">
                                            <button className="text-gray-400 hover:text-[#0097BB] transition-colors p-1 rounded-md">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Bagian Footer Pagination (Sederhana) */}
                        <div className="flex justify-between items-center pt-4 border-t mt-4 text-sm text-gray-600">
                            <span>Menampilkan 1 sampai {logbookData.length} dari {logbookData.length} entri</span>
                            <div className="flex space-x-1">
                                <button className="p-2 border rounded-lg hover:bg-gray-100"> &lt; </button>
                                <button className="p-2 border rounded-lg bg-[#0097BB] text-white"> 1 </button>
                                <button className="p-2 border rounded-lg hover:bg-gray-100"> 2 </button>
                                <button className="p-2 border rounded-lg hover:bg-gray-100"> &gt; </button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}