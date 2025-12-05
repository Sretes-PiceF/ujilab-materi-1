<?php

namespace App\Http\Controllers;

use App\Models\Magang;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class MagangSiswaController extends Controller
{
    public function getMagangSiswa(Request $request)
    {
        try {
            $user = Auth::user();
            $siswa = $user->siswa;

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            // Get data magang siswa yang aktif/selesai
            $magang = Magang::with(['dudi', 'guru', 'siswa'])
                ->where('siswa_id', $siswa->id)
                ->whereIn('status', ['diterima', 'berlangsung', 'selesai'])
                ->first();

            if (!$magang) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => 'Belum memiliki magang'
                ]);
            }

            // Format response
            $data = [
                'name' => $magang->siswa->nama,
                'nis' => $magang->siswa->nis,
                'class' => $magang->siswa->kelas,
                'major' => $magang->siswa->jurusan,
                'company' => $magang->dudi->nama_perusahaan,
                'address' => $magang->dudi->alamat,
                'period' => $this->formatSimplePeriod($magang->tanggal_mulai, $magang->tanggal_selesai),
                'status' => $this->getStatusDisplay($magang->status),
                'finalGrade' => $magang->nilai_akhir,
                'verification_token' => $magang->verification_token
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Data magang berhasil diambil'
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getMagangSiswa: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data magang',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function generateLaporanMagangPdf(Request $request)
    {
        // 1. --- PENGAMBILAN DATA DINAMIS DARI DATABASE ---

        // Asumsi: Mendapatkan ID Siswa yang sedang login
        // *Ganti ini sesuai dengan cara Anda mendapatkan ID Siswa yang valid (misalnya dari token API atau session)*
        $siswaId = Auth::id(); // Contoh menggunakan Auth::id() jika ini endpoint web yang diotentikasi

        // Mencari data magang yang dimiliki oleh siswa ini DAN berstatus 'selesai'
        $magang = Magang::where('siswa_id', $siswaId)
            ->where('status', 'selesai') // Filter utama: status harus 'selesai'
            ->with(['siswa', 'dudi'])    // Memuat relasi Siswa dan Dudi
            ->first();                   // Ambil data pertama

        // Validasi: Cek jika data magang tidak ditemukan
        if (!$magang) {
            // Anda bisa melempar error, atau mengarahkan kembali dengan pesan
            abort(404, 'Data magang dengan status selesai tidak ditemukan.');
        }

        // 2. --- FORMAT DATA ---

        Carbon::setLocale('id');

        // Mengambil dan memformat data sesuai dengan struktur yang dibutuhkan template:
        $magangData = (object) [
            'name' => $magang->siswa->nama,
            'nis' => $magang->siswa->nis,
            'class' => $magang->siswa->kelas,
            'major' => $magang->siswa->jurusan,
            'company' => $magang->dudi->nama_perusahaan,
            'address' => $magang->dudi->alamat,
            'tanggal_mulai' => $magang->tanggal_mulai,
            'tanggal_selesai' => $magang->tanggal_selesai,
            'status' => $this->getStatusDisplay($magang->status), // Gunakan helper yang sudah Anda miliki
            'finalGrade' => $magang->nilai_akhir
        ];

        // Format Periode Magang ke Bahasa Indonesia
        $periode_mulai = Carbon::parse($magangData->tanggal_mulai)->translatedFormat('d F Y');
        $periode_selesai = Carbon::parse($magangData->tanggal_selesai)->translatedFormat('d F Y');
        $magangData->period = $periode_mulai . ' s.d ' . $periode_selesai;


        // 3. --- GENERASI PDF MENGGUNAKAN DOMPDF ---

        $data_for_view = [
            'data_magang' => $magangData,
        ];

        $pdf = Pdf::loadView('pdf.laporan_magang', $data_for_view);

        $filename = 'Laporan_Magang_' . $magangData->nis . '_' . time() . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Format periode sederhana tanpa Carbon
     */
    private function formatSimplePeriod($tanggalMulai, $tanggalSelesai)
    {
        if (!$tanggalMulai) {
            return 'Belum ditentukan';
        }

        Carbon::setlocale('id');

        try {
            $mulai = Carbon::parse($tanggalMulai)->translatedFormat('d F Y');
        } catch (\Exception $e) {
            $mulai = $tanggalMulai;
        }

        $selesai = "Sekarang";
        if ($tanggalSelesai) {
            try {
                $selesai = Carbon::parse($tanggalSelesai)->translatedFormat('d F Y');
            } catch (\Exception $e) {
                $selesai = $tanggalSelesai; // Fallback
            }
        }
        return $mulai . ' s.d ' . $selesai;
    }

    /**
     * Format date string to "d M Y" format
     */
    private function formatDateString($dateString)
    {
        // Jika sudah dalam format yang diinginkan, return langsung
        if (is_string($dateString) && preg_match('/\d{1,2} [A-Za-z]{3} \d{4}/', $dateString)) {
            return $dateString;
        }

        // Coba parse berbagai format date
        try {
            $timestamp = strtotime($dateString);
            if ($timestamp !== false) {
                return date('d M Y', $timestamp);
            }
        } catch (\Exception $e) {
            // Jika gagal, return as is
        }

        return $dateString;
    }

    /**
     * Convert status to display format
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
