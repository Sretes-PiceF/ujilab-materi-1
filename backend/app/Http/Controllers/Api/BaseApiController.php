<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BaseApiController extends Controller
{
    // Default cache duration (5 menit)
    protected $cacheDuration = 300;

    // Method untuk cache response
    protected function cacheResponse($key, $callback)
    {
        return Cache::remember($key, $this->cacheDuration, $callback);
    }

    // Method untuk hapus cache dengan pattern
    protected function clearCache($pattern)
    {
        // Implementasi hapus cache
    }

    // Method untuk response format standard
    protected function successResponse($data, $message = null)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
    }
}
