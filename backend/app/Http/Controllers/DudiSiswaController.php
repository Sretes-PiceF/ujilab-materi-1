<?php

namespace App\Http\Controllers;

use App\Events\Siswa\Dudi\DudiCreated;
use App\Models\Dudi;
use App\Models\Magang;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class DudiSiswaController extends Controller
{
    /**
     * Clear cache terkait DUDI
     */

    private function clearDudiCache($studentId = null)
    {
        try {
            $userId = Auth::id() ?? 'guest';
            $cacheKeys = [
                "dudi:aktif:{$userId}",
                "dudi:aktif:guest",
                "dudi:list:aktif",
            ];

            if ($studentId) {
                $cacheKeys[] = "dudi:student:{$studentId}";
                $cacheKeys[] = "dudi:magang:student:{$studentId}";
            }

            foreach ($cacheKeys as $key) {
                Cache::forget($key);
            }

            if (config('cache.default') === 'redis') {
                $redis = Cache::getRedis();
                $keys = $redis->keys('*dudi*');
                foreach ($keys as $key) {
                    $cleanKey = str_replace(config('cache.prefix'), '', $key);
                    Cache::forget($cleanKey);
                }
                $magangKeys = $redis->keys('*magang*');
                foreach ($magangKeys as $key) {
                    $cleanKey = str_replace(config('cache.prefix'), '', $key);
                    Cache::forget($cleanKey);
                }
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to clear DUDI cache: ' . $e->getMessage());
            return false;
        }
    }

    public function getDudiAktif(Request $request)
    {
        try {
            $user = Auth::user();
            $siswa = $user->siswa;
            $studentId = $siswa ? $siswa->id : null;

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            $cacheKey = "dudi:student:{$studentId}";
            $cacheDuration = 15;

            $data = Cache::remember($cacheKey, $cacheDuration, function () use ($siswa) {
                $magangSelesai = Magang::where('siswa_id', $siswa->id)
                    ->where('status', 'selesai')
                    ->with('dudi')
                    ->first();

                $sudahPernahMagang = (bool) $magangSelesai;

                $magangAktif = Magang::where('siswa_id', $siswa->id)
                    ->whereIn('status', ['diterima', 'berlangsung'])
                    ->with('dudi')
                    ->first();

                $sudahPunyaMagangAktif = (bool) $magangAktif;

                $jumlahPendaftaran = Magang::where('siswa_id', $siswa->id)
                    ->whereIn('status', ['pending', 'diterima'])
                    ->count();

                $bisaDaftar = !$sudahPernahMagang
                    && !$sudahPunyaMagangAktif
                    && $jumlahPendaftaran < 3;

                $dudiAktif = Dudi::where('status', 'aktif')
                    ->withCount(['magang as kuota_terisi' => function ($query) {
                        $query->whereIn('status', ['diterima', 'berlangsung']);
                    }])
                    ->get()
                    ->map(function ($dudi) use ($siswa) {
                        $sudahDaftar = Magang::where('siswa_id', $siswa->id)
                            ->where('dudi_id', $dudi->id)
                            ->whereIn('status', ['pending', 'diterima', 'berlangsung'])
                            ->exists();

                        $kuotaTotal = $dudi->kuota_magang ?? 10;
                        $kuotaTerisi = $dudi->kuota_terisi;
                        $kuotaTersisa = $kuotaTotal - $kuotaTerisi;

                        return [
                            'id' => $dudi->id,
                            'nama_perusahaan' => $dudi->nama_perusahaan,
                            'alamat' => $dudi->alamat,
                            'telepon' => $dudi->telepon,
                            'email' => $dudi->email,
                            'penanggung_jawab' => $dudi->penanggung_jawab,
                            'website' => $dudi->website ?? null,
                            'bidang_usaha' => $dudi->bidang_usaha ?? 'Perusahaan Mitra',
                            'deskripsi' => $dudi->deskripsi ?? 'Perusahaan mitra magang siswa',
                            'kuota' => [
                                'terisi' => $kuotaTerisi,
                                'total' => $kuotaTotal,
                                'tersisa' => $kuotaTersisa
                            ],
                            'fasilitas' => $dudi->fasilitas ? explode(',', $dudi->fasilitas) : [],
                            'persyaratan' => $dudi->persyaratan ? explode(',', $dudi->persyaratan) : [],
                            'sudah_daftar' => $sudahDaftar,
                            'status_dudi' => $dudi->status,
                            'last_updated' => now()->toDateTimeString()
                        ];
                    });

                return [
                    'dudi_aktif' => $dudiAktif,
                    'jumlah_pendaftaran' => $jumlahPendaftaran,
                    'maksimal_pendaftaran' => 3,
                    'bisa_daftar' => $bisaDaftar,
                    'sudah_punya_magang_aktif' => $sudahPunyaMagangAktif,
                    'magang_aktif' => $sudahPunyaMagangAktif ? [
                        'id' => $magangAktif->id,
                        'status' => $magangAktif->status,
                        'tanggal_mulai' => $magangAktif->tanggal_mulai,
                        'tanggal_selesai' => $magangAktif->tanggal_selesai,
                        'dudi' => [
                            'id' => $magangAktif->dudi->id ?? null,
                            'nama_perusahaan' => $magangAktif->dudi->nama_perusahaan ?? 'Tidak diketahui',
                            'bidang_usaha' => $magangAktif->dudi->bidang_usaha ?? 'Perusahaan Mitra'
                        ]
                    ] : null,
                    'sudah_pernah_magang' => $sudahPernahMagang,
                    'magang_selesai' => $sudahPernahMagang ? [
                        'id' => $magangSelesai->id,
                        'status' => $magangSelesai->status,
                        'tanggal_mulai' => $magangSelesai->tanggal_mulai,
                        'tanggal_selesai' => $magangSelesai->tanggal_selesai,
                        'nilai_akhir' => $magangSelesai->nilai_akhir,
                        'dudi' => [
                            'id' => $magangSelesai->dudi->id ?? null,
                            'nama_perusahaan' => $magangSelesai->dudi->nama_perusahaan ?? 'Tidak diketahui',
                            'bidang_usaha' => $magangSelesai->dudi->bidang_usaha ?? 'Perusahaan Mitra'
                        ]
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'cached' => Cache::has($cacheKey),
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getDudiAktif: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data DUDI',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get fresh data tanpa cache
     */
    private function getFreshDudiData($siswa)
    {
        // Implementasi sama seperti di dalam cache, tapi tanpa cache
        $magangSelesai = Magang::where('siswa_id', $siswa->id)
            ->where('status', 'selesai')
            ->with('dudi')
            ->first();

        $sudahPernahMagang = (bool) $magangSelesai;

        $magangAktif = Magang::where('siswa_id', $siswa->id)
            ->whereIn('status', ['diterima', 'berlangsung'])
            ->with('dudi')
            ->first();

        $sudahPunyaMagangAktif = (bool) $magangAktif;

        $jumlahPendaftaran = Magang::where('siswa_id', $siswa->id)
            ->whereIn('status', ['pending', 'diterima'])
            ->count();

        $bisaDaftar = !$sudahPernahMagang
            && !$sudahPunyaMagangAktif
            && $jumlahPendaftaran < 3;

        $dudiAktif = Dudi::where('status', 'aktif')
            ->withCount(['magang as kuota_terisi' => function ($query) {
                $query->whereIn('status', ['diterima', 'berlangsung']);
            }])
            ->get()
            ->map(function ($dudi) use ($siswa) {
                $sudahDaftar = Magang::where('siswa_id', $siswa->id)
                    ->where('dudi_id', $dudi->id)
                    ->whereIn('status', ['pending', 'diterima', 'berlangsung'])
                    ->exists();

                $kuotaTotal = $dudi->kuota_magang ?? 10;
                $kuotaTerisi = $dudi->kuota_terisi;
                $kuotaTersisa = $kuotaTotal - $kuotaTerisi;

                return [
                    'id' => $dudi->id,
                    'nama_perusahaan' => $dudi->nama_perusahaan,
                    'alamat' => $dudi->alamat,
                    'telepon' => $dudi->telepon,
                    'email' => $dudi->email,
                    'penanggung_jawab' => $dudi->penanggung_jawab,
                    'website' => $dudi->website ?? null,
                    'bidang_usaha' => $dudi->bidang_usaha ?? 'Perusahaan Mitra',
                    'deskripsi' => $dudi->deskripsi ?? 'Perusahaan mitra magang siswa SMK Negeri 6 Malang',
                    'kuota' => [
                        'terisi' => $kuotaTerisi,
                        'total' => $kuotaTotal,
                        'tersisa' => $kuotaTersisa
                    ],
                    'fasilitas' => $dudi->fasilitas ? explode(',', $dudi->fasilitas) : [],
                    'persyaratan' => $dudi->persyaratan ? explode(',', $dudi->persyaratan) : [],
                    'sudah_daftar' => $sudahDaftar,
                    'status_dudi' => $dudi->status,
                    'last_updated' => now()->toDateTimeString()
                ];
            });

        return [
            'dudi_aktif' => $dudiAktif,
            'jumlah_pendaftaran' => $jumlahPendaftaran,
            'maksimal_pendaftaran' => 3,
            'bisa_daftar' => $bisaDaftar,
            'sudah_punya_magang_aktif' => $sudahPunyaMagangAktif,
            'magang_aktif' => $sudahPunyaMagangAktif ? [
                'id' => $magangAktif->id,
                'status' => $magangAktif->status,
                'tanggal_mulai' => $magangAktif->tanggal_mulai,
                'tanggal_selesai' => $magangAktif->tanggal_selesai,
                'dudi' => [
                    'id' => $magangAktif->dudi->id ?? null,
                    'nama_perusahaan' => $magangAktif->dudi->nama_perusahaan ?? 'Tidak diketahui',
                    'bidang_usaha' => $magangAktif->dudi->bidang_usaha ?? 'Perusahaan Mitra'
                ]
            ] : null,
            'sudah_pernah_magang' => $sudahPernahMagang,
            'magang_selesai' => $sudahPernahMagang ? [
                'id' => $magangSelesai->id,
                'status' => $magangSelesai->status,
                'tanggal_mulai' => $magangSelesai->tanggal_mulai,
                'tanggal_selesai' => $magangSelesai->tanggal_selesai,
                'nilai_akhir' => $magangSelesai->nilai_akhir,
                'dudi' => [
                    'id' => $magangSelesai->dudi->id ?? null,
                    'nama_perusahaan' => $magangSelesai->dudi->nama_perusahaan ?? 'Tidak diketahui',
                    'bidang_usaha' => $magangSelesai->dudi->bidang_usaha ?? 'Perusahaan Mitra'
                ]
            ] : null,
            'cache_info' => [
                'cached' => false,
                'reason' => 'fresh_request'
            ]
        ];
    }

    public function show($id)
    {
        try {
            $user = Auth::user();
            $studentId = $user->siswa ? $user->siswa->id : null;

            $cacheKey = "dudi:detail:{$id}:student:{$studentId}";
            $cacheDuration = 30;

            $data = Cache::remember($cacheKey, $cacheDuration, function () use ($id, $user) {
                $dudi = Dudi::where('status', 'aktif')
                    ->withCount(['magang as kuota_terisi' => function ($query) {
                        $query->whereIn('status', ['diterima', 'berlangsung']);
                    }])
                    ->find($id);

                if (!$dudi) {
                    return ['not_found' => true];
                }

                $siswa = $user->siswa;
                $sudahDaftar = false;

                if ($siswa) {
                    $sudahDaftar = Magang::where('siswa_id', $siswa->id)
                        ->where('dudi_id', $dudi->id)
                        ->exists();
                }

                return [
                    'id' => $dudi->id,
                    'nama_perusahaan' => $dudi->nama_perusahaan,
                    'alamat' => $dudi->alamat,
                    'telepon' => $dudi->telepon,
                    'email' => $dudi->email,
                    'website' => $dudi->website,
                    'bidang_usaha' => $dudi->bidang_usaha,
                    'deskripsi' => $dudi->deskripsi,
                    'kuota' => [
                        'terisi' => $dudi->kuota_terisi,
                        'total' => $dudi->kuota_magang,
                        'tersisa' => $dudi->kuota_magang - $dudi->kuota_terisi
                    ],
                    'fasilitas' => $dudi->fasilitas ? explode(',', $dudi->fasilitas) : [],
                    'persyaratan' => $dudi->persyaratan ? explode(',', $dudi->persyaratan) : [],
                    'penanggung_jawab' => $dudi->penanggung_jawab,
                    'sudah_daftar' => $sudahDaftar,
                    'status_dudi' => $dudi->status,
                    'last_updated' => now()->toDateTimeString()
                ];
            });

            if (isset($data['not_found'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'DUDI tidak ditemukan atau tidak aktif'
                ], 404);
            }

            $data['cache_info'] = [
                'cached' => Cache::has($cacheKey),
                'duration' => $cacheDuration,
                'expires_at' => now()->addSeconds($cacheDuration)->toDateTimeString()
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'cached' => Cache::has($cacheKey),
                'cache_ttl' => $cacheDuration,
                'realtime_channel' => "dudi.{$id}"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail DUDI',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request, $dudi_id)
    {
        try {
            $user = Auth::user();
            $siswa = $user->siswa;

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            // ===== VALIDASI (kode validasi Anda tetap sama) =====
            $sudahPernahMagang = Magang::where('siswa_id', $siswa->id)
                ->where('status', 'selesai')
                ->exists();

            if ($sudahPernahMagang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah pernah menyelesaikan magang'
                ], 403);
            }

            $dudi = Dudi::where('status', 'aktif')->find($dudi_id);
            if (!$dudi) {
                return response()->json([
                    'success' => false,
                    'message' => 'DUDI tidak ditemukan'
                ], 404);
            }

            $kuotaTerisi = Magang::where('dudi_id', $dudi_id)
                ->whereIn('status', ['diterima', 'berlangsung'])
                ->count();

            if ($kuotaTerisi >= ($dudi->kuota_magang ?? 10)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kuota magang sudah penuh'
                ], 400);
            }

            $magangAktif = Magang::where('siswa_id', $siswa->id)
                ->whereIn('status', ['diterima', 'berlangsung'])
                ->first();

            if ($magangAktif) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah memiliki magang aktif'
                ], 400);
            }

            $sudahDaftar = Magang::where('siswa_id', $siswa->id)
                ->where('dudi_id', $dudi_id)
                ->whereIn('status', ['pending', 'diterima', 'berlangsung'])
                ->exists();

            if ($sudahDaftar) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah mendaftar ke DUDI ini'
                ], 400);
            }

            $jumlahPendaftaran = Magang::where('siswa_id', $siswa->id)
                ->whereIn('status', ['pending', 'diterima'])
                ->count();

            if ($jumlahPendaftaran >= 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sudah mencapai batas maksimal pendaftaran'
                ], 400);
            }

            // ===== BUAT PENDAFTARAN =====
            $magang = Magang::create([
                'siswa_id' => $siswa->id,
                'dudi_id' => $dudi_id,
                'guru_id' => null,
                'status' => 'pending',
                'nilai_akhir' => null,
                'tanggal_mulai' => null,
                'tanggal_selesai' => null,
            ]);

            // ✅ Load relasi lengkap
            $magang->load(['dudi', 'siswa.user']);

            // Clear cache
            $this->clearDudiCache($siswa->id);

            // ========== BROADCAST EVENT ==========
            try {
                // ✅ Cari semua guru dan admin
                $targetUsers = User::whereHas('roles', function ($query) {
                    $query->whereIn('name', ['guru', 'admin']);
                })->pluck('id')->toArray();

                // ✅ Dispatch event
                event(new DudiCreated($magang, $targetUsers));

                Log::info('MagangCreated event broadcasted', [
                    'magang_id' => $magang->id,
                    'siswa_id' => $siswa->id,
                    'dudi_id' => $dudi_id,
                    'total_recipients' => count($targetUsers)
                ]);
            } catch (\Exception $broadcastError) {
                Log::error('Broadcast failed: ' . $broadcastError->getMessage());
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $magang->id,
                    'siswa_id' => $magang->siswa_id,
                    'dudi_id' => $magang->dudi_id,
                    'status' => $magang->status,
                    'tanggal_daftar' => $magang->created_at->format('Y-m-d H:i:s'),
                    'dudi' => [
                        'id' => $dudi->id,
                        'nama_perusahaan' => $dudi->nama_perusahaan,
                        'bidang_usaha' => $dudi->bidang_usaha ?? 'Perusahaan Mitra',
                    ],
                ],
                'message' => 'Pendaftaran berhasil dikirim',
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error in store: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim pendaftaran',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }



    /**
     * Get fresh data tanpa cache
     */
    public function getDudiAktifFresh(Request $request)
    {
        try {
            $user = Auth::user();
            $siswa = $user->siswa;

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            $data = $this->getFreshDudiData($siswa);
            $data['cache_info'] = ['cached' => false, 'reason' => 'fresh_request'];

            return response()->json([
                'success' => true,
                'data' => $data,
                'cached' => false,
                'timestamp' => now()->toDateTimeString(),
                'realtime_available' => true
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getDudiAktifFresh: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear cache untuk DUDI siswa
     */
    public function clearDudiCacheEndpoint(Request $request)
    {
        try {
            $user = Auth::user();
            $siswa = $user->siswa;
            $studentId = $siswa ? $siswa->id : null;
            $clearAll = $request->get('all', false);

            if ($clearAll) {
                $this->clearDudiCache();
                $message = 'All DUDI cache cleared successfully';
            } else {
                $this->clearDudiCache($studentId);
                $message = 'User DUDI cache cleared successfully';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'user_id' => Auth::id(),
                'student_id' => $studentId,
                'clear_all' => $clearAll,
                'timestamp' => now()->toDateTimeString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache: ' . $e->getMessage()
            ], 500);
        }
    }
}
