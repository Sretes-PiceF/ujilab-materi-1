<?php

namespace App\Http\Controllers;

use App\Models\Logbook;
use App\Events\guru\logbook\LogbookUpdated;
use App\Events\guru\logbook\LogbookDeleted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class LogbookGuruController extends Controller
{
    /**
     * ✅ CLEAR ALL CACHE - SINGLE METHOD UNTUK SEMUA
     */
    private function clearAllLogbookCache()
    {
        try {
            $userId = Auth::id() ?? 'guest';
            $requestHash = md5(request()->fullUrl());

            // Clear semua cache key yang relevan
            $cacheKeys = [
                "logbook:batch:{$userId}:{$requestHash}",
                "logbook:batch:{$userId}",
                "logbook:batch:guest",
                "logbook:stats",
                "logbook:list",
                "logbook:all",
            ];

            foreach ($cacheKeys as $key) {
                Cache::forget($key);
            }

            // Clear dengan pattern untuk Redis
            if (config('cache.default') === 'redis') {
                try {
                    $redis = Cache::getRedis();
                    $prefix = config('cache.prefix', 'laravel_cache');

                    // Clear semua cache yang mengandung kata 'logbook'
                    $keys = $redis->keys("{$prefix}:*logbook*");

                    foreach ($keys as $key) {
                        $cleanKey = str_replace($prefix . ':', '', $key);
                        Cache::forget($cleanKey);
                    }

                    Log::info('Redis logbook cache cleared', [
                        'keys_count' => count($keys),
                        'user_id' => $userId
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Redis pattern clear failed', [
                        'error' => $e->getMessage()
                    ]);
                }
            }

            Log::info('Logbook cache cleared', ['user_id' => $userId]);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to clear logbook cache: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * ✅ GET ALL LOGBOOK STATS
     * Route: GET /api/guru/logbook/stats
     */
    public function getAllLogbook()
    {
        try {
            $cacheKey = 'logbook:stats';
            $cacheDuration = 10; // 10 detik untuk lebih realtime

            $data = Cache::remember($cacheKey, $cacheDuration, function () {
                return [
                    'total_logbook' => Logbook::count(),
                    'belum_diverifikasi' => Logbook::where('status_verifikasi', 'pending')->count(),
                    'disetujui' => Logbook::where('status_verifikasi', 'disetujui')->count(),
                    'ditolak' => Logbook::where('status_verifikasi', 'ditolak')->count(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'cached' => Cache::has($cacheKey),
                'timestamp' => now()->toDateTimeString()
            ], 200);
        } catch (\Throwable $th) {
            Log::error('Get all logbook failed', ['error' => $th->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data stats logbook',
                'error' => $th->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ GET LOGBOOK LIST
     * Route: GET /api/guru/logbook/list
     */
    public function index(Request $request)
    {
        try {
            // Gunakan request hash untuk caching yang lebih spesifik
            $requestHash = md5(json_encode($request->all()));
            $cacheKey = 'logbook:list:' . $requestHash;
            $cacheDuration = 10; // 10 detik untuk realtime

            $result = Cache::remember($cacheKey, $cacheDuration, function () use ($request) {
                $perPage = $request->input('per_page', 10);
                $search = $request->input('search', '');
                $status = $request->input('status', 'all');

                $logbooks = Logbook::with([
                    'magang.siswa.user',
                    'magang.dudi'
                ])
                    ->when($search, function ($query) use ($search) {
                        $query->where(function ($q) use ($search) {
                            $q->where('kegiatan', 'like', "%{$search}%")
                                ->orWhere('kendala', 'like', "%{$search}%")
                                ->orWhereHas('magang.siswa', function ($q2) use ($search) {
                                    $q2->where('nama', 'like', "%{$search}%")
                                        ->orWhere('nis', 'like', "%{$search}%");
                                });
                        });
                    })
                    ->when($status !== 'all', function ($query) use ($status) {
                        $query->where('status_verifikasi', $status);
                    })
                    ->orderBy('tanggal', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->paginate($perPage);

                // Transform data
                $logbooks->getCollection()->transform(function ($logbook) {
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
                    'data' => $logbooks->items(),
                    'meta' => [
                        'current_page' => $logbooks->currentPage(),
                        'last_page' => $logbooks->lastPage(),
                        'per_page' => $logbooks->perPage(),
                        'total' => $logbooks->total(),
                        'from' => $logbooks->firstItem(),
                        'to' => $logbooks->lastItem(),
                    ]
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $result['data'],
                'meta' => $result['meta'],
                'message' => 'Data logbook berhasil diambil',
                'cached' => Cache::has($cacheKey),
                'cache_ttl' => $cacheDuration
            ]);
        } catch (\Exception $e) {
            Log::error('Get logbook list failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data logbook',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ CREATE LOGBOOK
     * Route: POST /api/guru/logbook/create
     */
    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            $validator = Validator::make($request->all(), [
                'magang_id' => 'required|exists:magangs,id',
                'tanggal' => 'required|date',
                'kegiatan' => 'required|string|min:10',
                'kendala' => 'required|string|min:5',
                'file' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $logbookData = [
                'magang_id' => $request->magang_id,
                'tanggal' => $request->tanggal,
                'kegiatan' => $request->kegiatan,
                'kendala' => $request->kendala,
                'status_verifikasi' => 'pending',
            ];

            if ($request->hasFile('file')) {
                $filePath = $request->file('file')->store('logbook_files', 'public');
                $logbookData['file'] = $filePath;
            }

            $logbook = Logbook::create($logbookData);
            $logbook->load(['magang.siswa.user', 'magang.dudi']);

            // Clear cache untuk refresh data realtime
            $this->clearAllLogbookCache();

            // Broadcast event untuk realtime update
            broadcast(new LogbookUpdated($logbook, 'created'))->toOthers();

            Log::info('Logbook created and broadcasted', [
                'logbook_id' => $logbook->id,
                'siswa' => $logbook->magang->siswa->nama ?? 'Unknown'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Logbook berhasil dibuat',
                'data' => $logbook,
                'cache_cleared' => true,
                'broadcasted' => true
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create logbook', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat logbook: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ UPDATE LOGBOOK
     * Route: POST /api/logbook/update/{id}
     */
    public function update(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $logbook = Logbook::with(['magang.siswa.user', 'magang.dudi'])->find($id);

            if (!$logbook) {
                return response()->json([
                    'success' => false,
                    'message' => 'Logbook tidak ditemukan'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'kegiatan' => 'required|string|min:10',
                'kendala' => 'required|string|min:5',
                'file' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
                'status_verifikasi' => 'nullable|in:pending,disetujui,ditolak',
                'catatan_guru' => 'nullable|string',
                'remove_file' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [
                'kegiatan' => $request->kegiatan,
                'kendala' => $request->kendala,
            ];

            if ($request->has('status_verifikasi')) {
                $updateData['status_verifikasi'] = $request->status_verifikasi;
            }

            if ($request->has('catatan_guru')) {
                $updateData['catatan_guru'] = $request->catatan_guru;
            }

            // Handle file removal
            if ($request->remove_file == '1') {
                if ($logbook->file && Storage::disk('public')->exists($logbook->file)) {
                    Storage::disk('public')->delete($logbook->file);
                }
                $updateData['file'] = null;
            }
            // Handle file upload
            else if ($request->hasFile('file')) {
                if ($logbook->file && Storage::disk('public')->exists($logbook->file)) {
                    Storage::disk('public')->delete($logbook->file);
                }
                $filePath = $request->file('file')->store('logbook_files', 'public');
                $updateData['file'] = $filePath;
            }

            $logbook->update($updateData);
            $logbook->refresh();
            $logbook->load(['magang.siswa.user', 'magang.dudi']);

            // Clear cache untuk refresh data realtime
            $this->clearAllLogbookCache();

            // Broadcast event untuk realtime update
            broadcast(new LogbookUpdated($logbook, 'updated'))->toOthers();

            Log::info('Logbook updated and broadcasted', [
                'logbook_id' => $logbook->id,
                'status' => $logbook->status_verifikasi
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Logbook berhasil diupdate',
                'data' => $logbook,
                'cache_cleared' => true,
                'broadcasted' => true
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update logbook', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate logbook: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ VERIFIKASI LOGBOOK
     * Route: PUT /api/logbook/{id}/verifikasi
     */
    public function verifikasi(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $validator = Validator::make($request->all(), [
                'status_verifikasi' => 'required|in:pending,disetujui,ditolak',
                'catatan_guru' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $logbook = Logbook::with(['magang.siswa.user', 'magang.dudi'])->findOrFail($id);

            $logbook->update([
                'status_verifikasi' => $request->status_verifikasi,
                'catatan_guru' => $request->catatan_guru,
            ]);

            $logbook->refresh();
            $logbook->load(['magang.siswa.user', 'magang.dudi']);

            // Clear cache untuk refresh data realtime
            $this->clearAllLogbookCache();

            // Broadcast event untuk realtime update
            broadcast(new LogbookUpdated($logbook, 'verifikasi'))->toOthers();

            Log::info('Logbook verified and broadcasted', [
                'logbook_id' => $logbook->id,
                'status' => $logbook->status_verifikasi
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Verifikasi logbook berhasil',
                'data' => $logbook,
                'cache_cleared' => true,
                'broadcasted' => true
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to verify logbook', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memverifikasi logbook: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ DELETE LOGBOOK
     * Route: DELETE /api/logbook/delete/{id}
     */
    public function destroy($id)
    {
        DB::beginTransaction();

        try {
            $logbook = Logbook::with(['magang.siswa.user', 'magang.dudi'])->find($id);

            if (!$logbook) {
                return response()->json([
                    'success' => false,
                    'message' => 'Logbook tidak ditemukan'
                ], 404);
            }

            // Simpan data untuk broadcast
            $logbookId = $logbook->id;
            $logbookData = $logbook->toArray();

            // Delete file if exists
            if ($logbook->file && Storage::disk('public')->exists($logbook->file)) {
                Storage::disk('public')->delete($logbook->file);
            }

            // Delete logbook
            $logbook->delete();

            // Clear cache untuk refresh data realtime
            $this->clearAllLogbookCache();

            // Broadcast event untuk realtime update
            broadcast(new LogbookDeleted($logbookId))->toOthers();

            Log::info('Logbook deleted and broadcasted', [
                'logbook_id' => $logbookId,
                'siswa' => $logbookData['siswa_nama'] ?? 'Unknown'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Logbook berhasil dihapus',
                'cache_cleared' => true,
                'broadcasted' => true
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete logbook', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus logbook: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ CLEAR CACHE MANUAL
     * Route: POST /api/guru/logbook/clear-cache
     */
    public function clearCache()
    {
        try {
            $cleared = $this->clearAllLogbookCache();

            return response()->json([
                'success' => $cleared,
                'message' => $cleared ? 'All logbook cache cleared successfully' : 'Failed to clear cache',
                'timestamp' => now()->toDateTimeString()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to clear cache manually', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error clearing cache: ' . $e->getMessage()
            ], 500);
        }
    }
}
