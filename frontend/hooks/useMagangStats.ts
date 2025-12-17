'use client'

import useSWR from 'swr';
import api from '@/lib/axios';

interface MagangStats {
  total_siswa: number;
  aktif: number;
  selesai: number;
  pending: number;
}

const fetcher = (url: string) => api.get(url).then(res => res.data);

/**
 * Hook untuk mendapatkan statistik magang
 * Mapping dari: MagangGuruController@getAllMagang
 */
export function useMagangStats() {
  const { data, error, mutate, isLoading } = useSWR<{
    success: boolean;
    data: MagangStats;
  }>('/guru/magang', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000, // Cache 10 detik
  });

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