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
    // ✅ CONSTANT - SAMA SEPERTI MAGANG
    const CACHE_PREFIX = 'logbook:batch';
    const CACHE_TTL = 10; // 10 detik seperti magang untuk lebih realtime

    /**
     * ✅ CLEAR CACHE METHOD - SAMA SEPERTI MAGANG
     */
    private function clearAllLogbookCache()
    {
        try {
            $userId = Auth::id() ?? 'guest';

            $cacheKeys = [
                "logbook:batch:{$userId}",
                "logbook:batch:guest",
                "logbook:stats",
                "logbook:list",
                "logbook:all"
            ];

            foreach ($cacheKeys as $key) {
                Cache::forget($key);
            }

            if (config('cache.default') === 'redis') {
                $redis = Cache::getRedis();
                $keys = $redis->keys('*logbook*');
                foreach ($keys as $key) {
                    $cleanKey = str_replace(config('cache.prefix') . ':', '', $key);
                    Cache::forget($cleanKey);
                }
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to clear logbook cache', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * ✅ GET LOGBOOK BATCH DATA - SEPERTI getMagangData()
     */
    public function getLogbookData(Request $request)
    {
        try {
            $userId = auth()->id() ?? 'guest';
            $requestHash = md5(json_encode($request->all()));
            $cacheKey = self::CACHE_PREFIX . ":{$userId}:{$requestHash}";

            // ⚡ CACHE 10 DETIK SEPERTI MAGANG
            $cacheDuration = 10;

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
     * ✅ GET FRESH DATA TANPA CACHE
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
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data: ' . $th->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ CLEAR CACHE ENDPOINT - SEPERTI MAGANG
     */
    public function clearCache(Request $request)
    {
        try {
            $cleared = $this->clearAllLogbookCache();

            return response()->json([
                'success' => $cleared,
                'message' => $cleared ? 'All logbook cache cleared successfully' : 'Failed to clear cache',
                'timestamp' => now()->toDateTimeString()
            ]);
        } catch (\Exception $e) {
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
        // 1. GET STATS
        $stats = [
            'total_logbook' => Logbook::count(),
            'belum_diverifikasi' => Logbook::where('status_verifikasi', 'pending')->count(),
            'disetujui' => Logbook::where('status_verifikasi', 'disetujui')->count(),
            'ditolak' => Logbook::where('status_verifikasi', 'ditolak')->count(),
        ];

        // 2. GET LOGBOOK LIST
        $logbooks = Logbook::with([
            'magang.siswa.user',
            'magang.dudi'
        ])
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($logbook) {
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

        return [
            'stats' => $stats,
            'logbook_list' => $logbooks,
            'timestamp' => now()->toDateTimeString(),
            'version' => '1.0'
        ];
    }

    /**
     * ✅ STATIC METHOD UNTUK AUTO-INVALIDATE (dipanggil oleh Observer)
     */
    public static function invalidateCache()
    {
        $controller = new self();
        return $controller->clearAllLogbookCache();
    }
}
