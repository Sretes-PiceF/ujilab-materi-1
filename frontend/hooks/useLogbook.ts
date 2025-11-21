// hooks/useLogbook.ts
import { useState, useEffect, useCallback } from 'react';

// Interface untuk data logbook
export interface LogbookEntry {
    id: number;
    magang_id: number;
    tanggal: string;
    tanggal_formatted: string;
    kegiatan: string;
    kendala: string;
    file: string | null;
    status_verifikasi: 'pending' | 'disetujui' | 'ditolak';
    catatan_guru: string | null;
    catatan_dudi: string | null;
    siswa: {
        id: number;
        nama: string;
        nis: string;
        kelas: string;
        jurusan: string;
        email: string;
    };
    dudi: {
        id: number;
        nama_perusahaan: string;
    };
    created_at: string;
    updated_at: string;
}

// Interface untuk meta pagination
export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export function useLogbook() {
    const [logbookList, setLogbookList] = useState<LogbookEntry[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: null,
        to: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Get token from localStorage
    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('access_token');
        }
        return null;
    };

    // Fetch daftar logbook
    const fetchLogbook = useCallback(async (params?: {
        page?: number;
        per_page?: number;
        search?: string;
        status?: string;
    }) => {
        try {
            setLoading(true);
            setError(null);

            const token = getToken();
            if (!token) {
                throw new Error('Token tidak ditemukan');
            }

            // Build query string
            const queryParams = new URLSearchParams();
            if (params?.page) queryParams.append('page', params.page.toString());
            if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
            if (params?.search) queryParams.append('search', params.search);
            if (params?.status && params.status !== 'all') queryParams.append('status', params.status);

            const response = await fetch(
                `${API_URL}/logbook`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setLogbookList(result.data);
                if (result.meta) {
                    setMeta(result.meta);
                }
            } else {
                throw new Error(result.message || 'Gagal mengambil data logbook');
            }
        } catch (err) {
            console.error('Error fetching logbook:', err);
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    // Fetch detail logbook
    const fetchLogbookDetail = useCallback(async (id: number) => {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('Token tidak ditemukan');
            }

            const response = await fetch(`${API_URL}/guru/logbook/${id}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                return { success: true, data: result.data };
            } else {
                throw new Error(result.message || 'Gagal mengambil detail logbook');
            }
        } catch (err) {
            console.error('Error fetching logbook detail:', err);
            return {
                success: false,
                message: err instanceof Error ? err.message : 'Terjadi kesalahan',
            };
        }
    }, [API_URL]);

    // Verifikasi logbook
    const verifikasiLogbook = useCallback(async (
        id: number,
        data: { status_verifikasi: string; catatan_guru?: string }
    ) => {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('Token tidak ditemukan');
            }

            const response = await fetch(`${API_URL}/guru/logbook/${id}/verifikasi`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                return { success: true, message: result.message };
            } else {
                throw new Error(result.message || 'Gagal memverifikasi logbook');
            }
        } catch (err) {
            console.error('Error verifying logbook:', err);
            return {
                success: false,
                message: err instanceof Error ? err.message : 'Terjadi kesalahan',
            };
        }
    }, [API_URL]);

    // Initial fetch
    useEffect(() => {
        fetchLogbook();
    }, [fetchLogbook]);

    return {
        logbookList,
        meta,
        loading,
        error,
        fetchLogbook,
        fetchLogbookDetail,
        verifikasiLogbook,
    };
}