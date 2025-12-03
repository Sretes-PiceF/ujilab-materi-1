<?php

namespace App\Http\Controllers;

use App\Models\Dudi;
use App\Models\Logbook;
use App\Models\Magang;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

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

    public function listLogbook()
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'guru') {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses hanya untuk guru'
                ], 403);
            }

            // ============================
            // 1. MINGGU TERAKHIR
            // ============================
            $startDateWeekly = Carbon::now()->subDays(6)->startOfDay();
            $endDateWeekly = Carbon::now()->endOfDay();

            $logbookMingguIni = Logbook::whereBetween('created_at', [$startDateWeekly, $endDateWeekly])
                ->selectRaw('CAST(created_at AS DATE) AS tanggal, COUNT(*) AS total')
                ->groupByRaw('CAST(created_at AS DATE)')
                ->orderBy('tanggal')
                ->get();

            $weeklyChartData = [];
            $totalMingguIni = 0;

            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i)->format('Y-m-d');
                $dayName = Carbon::now()->subDays($i)->locale('id')->dayName;

                $found = $logbookMingguIni->firstWhere('tanggal', $date);
                $dayTotal = $found->total ?? 0;

                $weeklyChartData[] = [
                    'hari' => $dayName,
                    'tanggal' => $date,
                    'total' => $dayTotal,
                ];

                $totalMingguIni += $dayTotal;
            }

            // ============================
            // 2. BULAN TERAKHIR (PER MINGGU)
            // ============================
            $monthlyChartData = [];
            $totalBulanIni = 0;

            for ($i = 3; $i >= 0; $i--) {
                $weekStart = Carbon::now()->subWeeks($i)->startOfWeek();
                $weekEnd   = Carbon::now()->subWeeks($i)->endOfWeek();

                $totalWeek = Logbook::whereBetween('created_at', [$weekStart, $weekEnd])->count();

                $monthlyChartData[] = [
                    'minggu_ke' => 4 - $i,
                    'periode' => $weekStart->format('d M') . " - " . $weekEnd->format('d M'),
                    'total' => $totalWeek
                ];

                $totalBulanIni += $totalWeek;
            }

            // ============================
            // 3. TAHUN TERAKHIR
            // ============================
            $startDateYearly = Carbon::now()->subMonths(11)->startOfMonth();

            $logbookTahunIni = Logbook::where('created_at', '>=', $startDateYearly)
                ->selectRaw("to_char(created_at, 'YYYY-MM') AS bulan, COUNT(*) AS total")
                ->groupByRaw("to_char(created_at, 'YYYY-MM')")
                ->orderBy('bulan')
                ->get();

            $yearlyChartData = [];
            $totalTahunIni = 0;

            $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

            for ($i = 11; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i)->format('Y-m');
                $monthName = $monthNames[Carbon::now()->subMonths($i)->month - 1];

                $found = $logbookTahunIni->firstWhere('bulan', $month);
                $monthTotal = $found->total ?? 0;

                $yearlyChartData[] = [
                    'bulan' => $monthName,
                    'periode' => $month,
                    'total' => $monthTotal,
                ];

                $totalTahunIni += $monthTotal;
            }

            // ============================
            // 4. STATUS VERIFIKASI
            // ============================
            $statusVerifikasi = Logbook::selectRaw('status_verifikasi, COUNT(*) AS total')
                ->groupBy('status_verifikasi')
                ->get();

            $statusCount = [
                'disetujui' => $statusVerifikasi->where('status_verifikasi', 'disetujui')->first()->total ?? 0,
                'pending'   => $statusVerifikasi->where('status_verifikasi', 'pending')->first()->total ?? 0,
                'ditolak'   => $statusVerifikasi->where('status_verifikasi', 'ditolak')->first()->total ?? 0,
            ];

            // ============================
            // 5. TOTAL LOGBOOK
            // ============================
            $totalAll = Logbook::count();

            // ============================
            // 6. LOGBOOK TERBARU
            // ============================
            $logbookTerbaru = Logbook::with(['magang.siswa', 'magang.dudi'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($logbook) {
                    return [
                        'id' => $logbook->id,
                        'tanggal' => $logbook->tanggal,
                        'tanggal_formatted' => Carbon::parse($logbook->tanggal)->format('d F Y'),
                        'kegiatan' => $logbook->kegiatan,
                        'kendala' => $logbook->kendala,
                        'status_verifikasi' => $logbook->status_verifikasi,
                        'catatan_guru' => $logbook->catatan_guru,
                        'catatan_dudi' => $logbook->catatan_dudi,
                        'file_url' => $logbook->file ? asset('storage/' . $logbook->file) : null,
                        'siswa' => $logbook->magang->siswa ?? null,
                        'dudi' => $logbook->magang->dudi ?? null,
                        'created_at' => $logbook->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'statistik_periode' => [
                        'minggu_terakhir' => [
                            'total' => $totalMingguIni,
                            'data' => $weeklyChartData
                        ],
                        'bulan_terakhir' => [
                            'total' => $totalBulanIni,
                            'data' => $monthlyChartData
                        ],
                        'tahun_terakhir' => [
                            'total' => $totalTahunIni,
                            'data' => $yearlyChartData
                        ]
                    ],
                    'statistik_status' => $statusCount,
                    'total_keseluruhan' => $totalAll,
                    'logbook_terbaru' => $logbookTerbaru
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }


    // app/Http/Controllers/LogbookController.php

    public function getStatistikSiswa()
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'siswa') {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses hanya untuk siswa'
                ], 403);
            }

            $siswaId = $user->siswa->id;

            // Ambil data per status
            $statusData = Logbook::whereHas('magang', function ($query) use ($siswaId) {
                $query->where('siswa_id', $siswaId);
            })
                ->selectRaw('status_verifikasi, COUNT(*) as total')
                ->groupBy('status_verifikasi')
                ->get();

            // Format response sederhana
            return response()->json([
                'success' => true,
                'data' => [
                    'disetujui' => $statusData->where('status_verifikasi', 'disetujui')->first()->total ?? 0,
                    'pending' => $statusData->where('status_verifikasi', 'pending')->first()->total ?? 0,
                    'ditolak' => $statusData->where('status_verifikasi', 'ditolak')->first()->total ?? 0,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }
}
