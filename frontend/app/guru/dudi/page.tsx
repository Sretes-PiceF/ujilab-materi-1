'use client';

import { CardStats } from "@/components/ui/CardStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DudiTable } from "@/components/layout/guru/DudiTable";
import { TambahDudiModal } from "@/components/layout/guru/create/TambahDudiModal";
import { User, Building2, Plus, Building } from "lucide-react";
import { useState, useEffect } from "react";
import { DudiDashboardData } from "@/types/dashboard";
import { useAuth } from "@/hooks/useAuth";

export default function DudiPage() {
    useAuth();

    const [statsData, setStatsData] = useState<DudiDashboardData>({
        dudi_aktif: 0,
        siswa_magang_aktif: 0,
        rata_rata_siswa_perusahaan: 0
    });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchDudiStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/guru/dudi`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            console.log('Raw response:', text);

            if (text) {
                const result = JSON.parse(text);

                if (result.success) {
                    setStatsData(result.data);
                } else {
                    console.error('API returned error:', result.message);
                }
            }

        } catch (error) {
            console.error('Error fetching DUDI stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDudiStats();
    }, []);

    const handleSuccessAdd = () => {
        // Refresh data setelah berhasil menambah DUDI
        fetchDudiStats();
    };

    return (
        <div className="p-8">
            {/* Header Halaman */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">DUDI</h1>
                <p className="text-gray-600 mt-1">
                    Kelola data industri dan perusahaan mitra magang siswa <span className="font-semibold">SIMNAS</span>
                </p>
            </div>

            {/* GRID CARDS STATS */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
                <CardStats
                    title="Total DUDI"
                    value={loading ? "..." : statsData.dudi_aktif}
                    description="Total perusahaan terdaftar"
                    icon={Building2}
                />

                <CardStats
                    title="Total Siswa Magang"
                    value={loading ? "..." : statsData.siswa_magang_aktif}
                    description="Seluruh siswa terdaftar"
                    icon={User}
                />

                <CardStats
                    title="Rata - Rata Siswa"
                    value={loading ? "..." : statsData.rata_rata_siswa_perusahaan}
                    description="Per perusahaan"
                    icon={Building}
                />
            </div>

            {/* CARD TABEL DUDI */}
            <Card className="shadow-sm rounded-lg border-0">
                <CardHeader className="py-4 px-6 border-b border-gray-200">
                    <div className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                            <Building2 className="h-5 w-5 mr-2 text-cyan-600" />
                            Daftar DUDI
                        </CardTitle>

                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#0097BB] hover:bg-[#007b9e] text-white rounded-lg px-4 py-2"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah DUDI
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <DudiTable />
                </CardContent>
            </Card>

            {/* Modal Tambah DUDI */}
            <TambahDudiModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={handleSuccessAdd}
            />
        </div>
    );
}