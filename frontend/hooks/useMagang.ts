'use client'

import { useState, useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import api from '@/lib/axios';

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
  version: string;
}

interface CreateMagangData {
  siswa_id: string;
  dudi_id: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  status: string;
  nilai_akhir?: number;
  catatan?: string;
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

const fetcher = async (url: string) => {
  const response = await api.get(url);
  return response.data;
};

const defaultStats: MagangStats = {
  total_siswa: 0,
  aktif: 0,
  selesai: 0,
  pending: 0,
};

export function useMagangBatch(options?: {
  realTime?: boolean;
  pollingInterval?: number;
}) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  
  const realTime = options?.realTime ?? true;
  const pollingInterval = options?.pollingInterval ?? 3000;

  const { data, error, mutate, isLoading, isValidating } = useSWR<ApiResponse<BatchMagangData>>(
    '/magang/batch',
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

  const markAsDeleted = useCallback((id: string) => {
    setDeletedIds(prev => new Set([...prev, id]));
  }, []);

  const clearDeletedIds = useCallback(() => {
    setDeletedIds(new Set());
  }, []);

  const filteredMagang = useCallback(() => {
    return (data?.data?.magang_list || []).filter(
      (item: Magang) => !deletedIds.has(item.id)
    );
  }, [data?.data?.magang_list, deletedIds]);

  return {
    stats: data?.data?.stats || defaultStats,
    magang: filteredMagang(),
    siswa: data?.data?.siswa_list || [],
    isLoading,
    isValidating,
    error,
    isCached: data?.cached || false,
    timestamp: data?.data?.timestamp || null,
    refresh,
    forceRefresh,
    markAsDeleted,
    clearDeletedIds,
  };
}

export function useMagangMutations() {
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

  const createMagang = useCallback(async (data: CreateMagangData): Promise<ApiResponse<Magang>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const response = await api.post<ApiResponse<Magang>>('/guru/magang/create', data);
      await mutate('/magang/batch');
      return response.data;
    } catch (error: any) {
      return handleError(error);
    } finally {
      setLoading(false);
    }
  }, [mutate, handleError]);

  const updateMagang = useCallback(async (id: string, data: UpdateMagangData): Promise<ApiResponse<Magang>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const response = await api.patch<ApiResponse<Magang>>(`/guru/magang/update/${id}`, data);
      await mutate('/magang/batch');
      return response.data;
    } catch (error: any) {
      return handleError(error);
    } finally {
      setLoading(false);
    }
  }, [mutate, handleError]);

  const deleteMagang = useCallback(async (id: string): Promise<ApiResponse<null>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const response = await api.delete<ApiResponse<null>>(`/guru/magang/delete/${id}`);
      await mutate('/magang/batch');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Gagal menghapus data magang');
    } finally {
      setLoading(false);
    }
  }, [mutate]);

  const clearCache = useCallback(async (): Promise<ApiResponse<null>> => {
    try {
      const response = await api.post<ApiResponse<null>>('/magang/batch/clear-cache');
      await mutate('/magang/batch', undefined, { revalidate: true });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Gagal membersihkan cache');
    }
  }, [mutate]);

  return {
    createMagang,
    updateMagang,
    deleteMagang,
    clearCache,
    loading,
    validationErrors,
    clearErrors: useCallback(() => setValidationErrors({}), []),
  };
}