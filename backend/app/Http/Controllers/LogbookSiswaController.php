<?php

namespace App\Http\Controllers;

use App\Models\Logbook;
use App\Models\Magang;
use App\Models\Siswa; // ✅ TAMBAHKAN IMPORT
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class LogbookSiswaController extends Controller
{
    const CACHE_PREFIX = 'logbook:siswa:main';
    const CACHE_TTL = 10;

    /**
     * ✅ HELPER METHOD UNTUK MENDAPATKAN SISWA
     */
    private function getSiswa()
    {
        $user = Auth::user();

        if (!$user) {
            return null;
        }

        // Cari siswa berdasarkan user_id (sesuai model Siswa Anda)
        return Siswa::where('user_id', $user->id)->first();
    }

    private function getActiveMagang()
    {
        $siswa = $this->getSiswa();

        if (!$siswa) {
            return null;
        }

        $magang = Magang::where('siswa_id', $siswa->id)
            ->where('status', 'berlangsung')
            ->first();

        return $magang;
    }

    /**
     * ✅ CLEAR CACHE METHOD
     */
    private function clearSiswaCache($siswaId = null)
    {
        try {
            $siswa = $this->getSiswa();
            $currentSiswaId = $siswaId ?? ($siswa ? $siswa->id : null);

            // Clear cache keys
            $cacheKeys = [
                "logbook:siswa:main:{$currentSiswaId}",
                "logbook:siswa:main:list:{$currentSiswaId}",
                "logbook:siswa:main:stats:{$currentSiswaId}",
                "logbook:siswa:main:status:{$currentSiswaId}",
            ];

            foreach ($cacheKeys as $key) {
                Cache::forget($key);
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to clear siswa logbook cache: ' . $e->getMessage());
            return false;
        }
    }

    public function getStatusMagang()
    {
        try {
            $siswa = $this->getSiswa();

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            $cacheKey = self::CACHE_PREFIX . ":status:{$siswa->id}";
            $cacheDuration = self::CACHE_TTL;

            $data = Cache::remember($cacheKey, $cacheDuration, function () use ($siswa) {
                $latestMagang = Magang::where('siswa_id', $siswa->id)
                    ->orderBy('created_at', 'desc')
                    ->first();

                if (!$latestMagang) {
                    return [
                        'status_magang' => 'pending',
                        'has_magang' => false,
                        'magang' => null
                    ];
                }

                return [
                    'status_magang' => $latestMagang->status,
                    'has_magang' => true,
                    'magang' => [
                        'id' => $latestMagang->id,
                        'status' => $latestMagang->status,
                        'tanggal_mulai' => $latestMagang->tanggal_mulai,
                        'tanggal_selesai' => $latestMagang->tanggal_selesai,
                        'dudi' => [
                            'id' => $latestMagang->dudi->id ?? null,
                            'nama_perusahaan' => $latestMagang->dudi->nama_perusahaan ?? null,
                        ]
                    ]
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Status magang berhasil diambil',
                'cached' => Cache::has($cacheKey),
                'cache_ttl' => $cacheDuration
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil status magang',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $siswa = $this->getSiswa();

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            $perPage = $request->input('per_page', 10);
            $search = $request->input('search', '');
            $status = $request->input('status', 'all');

            $requestHash = md5(json_encode([
                'siswa_id' => $siswa->id,
                'per_page' => $perPage,
                'search' => $search,
                'status' => $status
            ]));

            $cacheKey = self::CACHE_PREFIX . ":list:{$siswa->id}:{$requestHash}";
            $cacheDuration = self::CACHE_TTL;

            $result = Cache::remember($cacheKey, $cacheDuration, function () use ($siswa, $perPage, $search, $status) {
                $logbooks = Logbook::whereHas('magang', function ($query) use ($siswa) {
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
                    ->orderBy('created_at', 'desc')
                    ->paginate($perPage);

                $logbooks->getCollection()->transform(function ($logbook) {
                    return [
                        'id' => $logbook->id,
                        'magang_id' => $logbook->magang_id,
                        'tanggal' => $logbook->tanggal->format('Y-m-d'),
                        'tanggal_formatted' => $logbook->tanggal->format('d M Y'),
                        'kegiatan' => $logbook->kegiatan,
                        'kendala' => $logbook->kendala,
                        'file' => $logbook->file ? url('storage/' . $logbook->file) : null,
                        'status_verifikasi' => $logbook->status_verifikasi,
                        'catatan_guru' => $logbook->catatan_guru,
                        'catatan_dudi' => $logbook->catatan_dudi,
                        'dudi' => [
                            'id' => $logbook->magang->dudi->id ?? null,
                            'nama_perusahaan' => $logbook->magang->dudi->nama_perusahaan ?? null,
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
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data logbook',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ GET STATS UNTUK SISWA
     */
    public function getStats()
    {
        try {
            $siswa = $this->getSiswa();

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            $cacheKey = self::CACHE_PREFIX . ":stats:{$siswa->id}";
            $cacheDuration = self::CACHE_TTL;

            $stats = Cache::remember($cacheKey, $cacheDuration, function () use ($siswa) {
                return [
                    'total_logbook' => Logbook::whereHas('magang', function ($query) use ($siswa) {
                        $query->where('siswa_id', $siswa->id);
                    })->count(),
                    'belum_diverifikasi' => Logbook::whereHas('magang', function ($query) use ($siswa) {
                        $query->where('siswa_id', $siswa->id);
                    })->where('status_verifikasi', 'pending')->count(),
                    'disetujui' => Logbook::whereHas('magang', function ($query) use ($siswa) {
                        $query->where('siswa_id', $siswa->id);
                    })->where('status_verifikasi', 'disetujui')->count(),
                    'ditolak' => Logbook::whereHas('magang', function ($query) use ($siswa) {
                        $query->where('siswa_id', $siswa->id);
                    })->where('status_verifikasi', 'ditolak')->count(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Stats logbook berhasil diambil',
                'cached' => Cache::has($cacheKey),
                'cache_ttl' => $cacheDuration
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil stats logbook',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $magang = $this->getActiveMagang();

        if (!$magang) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki magang aktif.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'tanggal' => 'required|date|before_or_equal:today',
            'kegiatan' => 'required|string|min:10',
            'kendala' => 'required|string|min:5',
            'file' => 'nullable|image|mimes:jpeg,jpg,png|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $existingLogbook = Logbook::where('magang_id', $magang->id)
            ->whereDate('tanggal', $request->tanggal)
            ->first();

        if ($existingLogbook) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah membuat logbook untuk tanggal ini'
            ], 422);
        }

        $logbookData = [
            'magang_id' => $magang->id,
            'tanggal' => $request->tanggal,
            'kegiatan' => $request->kegiatan,
            'kendala' => $request->kendala,
            'status_verifikasi' => 'pending',
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = 'logbook_' . time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs('logbook', $fileName, 'public');
            $logbookData['file'] = $filePath;
        }

        $logbook = Logbook::create($logbookData);
        $this->clearSiswaCache($magang->siswa_id);

        return response()->json([
            'success' => true,
            'message' => 'Logbook berhasil ditambahkan',
            'data' => [
                'id' => $logbook->id,
                'magang_id' => $logbook->magang_id,
                'tanggal' => $logbook->tanggal->format('Y-m-d'),
                'kegiatan' => $logbook->kegiatan,
                'kendala' => $logbook->kendala,
                'status_verifikasi' => $logbook->status_verifikasi,
                'file_url' => $logbook->file ? url('storage/' . $logbook->file) : null,
            ],
            'cache_cleared' => true
        ], 201);
    }

    public function show($id)
    {
        try {
            $siswa = $this->getSiswa();

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            $cacheKey = self::CACHE_PREFIX . ":detail:{$siswa->id}:{$id}";
            $cacheDuration = self::CACHE_TTL;

            $data = Cache::remember($cacheKey, $cacheDuration, function () use ($siswa, $id) {
                $logbook = Logbook::whereHas('magang', function ($query) use ($siswa) {
                    $query->where('siswa_id', $siswa->id);
                })
                    ->with(['magang.dudi'])
                    ->findOrFail($id);

                return [
                    'id' => $logbook->id,
                    'magang_id' => $logbook->magang_id,
                    'tanggal' => $logbook->tanggal->format('Y-m-d'),
                    'tanggal_formatted' => $logbook->tanggal->format('d M Y'),
                    'kegiatan' => $logbook->kegiatan,
                    'kendala' => $logbook->kendala,
                    'file' => $logbook->file ? url('storage/' . $logbook->file) : null,
                    'status_verifikasi' => $logbook->status_verifikasi,
                    'catatan_guru' => $logbook->catatan_guru,
                    'catatan_dudi' => $logbook->catatan_dudi,
                    'dudi' => [
                        'id' => $logbook->magang->dudi->id ?? null,
                        'nama_perusahaan' => $logbook->magang->dudi->nama_perusahaan ?? 'N/A',
                    ],
                    'created_at' => $logbook->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $logbook->updated_at->format('Y-m-d H:i:s'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'cached' => Cache::has($cacheKey),
                'cache_ttl' => $cacheDuration
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logbook tidak ditemukan',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $siswa = $this->getSiswa();

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            $logbook = Logbook::whereHas('magang', function ($query) use ($siswa) {
                $query->where('siswa_id', $siswa->id);
            })->findOrFail($id);

            if ($logbook->status_verifikasi !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Logbook yang sudah diverifikasi tidak dapat diedit'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'tanggal' => 'nullable|date|before_or_equal:today',
                'kegiatan' => 'nullable|string|min:10',
                'kendala' => 'nullable|string|min:5',
                'file' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [];

            if ($request->has('tanggal')) $updateData['tanggal'] = $request->tanggal;
            if ($request->has('kegiatan')) $updateData['kegiatan'] = trim($request->kegiatan);
            if ($request->has('kendala')) $updateData['kendala'] = trim($request->kendala);

            if ($request->hasFile('file')) {
                if ($logbook->file && Storage::disk('public')->exists($logbook->file)) {
                    Storage::disk('public')->delete($logbook->file);
                }

                $file = $request->file('file');
                $fileName = 'logbook_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $filePath = $file->storeAs('logbook', $fileName, 'public');
                $updateData['file'] = $filePath;
            }

            if (!empty($updateData)) {
                $logbook->update($updateData);
            }

            $this->clearSiswaCache($siswa->id);

            return response()->json([
                'success' => true,
                'message' => 'Logbook berhasil diupdate',
                'data' => $logbook,
                'cache_cleared' => true
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logbook tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate logbook',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $siswa = $this->getSiswa();

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            $logbook = Logbook::whereHas('magang', function ($query) use ($siswa) {
                $query->where('siswa_id', $siswa->id);
            })
                ->findOrFail($id);

            if ($logbook->status_verifikasi !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Logbook yang sudah diverifikasi tidak dapat dihapus'
                ], 403);
            }

            if ($logbook->file && Storage::disk('public')->exists($logbook->file)) {
                Storage::disk('public')->delete($logbook->file);
            }

            $logbook->delete();
            $this->clearSiswaCache($siswa->id);

            return response()->json([
                'success' => true,
                'message' => 'Logbook berhasil dihapus',
                'cache_cleared' => true
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus logbook',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function clearCache()
    {
        try {
            $siswa = $this->getSiswa();
            $siswaId = $siswa ? $siswa->id : null;

            $cleared = $this->clearSiswaCache($siswaId);

            return response()->json([
                'success' => $cleared,
                'message' => $cleared ? 'Cache logbook berhasil dibersihkan' : 'Gagal membersihkan cache',
                'timestamp' => now()->toDateTimeString()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to clear cache manually', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error membersihkan cache: ' . $e->getMessage()
            ], 500);
        }
    }
}
