<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\DudiSiswaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DudiSiswa extends Controller
{
    protected $dudiSiswaController;

    public function __construct()
    {
        $this->dudiSiswaController = app(DudiSiswaController::class);
    }

    /**
     * Get batch DUDI data in single request - VERY SHORT CACHE untuk realtime
     */
    public function getDudiBatchData(Request $request)
    {
        try {
            $userId = auth()->id() ?? 'guest';
            $requestHash = md5(json_encode($request->all()));
            $cacheKey = "dudi:batch:{$userId}:{$requestHash}";

            // ⚡ CACHE HANYA 10 DETIK untuk lebih realtime!
            $cacheDuration = 10;

            $data = Cache::remember($cacheKey, $cacheDuration, function () use ($request) {
                return $this->fetchFreshDudiData($request);
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'cached' => true,
                'cache_ttl' => $cacheDuration,
                'expires_at' => now()->addSeconds($cacheDuration)->toDateTimeString()
            ]);
        } catch (\Throwable $th) {
            // Fallback ke fresh data
            $freshData = $this->fetchFreshDudiData($request);

            return response()->json([
                'success' => true,
                'data' => $freshData,
                'cached' => false,
                'error' => 'Cache failed, using fresh data'
            ]);
        }
    }

    /**
     * Get DUDI data tanpa cache untuk realtime updates
     */
    public function getDudiBatchDataFresh(Request $request)
    {
        try {
            $data = $this->fetchFreshDudiData($request);

            return response()->json([
                'success' => true,
                'data' => $data,
                'cached' => false,
                'timestamp' => now()->toDateTimeString()
            ]);
        } catch (\Throwable $th) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data DUDI: ' . $th->getMessage()
            ], 500);
        }
    }

    /**
     * Fetch fresh DUDI data dari database tanpa cache
     */
    private function fetchFreshDudiData(Request $request)
    {
        // Hanya ambil data DUDI aktif
        $dudiResponse = $this->dudiSiswaController->getDudiAktif($request);
        $dudiData = $this->extractData($dudiResponse);

        return [
            'dudi_aktif' => $dudiData,
            'timestamp' => now()->toDateTimeString(),
            'version' => '1.0'
        ];
    }

    /**
     * Clear cache untuk realtime update
     */
    public function clearDudiCache(Request $request)
    {
        try {
            $userId = auth()->id() ?? 'guest';

            // Clear semua cache DUDI untuk user ini
            $prefixes = [
                "dudi:batch:{$userId}:",
                "dudi:batch:{$userId}",
                "dudi:aktif",
                "dudi:list"
            ];

            foreach ($prefixes as $prefix) {
                Cache::forget($prefix);
            }

            return response()->json([
                'success' => true,
                'message' => 'DUDI cache cleared for realtime updates',
                'timestamp' => now()->toDateTimeString()
            ]);
        } catch (\Throwable $th) {
            Log::error('Failed to clear DUDI cache:', ['error' => $th->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus cache DUDI: ' . $th->getMessage()
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
                "dudi:batch:{$userId}",
                "dudi:aktif",
                "dudi:list"
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
