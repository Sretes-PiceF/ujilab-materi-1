'use client';

import { useEffect, useState } from "react";

// Types untuk Magang
export interface Magang {
  id: number;
  siswa_id: number;
  dudi_id: number;
  guru_id: number;
  status: 'pending' | 'diterima' | 'ditolak' | 'berlangsung' | 'selesai' | 'dibatalkan';
  nilai_akhir?: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  created_at: string;
  updated_at: string;
  siswa?: {
    id: number;
    nama: string;
    nis: string;
    kelas: string;
    jurusan: string;
    telepon: string;
    alamat: string;
  };
  dudi?: {
    id: number;
    nama_perusahaan: string;
    alamat: string;
    telepon: string;
    penanggung_jawab: string;
  };
  guru?: {
    id: number;
    nama: string;
    nip: string;
  };
}

export interface MagangFormData {
  siswa_id: number;
  dudi_id: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: 'pending' | 'diterima' | 'ditolak' | 'berlangsung' | 'selesai' | 'dibatalkan';
  nilai_akhir?: number;
}

export interface Siswa {
  id: number;
  nama: string;
  nis: string;
  kelas: string;
  jurusan: string;
  telepon: string;
  alamat: string;
  email: string;
}

export interface Dudi {
  id: number;
  nama_perusahaan: string;
  alamat: string;
  telepon: string;
  penanggung_jawab: string;
}

export const useMagang = () => {
  const [magangList, setMagangList] = useState<Magang[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [dudiList, setDudiList] = useState<Dudi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  // GET ALL MAGANG LIST
  const fetchMagang = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/guru/magang/list`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setMagangList(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch magang data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching magang:', err);
    } finally {
      setLoading(false);
    }
  };

  // GET MAGANG BY ID
  const fetchMagangById = async (id: number): Promise<Magang | null> => {
    try {
      const response = await fetch(`${API_URL}/guru/magang/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch magang data');
      }
    } catch (err) {
      console.error('Error fetching magang by ID:', err);
      return null;
    }
  };

  // CREATE MAGANG
  const createMagang = async (formData: MagangFormData): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/guru/magang/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchMagang(); // Refresh list
        return { success: true, message: result.message || 'Magang berhasil dibuat' };
      } else {
        throw new Error(result.message || 'Failed to create magang');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(errorMessage);
      console.error('Error creating magang:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // UPDATE MAGANG
  const updateMagang = async (id: number, formData: MagangFormData): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/guru/magang/update/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchMagang(); // Refresh list
        return { success: true, message: result.message || 'Magang berhasil diupdate' };
      } else {
        throw new Error(result.message || 'Failed to update magang');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(errorMessage);
      console.error('Error updating magang:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // DELETE MAGANG
  const deleteMagang = async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/guru/magang/delete/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (result.success) {
        await fetchMagang(); // Refresh list
        return { success: true, message: result.message || 'Magang berhasil dihapus' };
      } else {
        throw new Error(result.message || 'Failed to delete magang');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(errorMessage);
      console.error('Error deleting magang:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // GET SISWA LIST (untuk dropdown)
  const fetchSiswaList = async (): Promise<Siswa[]> => {
    try {
      const response = await fetch(`${API_URL}/guru/siswa/list`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSiswaList(result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch siswa data');
      }
    } catch (err) {
      console.error('Error fetching siswa list:', err);
      return [];
    }
  };

  // GET DUDI AKTIF LIST (untuk dropdown)
  const fetchDudiAktif = async (): Promise<Dudi[]> => {
    try {
      const response = await fetch(`${API_URL}/guru/dudi/list`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setDudiList(result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch DUDI data');
      }
    } catch (err) {
      console.error('Error fetching DUDI list:', err);
      return [];
    }
  };


  // Refresh semua data
  const refreshAll = async () => {
    await Promise.all([
      fetchMagang(),
      fetchSiswaList(),
      fetchDudiAktif()
    ]);
  };

  useEffect(() => {
    fetchMagang();
    fetchSiswaList();
    fetchDudiAktif();
  }, []);

  return {
    // State
    magangList,
    siswaList,
    dudiList,
    loading,
    error,
    
    // Actions
    fetchMagang,
    fetchMagangById,
    createMagang,
    updateMagang,
    deleteMagang,
    fetchSiswaList,
    fetchDudiAktif,
    refreshAll,
    
    // Utilities
    clearError: () => setError(null),
  };
};