<?php

namespace App\Http\Controllers;

use App\Models\Dudi;
use App\Models\Logbook;
use App\Models\Magang;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function getDashboardData()
    {
        try {
            $totalSiswa = Siswa::count();
            $totalDudi = Dudi::count();
            $totalMagang = Magang::where('status', 'berlangsung')->count();
            $logbookHariIni = Logbook::whereDate('tanggal', Carbon::today())->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_siswa' => $totalSiswa,
                    'total_dudi' => $totalDudi,
                    'siswa_magang' => $totalMagang,
                    'logbook_hari_ini' => $logbookHariIni
                ]
            ], 200);
        } catch (\Throwable $th) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data dashboard',
                'error' => $th->getMessage()
            ], 500);
        }
    }

    public function overview()
    {
        // Hitung total magang
        $totalMagang = Magang::count();

        // Siswa magang yang statusnya berlangsung (aktif)
        $aktifMagang = Magang::where('status', Magang::STATUS_BERLANGSUNG)->count();

        // Hari ini
        $today = Carbon::today()->format('Y-m-d');

        // Logbook yang dibuat hari ini
        $logbookToday = Logbook::whereDate('tanggal', $today)->count();

        // Total logbook
        $totalLogbook = Logbook::count();

        // Hitung persentase aman dari 0 / division by zero
        $persenAktifMagang = $totalMagang > 0 ? round(($aktifMagang / $totalMagang) * 100) : 0;
        $persenLogbookToday = $totalLogbook > 0 ? round(($logbookToday / $totalLogbook) * 100) : 0;

        return response()->json([
            'siswa_aktif_magang' => $persenAktifMagang,
            'logbook_hari_ini' => $persenLogbookToday
        ]);
    }

    public function listDudi()
    {
        // Ambil DUDI hanya yang status = aktif + relasi magang
        $dudi = Dudi::with(['magang'])
            ->where('status', Dudi::STATUS_AKTIF)
            ->orderBy('created_at', 'desc')
            ->get();

        // Hitung jumlah siswa magang pada setiap DUDI
        $dudi->map(function ($item) {
            $item->student_count = $item->magang->count();
            return $item;
        });

        return response()->json($dudi);
    }

    public function listMagang()
    {
        // Ambil 5 data magang terbaru beserta relasi
        $magang = Magang::with(['siswa', 'dudi'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json($magang);
    }
}
