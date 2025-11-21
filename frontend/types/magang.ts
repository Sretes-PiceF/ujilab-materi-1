// types/magang.ts
export interface Magang {
    id: number;
    siswa_id: number;
    dudi_id: number;
    guru_id: number;
    status: 'pending' | 'diterima' | 'ditolak' | 'berlangsung' | 'selesai' | 'dibatalkan';
    nilai_akhir: number | null;
    tanggal_mulai: string;
    tanggal_selesai: string;
    created_at?: string;
    updated_at?: string;
    
    // Relations (akan di-load dari API)
    siswa?: {
        nis: string;
        nama: string;
        kelas: string;
        jurusan: string;
        telepon: string;
        email: string;
    };
    dudi?: {
        nama_perusahaan: string;
        alamat: string;
        kota: string;
    };
}

export interface MagangFormData {
    siswa_id: number;
    dudi_id: number;
    status: Magang['status'];
    nilai_akhir?: number | null;
    tanggal_mulai: string;
    tanggal_selesai: string;
}

export interface User {
    id: number;
    email: string;
}
