<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Logbook;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class LogbookController extends Controller
{
    // ✅ CONSTANT
    const CACHE_PREFIX = 'logbook:batch';
    const CACHE_TTL = 7; // 7 detik untuk lebih realtime

    /**
     * ✅ CLEAR CACHE METHOD
     */
    public static function clearAllLogbookCache()
    {
        try {
            $userId = Auth::id() ?? 'guest';

            // Clear semua cache key
            $cacheKeys = [
                "logbook:batch:{$userId}:",
                "logbook:batch:{$userId}",
                "logbook:batch:guest",
                "logbook:stats",
                "logbook:list",
                "logbook:all"
            ];

            foreach ($cacheKeys as $key) {
                Cache::forget($key);
            }

            // Clear Redis dengan pattern
            if (config('cache.default') === 'redis') {
                try {
                    $redis = Cache::getRedis();
                    $prefix = config('cache.prefix', 'laravel_cache');
                    $keys = $redis->keys("{$prefix}:*logbook*");

                    foreach ($keys as $key) {
                        $cleanKey = str_replace($prefix . ':', '', $key);
                        Cache::forget($cleanKey);
                    }
                } catch (\Exception $e) {
                    Log::warning('Redis pattern clear failed', ['error' => $e->getMessage()]);
                }
            }

            Log::info('Logbook API cache cleared', ['user_id' => $userId]);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to clear logbook API cache', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * ✅ GET LOGBOOK BATCH DATA - SINGLE ENDPOINT
     */
    public function getLogbookData(Request $request)
    {
        try {
            $userId = auth()->id() ?? 'guest';
            $requestHash = md5(json_encode($request->all()));
            $cacheKey = self::CACHE_PREFIX . ":{$userId}:{$requestHash}";

            // ⚡ CACHE 7 DETIK untuk realtime
            $cacheDuration = self::CACHE_TTL;

            $data = Cache::remember($cacheKey, $cacheDuration, function () use ($request) {
                return $this->fetchFreshBatchData($request);
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'cached' => true,
                'cache_ttl' => $cacheDuration,
                'expires_at' => now()->addSeconds($cacheDuration)->toDateTimeString()
            ]);
        } catch (\Throwable $th) {
            Log::error('Logbook Batch API Error:', [
                'message' => $th->getMessage(),
                'trace' => $th->getTraceAsString()
            ]);

            // Fallback ke fresh data
            try {
                $freshData = $this->fetchFreshBatchData($request);
                return response()->json([
                    'success' => true,
                    'data' => $freshData,
                    'cached' => false,
                    'error' => $th->getMessage()
                ]);
            } catch (\Throwable $fallbackError) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal mengambil data: ' . $fallbackError->getMessage()
                ], 500);
            }
        }
    }

    /**
     * ✅ GET FRESH DATA TANPA CACHE (untuk debugging/testing)
     */
    public function getFreshData(Request $request)
    {
        try {
            $data = $this->fetchFreshBatchData($request);

            return response()->json([
                'success' => true,
                'data' => $data,
                'cached' => false,
                'timestamp' => now()->toDateTimeString()
            ]);
        } catch (\Throwable $th) {
            Log::error('Get fresh logbook data failed', ['error' => $th->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data: ' . $th->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ CLEAR CACHE ENDPOINT
     */
    public function clearCache(Request $request)
    {
        try {
            $cleared = self::clearAllLogbookCache();

            return response()->json([
                'success' => $cleared,
                'message' => $cleared ? 'All logbook cache cleared successfully' : 'Failed to clear cache',
                'timestamp' => now()->toDateTimeString()
            ]);
        } catch (\Exception $e) {
            Log::error('Clear cache endpoint failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error clearing cache'
            ], 500);
        }
    }

    /**
     * ✅ FETCH FRESH BATCH DATA
     */
    private function fetchFreshBatchData(Request $request)
    {
        $search = $request->input('search', '');
        $status = $request->input('status', 'all');

        // 1. GET STATS
        $stats = [
            'total_logbook' => Logbook::count(),
            'belum_diverifikasi' => Logbook::where('status_verifikasi', 'pending')->count(),
            'disetujui' => Logbook::where('status_verifikasi', 'disetujui')->count(),
            'ditolak' => Logbook::where('status_verifikasi', 'ditolak')->count(),
        ];

        // 2. GET ALL LOGBOOKS (TANPA PAGINATION)
        $query = Logbook::with([
            'magang.siswa.user',
            'magang.dudi'
        ]);

        // Apply filters
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('kegiatan', 'like', "%{$search}%")
                    ->orWhere('kendala', 'like', "%{$search}%")
                    ->orWhereHas('magang.siswa', function ($q2) use ($search) {
                        $q2->where('nama', 'like', "%{$search}%")
                            ->orWhere('nis', 'like', "%{$search}%");
                    });
            });
        }

        if ($status !== 'all') {
            $query->where('status_verifikasi', $status);
        }

        $logbooks = $query->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')
            ->get(); // ← INI PERUBAHAN UTAMA!

        // Transform data
        $logbookList = $logbooks->map(function ($logbook) {
            return [
                'id' => $logbook->id,
                'magang_id' => $logbook->magang_id,
                'tanggal' => $logbook->tanggal->format('Y-m-d'),
                'tanggal_formatted' => $logbook->tanggal->format('d M Y'),
                'kegiatan' => $logbook->kegiatan,
                'kendala' => $logbook->kendala,
                'file' => $logbook->file,
                'status_verifikasi' => $logbook->status_verifikasi,
                'catatan_guru' => $logbook->catatan_guru,
                'catatan_dudi' => $logbook->catatan_dudi,
                'original_image' => $logbook->original_image,
                'webp_image' => $logbook->webp_image,
                'webp_thumbnail' => $logbook->webp_thumbnail,
                'original_size' => $logbook->original_size,
                'optimized_size' => $logbook->optimized_size,
                'siswa' => [
                    'id' => $logbook->magang->siswa->id ?? null,
                    'nama' => $logbook->magang->siswa->nama ?? 'N/A',
                    'nis' => $logbook->magang->siswa->nis ?? 'N/A',
                    'kelas' => $logbook->magang->siswa->kelas ?? 'N/A',
                    'jurusan' => $logbook->magang->siswa->jurusan ?? 'N/A',
                    'email' => $logbook->magang->siswa->email ?? 'N/A',
                ],
                'dudi' => [
                    'id' => $logbook->magang->dudi->id ?? null,
                    'nama_perusahaan' => $logbook->magang->dudi->nama_perusahaan ?? 'N/A',
                ],
                'created_at' => $logbook->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $logbook->updated_at->format('Y-m-d H:i:s'),
            ];
        });

        // 3. Get unique siswa and dudi lists for filters
        $siswaList = [];
        $dudiList = [];

        foreach ($logbooks as $logbook) {
            if ($logbook->magang->siswa ?? null) {
                $siswaId = $logbook->magang->siswa->id;
                if (!isset($siswaList[$siswaId])) {
                    $siswaList[$siswaId] = [
                        'id' => $logbook->magang->siswa->id,
                        'nama' => $logbook->magang->siswa->nama,
                        'nis' => $logbook->magang->siswa->nis,
                        'kelas' => $logbook->magang->siswa->kelas,
                        'jurusan' => $logbook->magang->siswa->jurusan,
                        'email' => $logbook->magang->siswa->email,
                    ];
                }
            }

            if ($logbook->magang->dudi ?? null) {
                $dudiId = $logbook->magang->dudi->id;
                if (!isset($dudiList[$dudiId])) {
                    $dudiList[$dudiId] = [
                        'id' => $logbook->magang->dudi->id,
                        'nama_perusahaan' => $logbook->magang->dudi->nama_perusahaan,
                    ];
                }
            }
        }

        // 4. Convert associative arrays to indexed arrays
        $siswaList = array_values($siswaList);
        $dudiList = array_values($dudiList);

        // 5. Get all data for charts (optional - bisa dihapus jika tidak perlu)
        $allLogbooks = $logbooks->map(function ($logbook) {
            return [
                'id' => $logbook->id,
                'tanggal' => $logbook->tanggal->format('Y-m-d'),
                'status_verifikasi' => $logbook->status_verifikasi,
                'siswa_nama' => $logbook->magang->siswa->nama ?? 'N/A',
                'dudi_nama' => $logbook->magang->dudi->nama_perusahaan ?? 'N/A',
            ];
        });

        return [
            'stats' => $stats,
            'logbook_list' => $logbookList->toArray(),
            'siswa_list' => $siswaList,
            'dudi_list' => $dudiList,
            'all_data' => $allLogbooks->toArray(),
            'timestamp' => now()->toDateTimeString(),
            'version' => '1.0'
        ];
    }

    /**
     * ✅ STATIC METHOD UNTUK AUTO-INVALIDATE (dipanggil oleh Model Observer)
     */
    public static function invalidateCache()
    {
        return self::clearAllLogbookCache();
    }
}
