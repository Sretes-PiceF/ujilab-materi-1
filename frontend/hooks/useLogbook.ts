'use client';

import { useState } from 'react';
import useSWR from 'swr';
import api from '@/lib/axios';

// ============= TYPES =============
export interface Siswa {
  id: number;
  nama: string;
  nis: string;
  kelas: string;
  jurusan: string;
  email: string;
}

export interface Dudi {
  id: number;
  nama_perusahaan: string;
}

export interface LogbookEntry {
  id: number;
  magang_id: number;
  tanggal: string;
  tanggal_formatted: string;
  kegiatan: string;
  kendala: string;
  file: string | null;
  status_verifikasi: 'pending' | 'disetujui' | 'ditolak';
  original_image?: string;
  webp_image?: string;
  webp_thumbnail?: string;
  original_size?: number;
  optimized_size?: number;
  catatan_guru: string | null;
  catatan_dudi: string | null;
  siswa: Siswa;
  dudi: Dudi;
  created_at: string;
  updated_at: string;
}

export interface LogbookStats {
  total_logbook: number;
  belum_diverifikasi: number;
  disetujui: number;
  ditolak: number;
}

interface BatchLogbookData {
  stats: LogbookStats;
  logbook_list: LogbookEntry[];
  timestamp: string;
}

interface CreateLogbookData {
  magang_id: number;
  tanggal: string;
  kegiatan: string;
  kendala: string;
  file?: File;
}

interface UpdateLogbookData {
  kegiatan: string;
  kendala: string;
  file?: File;
  remove_file?: boolean;
  status_verifikasi?: string;
  catatan_guru?: string;
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
 * Hook utama untuk fetch SEMUA data logbook dalam 1 request
 * Menggantikan multiple requests jadi 1
 */
export function useLogbookBatch() {
  const { data, error, mutate, isLoading } = useSWR<ApiResponse<BatchLogbookData>>(
    '/guru/logbook/batch',
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
      total_logbook: 0,
      belum_diverifikasi: 0,
      disetujui: 0,
      ditolak: 0,
    },
    
    // Logbook List
    logbook: data?.data?.logbook_list || [],
    
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
 * Hook untuk fetch logbook list saja
 * Gunakan ini kalau tidak butuh stats
 */
export function useLogbook() {
  const { data, error, mutate, isLoading } = useSWR<ApiResponse<LogbookEntry[]>>(
    '/guru/logbook',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    logbook: data?.data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook untuk fetch stats saja
 */
export function useLogbookStats() {
  const { data, error, mutate, isLoading } = useSWR<ApiResponse<LogbookStats>>(
    '/logbook',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  return {
    stats: data?.data || {
      total_logbook: 0,
      belum_diverifikasi: 0,
      disetujui: 0,
      ditolak: 0,
    },
    isLoading,
    error,
    refresh: mutate,
  };
}

// ============= MUTATIONS HOOK =============
/**
 * Hook untuk CRUD operations
 */
export function useLogbookMutations() {
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const createLogbook = async (data: CreateLogbookData): Promise<ApiResponse<LogbookEntry>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const formData = new FormData();
      formData.append('magang_id', data.magang_id.toString());
      formData.append('tanggal', data.tanggal);
      formData.append('kegiatan', data.kegiatan);
      formData.append('kendala', data.kendala);
      if (data.file) {
        formData.append('file', data.file);
      }

      const response = await api.post<ApiResponse<LogbookEntry>>(
        '/guru/logbook/create',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 422) {
        setValidationErrors(error.response.data.errors || {});
        throw new Error(error.response.data.message || 'Validasi gagal');
      }
      throw new Error(error.response?.data?.message || 'Gagal membuat logbook');
    } finally {
      setLoading(false);
    }
  };

  const updateLogbook = async (id: number, data: UpdateLogbookData): Promise<ApiResponse<LogbookEntry>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const formData = new FormData();
      formData.append('kegiatan', data.kegiatan);
      formData.append('kendala', data.kendala);
      
      if (data.file) {
        formData.append('file', data.file);
      }
      
      if (data.remove_file) {
        formData.append('remove_file', '1');
      }
      
      if (data.status_verifikasi) {
        formData.append('status_verifikasi', data.status_verifikasi);
      }
      
      if (data.catatan_guru) {
        formData.append('catatan_guru', data.catatan_guru);
      }

      const response = await api.post<ApiResponse<LogbookEntry>>(
        `/logbook/update/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 422) {
        setValidationErrors(error.response.data.errors || {});
        throw new Error(error.response.data.message || 'Validasi gagal');
      }
      throw new Error(error.response?.data?.message || 'Gagal mengupdate logbook');
    } finally {
      setLoading(false);
    }
  };

  const deleteLogbook = async (id: number): Promise<ApiResponse<null>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const response = await api.delete<ApiResponse<null>>(`/logbook/delete/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Gagal menghapus logbook');
    } finally {
      setLoading(false);
    }
  };

  const verifikasiLogbook = async (
    id: number,
    data: { status_verifikasi: string; catatan_guru?: string }
  ): Promise<ApiResponse<LogbookEntry>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const response = await api.put<ApiResponse<LogbookEntry>>(
        `/logbook/${id}/verifikasi`,
        data
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 422) {
        setValidationErrors(error.response.data.errors || {});
        throw new Error(error.response.data.message || 'Validasi gagal');
      }
      throw new Error(error.response?.data?.message || 'Gagal memverifikasi logbook');
    } finally {
      setLoading(false);
    }
  };

  return {
    createLogbook,
    updateLogbook,
    deleteLogbook,
    verifikasiLogbook,
    loading,
    validationErrors,
    clearErrors: () => setValidationErrors({}),
  };
}