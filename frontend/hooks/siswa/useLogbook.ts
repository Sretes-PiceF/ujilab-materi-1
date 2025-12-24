// hooks/siswa/useLogbook.ts
'use client';

import { useState, useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import api from '@/lib/axios';

// ============= TYPES =============
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
  file_url?: string | null;
  webp_image_url?: string | null;
  thumbnail_url?: string | null;
  status_verifikasi: 'pending' | 'disetujui' | 'ditolak';
  original_image?: string;
  webp_image?: string;
  webp_thumbnail?: string;
  original_size?: number;
  optimized_size?: number;
  catatan_guru: string | null;
  catatan_dudi: string | null;
  dudi: Dudi;
  created_at: string;
  updated_at: string;
}

interface BatchLogbookData {
  logbook_list: LogbookEntry[];
  dudi_list: Dudi[];
  magang_info: {
    status: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    dudi?: {
      id: number;
      nama_perusahaan: string;
    };
  };
  siswa_info?: {
    id: number;
    nama: string;
    nis: string;
    kelas: string;
    jurusan: string;
  };
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  timestamp: string;
  version: string;
}

interface CreateLogbookData {
  tanggal: string;
  kegiatan: string;
  kendala: string;
  file?: File;
}

interface UpdateLogbookData {
  tanggal?: string;
  kegiatan?: string;
  kendala?: string;
  file?: File;
  remove_file?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  cached?: boolean;
  cache_ttl?: number;
}

// Fetcher yang lebih robust
const fetcher = async (url: string) => {
  try {
    const response = await api.get(url);
    
    // Debug log
    console.log('API Response:', {
      url,
      status: response.status,
      data: response.data
    });
    
    // Jika backend mengembalikan success: false
    if (response.data?.success === false) {
      return {
        success: false,
        message: response.data.message || 'API Error',
        data: getDefaultData(),
        cached: false,
        cache_ttl: 0
      };
    }
    
    // Format sesuai dengan yang diharapkan hook
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message,
      cached: response.data.cached || false,
      cache_ttl: response.data.cache_ttl || 0
    };
  } catch (error: any) {
    console.error('Fetcher Error:', {
      url,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Jika error 404 atau siswa tidak ditemukan
    if (error.response?.status === 404 || 
        error.response?.data?.message?.includes('siswa') || 
        error.response?.data?.message?.includes('tidak ditemukan')) {
      return {
        success: false,
        message: error.response?.data?.message || 'Data siswa tidak ditemukan',
        data: getDefaultData(),
        cached: false,
        cache_ttl: 0
      };
    }
    
    // Untuk error 500 atau lainnya
    if (error.response?.status === 500) {
      return {
        success: false,
        message: 'Server error: ' + (error.response?.data?.message || 'Internal server error'),
        data: getDefaultData(),
        cached: false,
        cache_ttl: 0
      };
    }
    
    throw error;
  }
};

const getDefaultData = (): BatchLogbookData => ({
  logbook_list: [],
  dudi_list: [],
  magang_info: {
    status: 'tidak_aktif',
    tanggal_mulai: '',
    tanggal_selesai: '',
  },
  timestamp: new Date().toISOString(),
  version: '1.0'
});

// ============= BATCH HOOK (MAIN HOOK) =============
export function useLogbookBatch(options?: {
  realTime?: boolean;
  pollingInterval?: number;
}) {
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  
  const realTime = options?.realTime ?? true;
  const pollingInterval = options?.pollingInterval ?? 3000;

  const { data, error, mutate, isLoading, isValidating } = useSWR<ApiResponse<BatchLogbookData>>(
    '/siswa/logbook/batch',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      refreshInterval: realTime ? pollingInterval : 0,
      focusThrottleInterval: 10000,
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      keepPreviousData: true,
      revalidateIfStale: false,
      shouldRetryOnError: (err) => {
        // Jangan retry untuk error 404 (data tidak ditemukan)
        return err.response?.status !== 404;
      }
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

  // Filter logbook yang dihapus
  const filteredLogbook = useCallback(() => {
    if (!data?.data?.logbook_list) return [];
    
    return data.data.logbook_list.filter(
      (item: LogbookEntry) => !deletedIds.has(item.id)
    );
  }, [data?.data?.logbook_list, deletedIds]);

  // Tentukan apakah ada error dari API response
  const apiError = error || (data?.success === false ? new Error(data.message || 'API Error') : null);

  return {
    // HAPUS stats dan hanya ambil data yang diperlukan
    logbook: filteredLogbook(),
    dudi: data?.data?.dudi_list || [],
    magangInfo: data?.data?.magang_info || { 
      status: 'tidak_aktif', 
      tanggal_mulai: '', 
      tanggal_selesai: '' 
    },
    meta: data?.data?.meta, // Tambahkan meta untuk pagination
    isLoading,
    isValidating,
    error: apiError,
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
    
    // Handle error khusus untuk siswa tidak ditemukan
    if (error.response?.status === 404 || 
        error.response?.data?.message?.includes('siswa') ||
        error.response?.data?.message?.includes('tidak ditemukan')) {
      throw new Error('Data siswa tidak ditemukan. Silakan refresh halaman.');
    }
    
    throw new Error(error.response?.data?.message || 'Terjadi kesalahan');
  }, []);

  const createLogbook = useCallback(async (data: CreateLogbookData): Promise<ApiResponse<LogbookEntry>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const formData = new FormData();
      formData.append('tanggal', data.tanggal);
      formData.append('kegiatan', data.kegiatan);
      formData.append('kendala', data.kendala);
      if (data.file) {
        formData.append('file', data.file);
      }

      // Gunakan endpoint CRUD yang benar
      const response = await api.post<ApiResponse<LogbookEntry>>(
        '/siswa/logbook',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      await mutate('/siswa/logbook/batch');
      return response.data;
    } catch (error: any) {
      throw handleError(error);
    } finally {
      setLoading(false);
    }
  }, [mutate, handleError]);

  const updateLogbook = useCallback(async (id: number, data: UpdateLogbookData): Promise<ApiResponse<LogbookEntry>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const formData = new FormData();
      
      if (data.tanggal) formData.append('tanggal', data.tanggal);
      if (data.kegiatan) formData.append('kegiatan', data.kegiatan);
      if (data.kendala) formData.append('kendala', data.kendala);
      if (data.file) formData.append('file', data.file);
      if (data.remove_file) formData.append('remove_file', '1');

      const response = await api.post<ApiResponse<LogbookEntry>>(
        `/siswa/logbook/${id}?_method=PUT`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      await mutate('/siswa/logbook/batch');
      return response.data;
    } catch (error: any) {
      throw handleError(error);
    } finally {
      setLoading(false);
    }
  }, [mutate, handleError]);

  const deleteLogbook = useCallback(async (id: number): Promise<ApiResponse<null>> => {
    setLoading(true);
    setValidationErrors({});

    try {
      const response = await api.delete<ApiResponse<null>>(`/siswa/logbook/${id}`);
      await mutate('/siswa/logbook/batch');
      return response.data;
    } catch (error: any) {
      throw handleError(error);
    } finally {
      setLoading(false);
    }
  }, [mutate, handleError]);

  const clearCache = useCallback(async (): Promise<ApiResponse<null>> => {
    try {
      const response = await api.post<ApiResponse<null>>('/siswa/logbook/batch/clear-cache');
      await mutate('/siswa/logbook/batch', undefined, { revalidate: true });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Gagal membersihkan cache');
    }
  }, [mutate]);

  return {
    createLogbook,
    updateLogbook,
    deleteLogbook,
    clearCache,
    loading,
    validationErrors,
    clearErrors: useCallback(() => setValidationErrors({}), []),
  };
}