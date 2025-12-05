<?php

namespace App\Http\Controllers;

use App\Models\Magang;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VerifikasiController extends Controller
{
    /**
     * Generate PDF untuk akses publik via token (SAMA dengan protected)
     */
    public function generatePdfPublic($token)
    {
        try {
            Log::info('Public PDF access attempt with token: ' . $token);

            // Cari magang berdasarkan token
            $magang = Magang::where('verification_token', $token)
                ->where('status', 'selesai') // Hanya yang sudah selesai
                ->with(['siswa', 'dudi'])
                ->first();

            if (!$magang) {
                // Jika tidak ditemukan, return error atau blank page
                abort(404, 'Dokumen tidak ditemukan atau belum diverifikasi');
            }

            // Format data SAMA dengan yang di protected
            $data_magang = (object) [
                'name' => $magang->siswa->nama,
                'nis' => $magang->siswa->nis,
                'class' => $magang->siswa->kelas,
                'major' => $magang->siswa->jurusan,
                'company' => $magang->dudi->nama_perusahaan,
                'address' => $magang->dudi->alamat,
                'period' => $this->formatPeriod($magang->tanggal_mulai, $magang->tanggal_selesai),
                'status' => $this->getStatusDisplay($magang->status),
                'finalGrade' => $magang->nilai_akhir,
                'verification_token' => $token
            ];

            // Load view PDF yang SAMA
            $pdf = Pdf::loadView('pdf.laporan_magang', [
                'data_magang' => $data_magang
            ]);

            // Set nama file
            $filename = 'Laporan_Magang_' . $data_magang->nis . '_' . date('Ymd_His') . '.pdf';

            // Return PDF untuk di-download
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('Error generating public PDF: ' . $e->getMessage());
            abort(500, 'Terjadi kesalahan saat membuat dokumen PDF');
        }
    }

    /**
     * View HTML untuk public (halaman verifikasi)
     */
    public function viewPublic($token)
    {
        try {
            // Cari magang berdasarkan token
            $magang = Magang::where('verification_token', $token)
                ->where('status', 'selesai')
                ->with(['siswa', 'dudi'])
                ->first();

            if (!$magang) {
                return view('verifikasi.error', [
                    'title' => 'Dokumen Tidak Ditemukan',
                    'message' => 'Token verifikasi tidak valid atau dokumen belum selesai'
                ]);
            }

            // Format data untuk view
            $data_magang = (object) [
                'name' => $magang->siswa->nama,
                'nis' => $magang->siswa->nis,
                'class' => $magang->siswa->kelas,
                'major' => $magang->siswa->jurusan,
                'company' => $magang->dudi->nama_perusahaan,
                'address' => $magang->dudi->alamat,
                'period' => $this->formatPeriod($magang->tanggal_mulai, $magang->tanggal_selesai),
                'status' => $this->getStatusDisplay($magang->status),
                'finalGrade' => $magang->nilai_akhir,
                'verification_token' => $token
            ];

            return view('verifikasi.laporan_public', [
                'data_magang' => $data_magang
            ]);
        } finally {
        }
    }

    /**
     * Helper: Format periode
     */
    private function formatPeriod($tanggalMulai, $tanggalSelesai)
    {
        Carbon::setLocale('id');

        try {
            $mulai = Carbon::parse($tanggalMulai)->translatedFormat('d F Y');
            $selesai = Carbon::parse($tanggalSelesai)->translatedFormat('d F Y');
            return $mulai . ' - ' . $selesai;
        } catch (\Exception $e) {
            return 'Periode tidak valid';
        }
    }

    /**
     * Helper: Convert status to display format
     */
    private function getStatusDisplay($status)
    {
        $statusMap = [
            'diterima' => 'Aktif',
            'berlangsung' => 'Aktif',
            'selesai' => 'Selesai',
            'ditolak' => 'Ditolak',
            'pending' => 'Menunggu',
            'dibatalkan' => 'Dibatalkan'
        ];

        return $statusMap[$status] ?? $status;
    }
}
