<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Logbook;
use App\Models\Magang;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class LogbookSiswa extends Controller
{
    // ✅ CONSTANT
    const CACHE_PREFIX = 'logbook:siswa:batch';
    const CACHE_TTL = 7; // 7 detik untuk lebih realtime

    /**
     * ✅ CLEAR CACHE METHOD
     */
    public static function clearAllSiswaCache($siswaId = null)
    {
        try {
            $userId = Auth::id() ?? 'guest';

            // Jika ada siswaId spesifik, clear cache untuk siswa tersebut
            if ($siswaId) {
                $cacheKeys = [
                    "logbook:siswa:batch:{$siswaId}:",
                    "logbook:siswa:batch:{$siswaId}",
                    "logbook:siswa:main:{$siswaId}",
                    "logbook:siswa:main:list:{$siswaId}",
                ];

                foreach ($cacheKeys as $key) {
                    Cache::forget($key);
                }

                Log::info('Siswa logbook cache cleared', ['siswa_id' => $siswaId]);
                return true;
            }

            // Clear semua cache untuk user yang login
            $cacheKeys = [
                "logbook:siswa:batch:{$userId}:",
                "logbook:siswa:batch:{$userId}",
                "logbook:siswa:batch:guest",
            ];

            foreach ($cacheKeys as $key) {
                Cache::forget($key);
            }

            // Clear Redis dengan pattern
            if (config('cache.default') === 'redis') {
                try {
                    $redis = Cache::getRedis();
                    $prefix = config('cache.prefix', 'laravel_cache');
                    $keys = $redis->keys("{$prefix}:*logbook:siswa*");

                    foreach ($keys as $key) {
                        $cleanKey = str_replace($prefix . ':', '', $key);
                        Cache::forget($cleanKey);
                    }
                } catch (\Exception $e) {
                    Log::warning('Redis pattern clear failed', ['error' => $e->getMessage()]);
                }
            }

            Log::info('Siswa logbook API cache cleared', ['user_id' => $userId]);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to clear siswa logbook API cache', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * ✅ GET LOGBOOK BATCH DATA - UNTUK SISWA SAJA (PAGINATION)
     */


    public function getLogbookData(Request $request)
    {
        try {
            $user = Auth::user();

            // ✅ PERBAIKI: Cari siswa berdasarkan user_id
            $siswa = Siswa::where('user_id', $user->id)->first();

            if (!$siswa) {
                Log::error('Siswa not found for user', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan untuk akun ini',
                    'data' => [
                        'logbook_list' => [],
                        'meta' => [
                            'current_page' => 1,
                            'last_page' => 1,
                            'per_page' => 10,
                            'total' => 0,
                            'from' => null,
                            'to' => null,
                        ],
                        'magang_info' => [
                            'status' => 'tidak_aktif',
                            'tanggal_mulai' => null,
                            'tanggal_selesai' => null,
                        ],
                        'siswa_info' => null,
                        'timestamp' => now()->toDateTimeString(),
                        'version' => '1.0'
                    ]
                ], 200);
            }

            $siswaId = $siswa->id;
            $requestHash = md5(json_encode($request->all()));
            $cacheKey = self::CACHE_PREFIX . ":{$siswaId}:{$requestHash}";

            // ⚡ CACHE 7 DETIK untuk realtime
            $cacheDuration = self::CACHE_TTL;

            $data = Cache::remember($cacheKey, $cacheDuration, function () use ($request, $siswa) {
                return $this->fetchFreshSiswaData($request, $siswa);
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'cached' => true,
                'cache_ttl' => $cacheDuration,
                'expires_at' => now()->addSeconds($cacheDuration)->toDateTimeString()
            ]);
        } catch (\Throwable $th) {
            Log::error('Siswa Logbook Batch API Error:', [
                'message' => $th->getMessage(),
                'trace' => $th->getTraceAsString()
            ]);

            // Fallback dengan data minimal
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data: ' . $th->getMessage(),
                'data' => [
                    'logbook_list' => [],
                    'meta' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => 10,
                        'total' => 0,
                        'from' => null,
                        'to' => null,
                    ],
                    'magang_info' => [
                        'status' => 'tidak_aktif',
                        'tanggal_mulai' => null,
                        'tanggal_selesai' => null,
                    ],
                    'siswa_info' => null,
                    'timestamp' => now()->toDateTimeString(),
                    'version' => '1.0'
                ]
            ], 500);
        }
    }

    /**
     * ✅ GET FRESH DATA TANPA CACHE (untuk debugging/testing)
     */
    public function getFreshData(Request $request)
    {
        try {
            $siswa = Auth::user()->siswa;

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            $data = $this->fetchFreshSiswaData($request, $siswa);

            return response()->json([
                'success' => true,
                'data' => $data,
                'cached' => false,
                'timestamp' => now()->toDateTimeString()
            ]);
        } catch (\Throwable $th) {
            Log::error('Get fresh siswa logbook data failed', ['error' => $th->getMessage()]);
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
            $siswa = Auth::user()->siswa;
            $siswaId = $siswa ? $siswa->id : null;

            $cleared = self::clearAllSiswaCache($siswaId);

            return response()->json([
                'success' => $cleared,
                'message' => $cleared ? 'Cache logbook berhasil dibersihkan' : 'Gagal membersihkan cache',
                'timestamp' => now()->toDateTimeString()
            ]);
        } catch (\Exception $e) {
            Log::error('Clear cache endpoint failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error membersihkan cache'
            ], 500);
        }
    }

    /**
     * ✅ FETCH FRESH DATA UNTUK SISWA (DENGAN PAGINATION)
     */

    private function fetchFreshSiswaData(Request $request, $siswa)
    {
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search', '');
        $status = $request->input('status', 'all');

        // Query logbook siswa dengan pagination
        $query = Logbook::whereHas('magang', function ($query) use ($siswa) {
            $query->where('siswa_id', $siswa->id);
        })
            ->with(['magang.dudi'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('kegiatan', 'ILIKE', "%{$search}%")
                        ->orWhere('kendala', 'ILIKE', "%{$search}%");
                });
            })
            ->when($status !== 'all', function ($query) use ($status) {
                $query->where('status_verifikasi', $status);
            })
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc');

        $paginatedLogbooks = $query->paginate($perPage);

        // Transform data dengan null checking
        $logbookList = $paginatedLogbooks->getCollection()->map(function ($logbook) {
            return [
                'id' => $logbook->id,
                'magang_id' => $logbook->magang_id,
                'tanggal' => $logbook->tanggal ? $logbook->tanggal->format('Y-m-d') : null,
                'tanggal_formatted' => $logbook->tanggal ? $logbook->tanggal->format('d M Y') : null,
                'kegiatan' => $logbook->kegiatan,
                'kendala' => $logbook->kendala,
                'file' => $logbook->file,
                'file_url' => $logbook->file ? url('storage/' . $logbook->file) : null,
                'webp_image_url' => $logbook->webp_image ? url('storage/' . $logbook->webp_image) : null,
                'thumbnail_url' => $logbook->webp_thumbnail ? url('storage/' . $logbook->webp_thumbnail) : null,
                'status_verifikasi' => $logbook->status_verifikasi,
                'catatan_guru' => $logbook->catatan_guru,
                'catatan_dudi' => $logbook->catatan_dudi,
                'original_image' => $logbook->original_image,
                'webp_image' => $logbook->webp_image,
                'webp_thumbnail' => $logbook->webp_thumbnail,
                'original_size' => $logbook->original_size,
                'optimized_size' => $logbook->optimized_size,
                'dudi' => [
                    'id' => $logbook->magang->dudi->id ?? null,
                    'nama_perusahaan' => $logbook->magang->dudi->nama_perusahaan ?? 'N/A',
                ],
                'created_at' => $logbook->created_at ? $logbook->created_at->format('Y-m-d H:i:s') : null,
                'updated_at' => $logbook->updated_at ? $logbook->updated_at->format('Y-m-d H:i:s') : null,
            ];
        });

        // Get active magang info (optional)
        $activeMagang = Magang::where('siswa_id', $siswa->id)
            ->where('status', 'berlangsung')
            ->first();

        $magangInfo = $activeMagang ? [
            'id' => $activeMagang->id,
            'status' => $activeMagang->status,
            'tanggal_mulai' => $activeMagang->tanggal_mulai,
            'tanggal_selesai' => $activeMagang->tanggal_selesai,
            'dudi' => [
                'id' => $activeMagang->dudi->id ?? null,
                'nama_perusahaan' => $activeMagang->dudi->nama_perusahaan ?? null,
            ]
        ] : [
            'status' => 'tidak_aktif',
            'tanggal_mulai' => null,
            'tanggal_selesai' => null,
        ];

        // Tambahkan fallback jika tidak ada magang
        if (!$activeMagang) {
            // Cek apakah ada magang dengan status lain
            $latestMagang = Magang::where('siswa_id', $siswa->id)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($latestMagang) {
                $magangInfo = [
                    'id' => $latestMagang->id,
                    'status' => $latestMagang->status,
                    'tanggal_mulai' => $latestMagang->tanggal_mulai,
                    'tanggal_selesai' => $latestMagang->tanggal_selesai,
                    'dudi' => [
                        'id' => $latestMagang->dudi->id ?? null,
                        'nama_perusahaan' => $latestMagang->dudi->nama_perusahaan ?? null,
                    ]
                ];
            }
        }

        return [
            'logbook_list' => $logbookList->toArray(),
            'meta' => [
                'current_page' => $paginatedLogbooks->currentPage(),
                'last_page' => $paginatedLogbooks->lastPage(),
                'per_page' => $paginatedLogbooks->perPage(),
                'total' => $paginatedLogbooks->total(),
                'from' => $paginatedLogbooks->firstItem(),
                'to' => $paginatedLogbooks->lastItem(),
            ],
            'magang_info' => $magangInfo,
            'siswa_info' => [
                'id' => $siswa->id,
                'nama' => $siswa->nama,
                'nis' => $siswa->nis,
                'kelas' => $siswa->kelas,
                'jurusan' => $siswa->jurusan,
            ],
            'timestamp' => now()->toDateTimeString(),
            'version' => '1.0'
        ];
    }

    /**
     * ✅ STATIC METHOD UNTUK AUTO-INVALIDATE CACHE
     */
    public static function invalidateCacheForSiswa($siswaId)
    {
        return self::clearAllSiswaCache($siswaId);
    }
}
