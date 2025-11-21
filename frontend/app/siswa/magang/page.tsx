'use client'
import { useAuth } from "@/hooks/useAuth";
import { Building2, Calendar, CheckCircle, Star, User, MapPin } from "lucide-react";

export default function MagangPage() {
    useAuth();
    // Data dummy siswa & magang
    const studentData = {
        name: "Ahmad Rizki",
        nis: "2024001",
        class: "XII RPL 1",
        major: "Rekayasa Perangkat Lunak",
        company: "PT Kreatif Teknologi",
        address: "Jakarta",
        period: "1 Feb 2024 s.d 1 Mei 2024",
        status: "Aktif", // Aktif / Selesai / Ditolak
        finalGrade: "88"
    };

    return (
        <div className="flex m-screen bg-gray-40">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Page Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {/* Header */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Status Magang Saya</h1>
                    <p className="text-gray-600 mb-6">
                        Lihat informasi detail tempat dan status magang Anda
                    </p>

                    {/* Data Magang Card */}
                    <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
                        <div className="flex items-center gap-2 mb-6">
                            <User className="h-5 w-5 text-blue-500" />
                            <h2 className="text-lg font-semibold text-gray-900">Data Magang</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Kolom Kiri */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <User className="h-4 w-4 text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Nama Siswa</p>
                                        <p className="text-sm font-semibold text-gray-900">{studentData.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Building2 className="h-4 w-4 text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Kelas</p>
                                        <p className="text-sm font-semibold text-gray-900">{studentData.class}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Building2 className="h-4 w-4 text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Nama Perusahaan</p>
                                        <p className="text-sm font-semibold text-gray-900">{studentData.company}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="h-4 w-4 text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Periode Magang</p>
                                        <p className="text-sm font-semibold text-gray-900">{studentData.period}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Star className="h-4 w-4 text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Nilai Akhir</p>
                                        <p className="text-sm font-semibold text-gray-900">{studentData.finalGrade}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Kolom Kanan */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <User className="h-4 w-4 text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">NIS</p>
                                        <p className="text-sm font-semibold text-gray-900">{studentData.nis}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Building2 className="h-4 w-4 text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Jurusan</p>
                                        <p className="text-sm font-semibold text-gray-900">{studentData.major}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Alamat Perusahaan</p>
                                        <p className="text-sm font-semibold text-gray-900">{studentData.address}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-4 w-4 text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Status</p>
                                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${studentData.status === "Aktif"
                                            ? "bg-green-100 text-green-800"
                                            : studentData.status === "Selesai"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-red-100 text-red-800"
                                            }`}>
                                            {studentData.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}