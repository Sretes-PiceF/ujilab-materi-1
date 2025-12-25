// hooks/siswa/useDudi.ts
'use client';

import { useState, useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import api from '@/lib/axios';

// ============= TYPES =============
export interface DudiData {
  id: number;
  nama_perusahaan: string;
  alamat: string;
  telepon: string;
  email: string;
  penanggung_jawab: string;
  status_dudi: string;
  bidang_usaha: string;
  deskripsi: string;
  kuota: {
    terisi: number;
    total: number;
    tersisa: number;
  };
  fasilitas: string[];
  persyaratan: string[];
  sudah_daftar: boolean;
}

interface DudiBatchData {
  dudi_aktif: DudiData[];
  bisa_daftar: boolean;
  jumlah_pendaftaran: number;
  maksimal_pendaftaran: number;
  sudah_punya_magang_aktif: boolean;
  magang_aktif: any;
  sudah_pernah_magang: boolean;
  magang_selesai: any;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: {
    dudi_aktif: T;
  };
  cached?: boolean;
  cache_ttl?: number;
}

// Fetcher untuk SWR
const fetcher = async (url: string) => {
  try {
    const response = await api.get(url);
    
    console.log('DUDI API Response:', {
      url,
      status: response.status,
      data: response.data
    });
    
    if (response.data?.success === false) {
      return {
        success: false,
        message: response.data.message || 'API Error',
        data: getDefaultData(),
        cached: false,
        cache_ttl: 0
      };
    }
    
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message,
      cached: response.data.cached || false,
      cache_ttl: response.data.cache_ttl || 0
    };
  } catch (error: any) {
    console.error('DUDI Fetcher Error:', {
      url,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 404) {
      return {
        success: false,
        message: error.response?.data?.message || 'Data tidak ditemukan',
        data: getDefaultData(),
        cached: false,
        cache_ttl: 0
      };
    }
    
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

const getDefaultData = (): DudiBatchData => ({
  dudi_aktif: [],
  bisa_daftar: true,
  jumlah_pendaftaran: 0,
  maksimal_pendaftaran: 3,
  sudah_punya_magang_aktif: false,
  magang_aktif: null,
  sudah_pernah_magang: false,
  magang_selesai: null
});

// ============= BATCH HOOK (MAIN HOOK) =============
export function useDudiBatch(options?: {
  realTime?: boolean;
  pollingInterval?: number;
}) {
  const realTime = options?.realTime ?? true;
  const pollingInterval = options?.pollingInterval ?? 15000; // 15 detik untuk DUDI

  const { data, error, mutate, isLoading, isValidating } = useSWR<ApiResponse<DudiBatchData>>(
    '/siswa/dudi/batch',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: realTime ? pollingInterval : 0,
      focusThrottleInterval: 10000,
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      keepPreviousData: true,
      revalidateIfStale: false,
      shouldRetryOnError: (err) => {
        return err.response?.status !== 404;
      }
    }
  );

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const forceRefresh = useCallback(async () => {
    // Gunakan endpoint fresh untuk bypass cache
    try {
      const response = await api.get('/siswa/dudi/batch/fresh');
      await mutate(response.data, { revalidate: false });
    } catch (error) {
      console.error('Force refresh error:', error);
      await mutate(undefined, { revalidate: true });
    }
  }, [mutate]);

  const apiError = error || (data?.success === false ? new Error(data.message || 'API Error') : null);

  // Extract data yang diperlukan
  const batchData = data?.data?.dudi_aktif || getDefaultData();

  return {
    dudiList: batchData.dudi_aktif || [],
    bisaDaftar: batchData.bisa_daftar ?? true,
    jumlahPendaftaran: batchData.jumlah_pendaftaran || 0,
    maksimalPendaftaran: batchData.maksimal_pendaftaran || 3,
    sudahPunyaMagangAktif: batchData.sudah_punya_magang_aktif || false,
    magangAktif: batchData.magang_aktif || null,
    sudahPernahMagang: batchData.sudah_pernah_magang || false,
    magangSelesai: batchData.magang_selesai || null,
    isLoading,
    isValidating,
    error: apiError,
    isCached: data?.cached || false,
    cacheTTL: data?.cache_ttl || 0,
    refresh,
    forceRefresh,
  };
}

// ============= MUTATIONS HOOK =============
export function useDudiMutations() {
  const [loading, setLoading] = useState(false);
  const { mutate } = useSWRConfig();

  const handleError = useCallback((error: any): never => {
    if (error.response?.status === 422) {
      throw new Error(error.response.data.message || 'Validasi gagal');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Data tidak ditemukan');
    }
    
    throw new Error(error.response?.data?.message || 'Terjadi kesalahan');
  }, []);

  const daftarDudi = useCallback(async (dudiId: number): Promise<{success: boolean; message: string}> => {
    setLoading(true);

    try {
      const response = await api.post(`/siswa/dudi/${dudiId}/daftar`, {
        dudi_id: dudiId
      });
      
      // Revalidate cache setelah daftar
      await mutate('/siswa/dudi/batch');
      
      return {
        success: response.data.success,
        message: response.data.message || 'Berhasil mendaftar'
      };
    } catch (error: any) {
      throw handleError(error);
    } finally {
      setLoading(false);
    }
  }, [mutate, handleError]);

  const clearCache = useCallback(async (): Promise<{success: boolean; message: string}> => {
    try {
      const response = await api.post('/siswa/dudi/batch/clear-cache');
      await mutate('/siswa/dudi/batch', undefined, { revalidate: true });
      return {
        success: true,
        message: response.data.message || 'Cache berhasil dibersihkan'
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Gagal membersihkan cache');
    }
  }, [mutate]);

  return {
    daftarDudi,
    clearCache,
    loading,
  };
}