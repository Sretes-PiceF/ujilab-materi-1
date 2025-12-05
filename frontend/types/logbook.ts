// /types/index.ts
export interface LogbookEntry {
  id: number;
  magang_id: number;
  tanggal: string;
  tanggal_formatted?: string;
  kegiatan: string;
  kendala: string;
  status_verifikasi: 'pending' | 'verified' | 'rejected';
  file?: string;
  webp_image?: string;
  webp_thumbnail?: string;
  original_size: number;
  optimized_size: number;
  
  // URLs
  file_url?: string;
  webp_image_url?: string;
  thumbnail_url?: string;
  
  // Relationships
  siswa: {
    id: number;
    nama: string;
    nis?: string;
  };
  
  magang?: {
    id: number;
    perusahaan?: {
      nama_perusahaan: string;
    };
  };
}