'use client'

import { useState } from 'react';
import useSWR from 'swr';
import api from '@/lib/axios';

// ============= TYPES =============
interface Siswa {
  id: string;
  user_id: string;
  nama: string;
  nis: string;
  kelas: string;
  jurusan: string;
  telepon: string;
  alamat: string;
  email?: string;
}

interface Dudi {
  id: string;
  nama_perusahaan: string;
  alamat: string;
  telepon: string;
  email: string;
  status: 'aktif' | 'nonaktif';
}

interface Guru {
  id: string;
  nama: string;
  nip: string;
}

interface Magang {
  id: string;
  siswa_id: string;
  dudi_id: string;
  guru_id: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: 'pending' | 'diterima' | 'ditolak' | 'berlangsung' | 'selesai' | 'dibatalkan';
  nilai_akhir?: number | null;
  verification_token?: string;
  created_at: string;
  updated_at: string;
  siswa?: Siswa;
  dudi?: Dudi;
  guru?: Guru;
}

interface MagangStats {
  total_siswa: number;
  aktif: number;
  selesai: number;
  pending: number;
}

interface BatchMagangData {
  stats: MagangStats;
  magang_list: Magang[];
  siswa_list: Siswa[];
  timestamp: string;
}

interface CreateMagangData {
  siswa_id: string;
  dudi_id: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
  nilai_akhir?: number;
}

interface UpdateMagangData extends CreateMagangData {
  catatan?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  cached?: boolean;
  cache_ttl?: number;
}

// ============= FETCHER =============
const fetcher = (url: string) => api.get(url).then(res => res.data);

// ============= BATCH HOOK (MAIN HOOK) =============
/**
 * Hook utama untuk fetch SEMUA data magang dalam 1 request
 * Menggantikan 3 requests (stats + list + siswa) jadi 1
 */
export function useMagangBatch() {
  const { data, error, mutate, isLoading } = useSWR<ApiResponse<BatchMagangData>>(
    '/magang/batch',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // Cache 5 detik
      revalidateOnMount: true,
    }
  );

  return {
    // Stats
    stats: data?.data?.stats || {
      total_siswa: 0,
      aktif: 0,
      selesai: 0,
      pending: 0,
    },
    
    // Magang List
    magang: data?.data?.magang_list || [],
    
    // Siswa List
    siswa: data?.data?.siswa_list || [],
    
    // Meta
    isLoading,
    error,
    isCached: data?.cached || false,
    timestamp: data?.data?.timestamp || null,
    
    // Actions
    refresh: mutate,
  };
}

// ============= INDIVIDUAL HOOKS (Fallback) =============
/**
 * Hook untuk fetch magang list saja
 * Gunakan ini kalau tidak butuh stats & siswa
 */
export function useMagang() {
  const { data, error, mutate, isLoading } = useSWR<ApiResponse<Magang[]>>(
    '/guru/magang/list',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    magang: data?.data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook untuk fetch stats saja
 */
export function useMagangStats() {
  const { data, error, mutate, isLoading } = useSWR<ApiResponse<MagangStats>>(
    '/guru/magang',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  return {
    stats: data?.data || {
      total_siswa: 0,
      aktif: 0,
      selesai: 0,
      pending: 0,
    },
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook untuk fetch siswa list saja
 */
export function useSiswaList() {
  const { data, error, isLoading } = useSWR<ApiResponse<Siswa[]>>(
    '/guru/siswa/list',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    siswa: data?.data || [],
    isLoading,
    error,
  };
}

// ============= MUTATIONS HOOK =============
/**
 * Hook untuk CRUD operations
 */
export function useMagangMutations() {
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const createMagang = async (data: CreateMagangData): Promise<ApiResponse<Magang>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const response = await api.post<ApiResponse<Magang>>('/guru/magang/create', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 422) {
        setValidationErrors(error.response.data.errors || {});
        throw new Error(error.response.data.message || 'Validasi gagal');
      }
      throw new Error(error.response?.data?.message || 'Gagal membuat data magang');
    } finally {
      setLoading(false);
    }
  };

  const updateMagang = async (id: string, data: UpdateMagangData): Promise<ApiResponse<Magang>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const response = await api.patch<ApiResponse<Magang>>(`/guru/magang/update/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 422) {
        setValidationErrors(error.response.data.errors || {});
        throw new Error(error.response.data.message || 'Validasi gagal');
      }
      throw new Error(error.response?.data?.message || 'Gagal mengupdate data magang');
    } finally {
      setLoading(false);
    }
  };

  const deleteMagang = async (id: string): Promise<ApiResponse<null>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const response = await api.delete<ApiResponse<null>>(`/guru/magang/delete/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Gagal menghapus data magang');
    } finally {
      setLoading(false);
    }
  };

  return {
    createMagang,
    updateMagang,
    deleteMagang,
    loading,
    validationErrors,
    clearErrors: () => setValidationErrors({}),
  };
}