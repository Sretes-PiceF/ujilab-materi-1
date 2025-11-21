// types/dudi.ts
export interface Dudi {
    id: number;
    user_id?: number;
    nama_perusahaan: string;
    alamat: string;
    telepon: string;
    email: string;
    penanggung_jawab: string;
    status: 'aktif' | 'nonaktif' | 'pending'; // Sesuai enum di database
    total_siswa?: number;
    created_at?: string;
    updated_at?: string;
}

export interface DudiFormData {
    nama_perusahaan: string;
    alamat: string;
    telepon: string;
    email: string;
    penanggung_jawab: string;
    status: 'aktif' | 'nonaktif' | 'pending';
}