// hooks/useLogbook.ts
'use client';

import { useState, useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import api from '@/lib/axios';

// ============= TYPES =============
export interface Siswa {
  id: number;
  nama: string;
  nis: string;
  kelas: string;
  jurusan: string;
  email: string;
  telepon?: string;
}

export interface Dudi {
  id: number;
  nama_perusahaan: string;
  alamat?: string;
  telepon?: string;
  email?: string;
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
  siswa_list: Siswa[];
  dudi_list: Dudi[];
  timestamp: string;
  version: string;
}

interface CreateLogbookData {
  magang_id: number;
  tanggal: string;
  kegiatan: string;
  kendala: string;
  file?: File;
}

interface UpdateLogbookData {
  kegiatan?: string;
  kendala?: string;
  file?: File;
  remove_file?: boolean;
  status_verifikasi?: 'pending' | 'disetujui' | 'ditolak';
  catatan_guru?: string;
}

interface VerifikasiLogbookData {
  status_verifikasi: 'disetujui' | 'ditolak';
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

const fetcher = async (url: string) => {
  const response = await api.get(url);
  return response.data;
};

const defaultStats: LogbookStats = {
  total_logbook: 0,
  belum_diverifikasi: 0,
  disetujui: 0,
  ditolak: 0,
};

// ============= BATCH HOOK (MAIN HOOK) =============
export function useLogbookBatch(options?: {
  realTime?: boolean;
  pollingInterval?: number;
}) {
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  
  const realTime = options?.realTime ?? true;
  const pollingInterval = options?.pollingInterval ?? 3000;

  const { data, error, mutate, isLoading, isValidating } = useSWR<ApiResponse<BatchLogbookData>>(
    '/guru/logbook/batch',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      refreshInterval: realTime ? pollingInterval : 0,
      focusThrottleInterval: 10000,
      errorRetryCount: 1,
      errorRetryInterval: 3000,
      keepPreviousData: true,
      revalidateIfStale: false,
    }
  );

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const forceRefresh = useCallback(async () => {
    setDeletedIds(new Set());
    await mutate(undefined, { revalidate: true });
  }, [mutate]);

  const markAsDeleted = useCallback((id: number) => {
    setDeletedIds(prev => new Set([...prev, id]));
  }, []);

  const clearDeletedIds = useCallback(() => {
    setDeletedIds(new Set());
  }, []);

  const filteredLogbook = useCallback(() => {
    return (data?.data?.logbook_list || []).filter(
      (item: LogbookEntry) => !deletedIds.has(item.id)
    );
  }, [data?.data?.logbook_list, deletedIds]);

  return {
    stats: data?.data?.stats || defaultStats,
    logbook: filteredLogbook(),
    siswa: data?.data?.siswa_list || [],
    dudi: data?.data?.dudi_list || [],
    isLoading,
    isValidating,
    error,
    isCached: data?.cached || false,
    timestamp: data?.data?.timestamp || null,
    version: data?.data?.version || '1.0',
    refresh,
    forceRefresh,
    markAsDeleted,
    clearDeletedIds,
  };
}

// ============= MUTATIONS HOOK =============
export function useLogbookMutations() {
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const { mutate } = useSWRConfig();

  const handleError = useCallback((error: any): never => {
    if (error.response?.status === 422) {
      setValidationErrors(error.response.data.errors || {});
      throw new Error(error.response.data.message || 'Validasi gagal');
    }
    throw new Error(error.response?.data?.message || 'Terjadi kesalahan');
  }, []);

  const createLogbook = useCallback(async (data: CreateLogbookData): Promise<ApiResponse<LogbookEntry>> => {
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
      
      await mutate('/guru/logbook/batch');
      return response.data;
    } catch (error: any) {
      return handleError(error);
    } finally {
      setLoading(false);
    }
  }, [mutate, handleError]);

  const updateLogbook = useCallback(async (id: number, data: UpdateLogbookData): Promise<ApiResponse<LogbookEntry>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const formData = new FormData();
      
      if (data.kegiatan) formData.append('kegiatan', data.kegiatan);
      if (data.kendala) formData.append('kendala', data.kendala);
      if (data.file) formData.append('file', data.file);
      if (data.remove_file) formData.append('remove_file', '1');
      if (data.status_verifikasi) formData.append('status_verifikasi', data.status_verifikasi);
      if (data.catatan_guru) formData.append('catatan_guru', data.catatan_guru);

      const response = await api.post<ApiResponse<LogbookEntry>>(
        `/guru/logbook/update/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      await mutate('/guru/logbook/batch');
      return response.data;
    } catch (error: any) {
      return handleError(error);
    } finally {
      setLoading(false);
    }
  }, [mutate, handleError]);

  const verifikasiLogbook = useCallback(async (id: number, data: VerifikasiLogbookData): Promise<ApiResponse<LogbookEntry>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const response = await api.put<ApiResponse<LogbookEntry>>(
        `/logbook/${id}/verifikasi`,
        data
      );
      
      await mutate('/guru/logbook/batch');
      return response.data;
    } catch (error: any) {
      return handleError(error);
    } finally {
      setLoading(false);
    }
  }, [mutate, handleError]);

  const deleteLogbook = useCallback(async (id: number): Promise<ApiResponse<null>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const response = await api.delete<ApiResponse<null>>(`/guru/logbook/delete/${id}`);
      await mutate('/guru/logbook/batch');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Gagal menghapus logbook');
    } finally {
      setLoading(false);
    }
  }, [mutate]);

  const clearCache = useCallback(async (): Promise<ApiResponse<null>> => {
    try {
      const response = await api.post<ApiResponse<null>>('/guru/logbook/batch/clear-cache');
      await mutate('/guru/logbook/batch', undefined, { revalidate: true });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Gagal membersihkan cache');
    }
  }, [mutate]);

  return {
    createLogbook,
    updateLogbook,
    verifikasiLogbook,
    deleteLogbook,
    clearCache,
    loading,
    validationErrors,
    clearErrors: useCallback(() => setValidationErrors({}), []),
  };
}