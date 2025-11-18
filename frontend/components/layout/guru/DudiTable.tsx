// components/layout/guru/DudiTable.tsx
import { MapPin, Mail, Trash2, Building2, SquarePen, CircleUserRound, Phone, Search } from "lucide-react";

// *** IMPOR KOMPONEN SHADCN/UI YANG DIBUTUHKAN ***
// Asumsi Anda menggunakan Input dan Select/Dropdown Shadcn/UI (atau Anda bisa membuatnya sendiri)
// import { Input } from "@/components/ui/input"; 
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
// Jika Anda tidak menggunakan Shadcn/UI, kita akan membuat komponen minimal di bawah.

// Tipe data untuk entri DUDI (tetap sama)
interface DudiEntry {
    id: number;
    company: string;
    address: string;
    contactEmail: string;
    contactPhone: string;
    responsiblePerson: string;
    studentCount: number;
}

const dummyData: DudiEntry[] = [
    { id: 1, company: "PT Kreatif Teknologi", address: "Jl. Merdeka No. 123, Jakarta", contactEmail: "info@kreatiftek.com", contactPhone: "021-12345678", responsiblePerson: "Andi Wijaya", studentCount: 8 },
    { id: 2, company: "CV Digital Solusi", address: "Jl. Sudirman No. 45, Surabaya", contactEmail: "contact@digitalsolusi.com", contactPhone: "031-87654321", responsiblePerson: "Sari Dewi", studentCount: 8 },
    { id: 3, company: "PT Inovasi Mandiri", address: "Jl. Diponegoro No. 78, Surabaya", contactEmail: "hr@inovasimandiri.co.id", contactPhone: "031-5553456", responsiblePerson: "Budi Santoso", studentCount: 12 },
    { id: 4, company: "PT Teknologi Maju", address: "Jl. HR Rasuna Said No. 12, Jakarta", contactEmail: "info@tekmaju.com", contactPhone: "021-33445566", responsiblePerson: "Lisa Permata", studentCount: 6 },
    { id: 5, company: "CV Solusi Digital Prima", address: "Jl. Gatot Subroto No. 88, Bandung", contactEmail: "contact@sdprima.com", contactPhone: "022-7788990", responsiblePerson: "Rahmat Hidayat", studentCount: 9 },
];

// --- FUNGSI DUDI TABLE DENGAN SEARCH DAN DROPDOWN ---
export function DudiTable() {
    return (
        <div className="overflow-x-auto">

            {/* BARIS PENCARIAN & FILTER (sesuai image_60c00e.png) */}
            <div className="flex justify-between items-center mb-6">

                {/* Search Input */}
                <div className="relative w-full max-w-sm mr-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari perusahaan, alamat, penanggung"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0097BB] focus:border-transparent transition-colors shadow-sm"
                    />
                </div>

                {/* Dropdown Tampilkan Entri */}
                <div className="flex items-center text-sm text-gray-600">
                    <label htmlFor="show-entries" className="mr-2 whitespace-nowrap">Tampilkan:</label>
                    <select
                        id="show-entries"
                        className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0097BB] focus:border-[#0097BB] appearance-none bg-white transition-colors"
                        defaultValue={5}
                    >
                        {/* Contoh Pilihan Entri */}
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                    <span className="ml-2 whitespace-nowrap">entri</span>
                </div>
            </div>


            {/* TABLE START */}
            <table className="min-w-full divide-y divide-gray-200">

                {/* HEAD TABLE (Tetap Sama) */}
                <thead className="bg-white">
                    <tr>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/5">Perusahaan</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/5">Kontak</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/5">Penanggung Jawab</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-auto">Siswa Magang</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Aksi</th>
                    </tr>
                </thead>

                {/* BODY TABLE (Tetap Sama) */}
                <tbody className="bg-white divide-y divide-gray-100">
                    {dummyData.map((dudi) => (
                        <tr key={dudi.id} className="hover:bg-gray-50 transition-colors">
                            {/* Kolom Perusahaan */}
                            <td className="px-3 py-4 whitespace-nowrap">
                                <div className="flex items-start space-x-3">
                                    <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-cyan-100 text-[#0097BB] shrink-0 mt-1">
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{dudi.company}</p>
                                        <div className="flex items-center text-sm text-gray-600 mt-1">
                                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                            <span className="truncate">{dudi.address}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>

                            {/* Kolom Kontak */}
                            <td className="px-3 py-4 whitespace-nowrap">
                                <div className="space-y-1">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Mail className="h-3 w-3 mr-2 text-gray-400" />
                                        <span className="truncate">{dudi.contactEmail}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                        <span className="truncate">{dudi.contactPhone}</span>
                                    </div>
                                </div>
                            </td>

                            {/* Kolom Penanggung Jawab */}
                            <td className="px-3 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-600">
                                    <CircleUserRound className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="font-medium text-gray-700">{dudi.responsiblePerson}</span>
                                </div>
                            </td>

                            {/* Kolom Siswa Magang */}
                            <td className="px-3 py-4 whitespace-nowrap">
                                <span
                                    className={`px-3 py-1 text-xs font-semibold rounded-full 
                                               ${dudi.studentCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'}`}
                                >
                                    {dudi.studentCount}
                                </span>
                            </td>

                            {/* Kolom Aksi */}
                            <td className="px-3 py-4 whitespace-nowrap text-left text-sm font-medium">
                                <div className="flex space-x-2">
                                    <button className="text-gray-400 hover:text-[#0097BB] transition-colors p-1 rounded-md">
                                        <SquarePen className="h-4 w-4" />
                                    </button>
                                    <button className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Bagian Footer Pagination (Tetap Sama) */}
            <div className="flex justify-between items-center pt-4 border-t mt-4 text-sm text-gray-600">
                <span>Menampilkan 1 sampai {dummyData.length} dari 6 entri</span>
                <div className="flex space-x-1">
                    <button className="p-2 border rounded-lg hover:bg-gray-100"> &lt; </button>
                    <button className="p-2 border rounded-lg bg-[#0097BB] text-white"> 1 </button>
                    <button className="p-2 border rounded-lg hover:bg-gray-100"> 2 </button>
                    <button className="p-2 border rounded-lg hover:bg-gray-100"> &gt; </button>
                </div>
            </div>
        </div>
    );
}