<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\MagangGuruController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BatchController extends Controller
{
    /**
     * Get multiple data in single request - WITH SHORT CACHE
     */
    public function getMagangData(Request $request)
    {
        try {
            // Cache key berdasarkan user dan request parameters
            $userId = auth()->id() ?? 'guest';
            $requestHash = md5(json_encode($request->all()));
            $cacheKey = "magang:batch:{$userId}:{$requestHash}";

            // Cache hanya 30 detik untuk lebih realtime
            $cacheDuration = 30;

            $data = Cache::remember($cacheKey, $cacheDuration, function () use ($request) {
                return $this->fetchFreshData($request);
            });

            // Tambahkan cache info
            $data['cache_info'] = [
                'cached' => true,
                'duration' => $cacheDuration,
                'expires_at' => now()->addSeconds($cacheDuration)->toDateTimeString(),
                'key' => $cacheKey
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'cached' => true,
                'cache_ttl' => $cacheDuration
            ]);
        } catch (\Throwable $th) {
            Log::error('Batch API Error:', [
                'message' => $th->getMessage(),
                'trace' => $th->getTraceAsString()
            ]);

            // Fallback ke fresh data tanpa cache
            try {
                $freshData = $this->fetchFreshData($request);
                $freshData['cache_info'] = ['cached' => false, 'error' => $th->getMessage()];

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
     * Get data without cache (untuk realtime refresh)
     */
    public function getMagangDataFresh(Request $request)
    {
        try {
            $data = $this->fetchFreshData($request);
            $data['cache_info'] = ['cached' => false];

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
     * Fetch fresh data dari database tanpa cache
     */
    private function fetchFreshData(Request $request)
    {
        $magangController = app(MagangGuruController::class);

        // 1. Get Stats
        $statsResponse = $magangController->getAllMagang();
        $stats = $this->extractData($statsResponse);

        // 2. Get Magang List
        $listResponse = $magangController->getMagangList($request);
        $magangList = $this->extractData($listResponse);

        // 3. Get Siswa List
        $siswaResponse = $magangController->getSiswaList();
        $siswaList = $this->extractData($siswaResponse);

        return [
            'stats' => $stats,
            'magang_list' => $magangList,
            'siswa_list' => $siswaList,
            'timestamp' => now()->toDateTimeString(),
            'request_id' => uniqid()
        ];
    }

    /**
     * Clear semua cache magang untuk user tertentu atau semua
     */
    public function clearBatchCache(Request $request)
    {
        try {
            $userId = auth()->id() ?? 'guest';
            $clearAll = $request->get('all', false);

            if ($clearAll) {
                // Clear semua cache dengan prefix magang:
                if (config('cache.default') === 'redis') {
                    $redis = Cache::getRedis();
                    $keys = $redis->keys('*magang*');

                    $clearedCount = 0;
                    foreach ($keys as $key) {
                        $cleanKey = str_replace(config('cache.prefix'), '', $key);
                        Cache::forget($cleanKey);
                        $clearedCount++;
                    }

                    Log::info('Cleared ALL magang cache from Redis', [
                        'keys_count' => $clearedCount,
                        'user_id' => $userId
                    ]);
                } else {
                    // Untuk driver lain
                    Cache::forget('magang:stats');
                    Cache::forget('magang:list');
                    Cache::forget('magang:siswa');
                    Cache::forget('magang:all');
                }

                $message = 'All magang cache cleared successfully';
            } else {
                // Clear hanya untuk user ini
                $prefix = "magang:batch:{$userId}:";

                if (config('cache.default') === 'redis') {
                    $redis = Cache::getRedis();
                    $keys = $redis->keys($prefix . '*');

                    foreach ($keys as $key) {
                        $cleanKey = str_replace(config('cache.prefix'), '', $key);
                        Cache::forget($cleanKey);
                    }
                }

                // Clear key utama juga
                Cache::forget("magang:batch:{$userId}");
                Cache::forget("magang:batch:guest");

                $message = 'User magang cache cleared successfully';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'user_id' => $userId,
                'clear_all' => $clearAll,
                'timestamp' => now()->toDateTimeString()
            ]);
        } catch (\Throwable $th) {
            Log::error('Failed to clear batch cache:', ['error' => $th->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus cache: ' . $th->getMessage()
            ], 500);
        }
    }

    /**
     * Get cache status untuk debugging
     */
    public function getCacheStatus()
    {
        try {
            $userId = auth()->id() ?? 'guest';
            $cacheKeys = [
                "magang:batch:{$userId}",
                "magang:stats",
                "magang:list",
                "magang:siswa"
            ];

            $status = [];
            foreach ($cacheKeys as $key) {
                $status[$key] = Cache::has($key) ? 'EXISTS' : 'NOT FOUND';
            }

            return response()->json([
                'success' => true,
                'data' => $status,
                'user_id' => $userId,
                'cache_driver' => config('cache.default')
            ]);
        } catch (\Throwable $th) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $th->getMessage()
            ], 500);
        }
    }

    /**
     * Extract data dari response
     */
    private function extractData($response)
    {
        if (!$response) return null;

        try {
            $content = $response->getData(true);
            return $content['data'] ?? (isset($content['success']) && $content['success'] ? $content : []);
        } catch (\Exception $e) {
            Log::error('Failed to extract data from response', ['error' => $e->getMessage()]);
            return [];
        }
    }
}
