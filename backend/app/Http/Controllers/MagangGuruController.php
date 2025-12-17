<?php

namespace App\Http\Controllers;

use App\Events\MagangUpdated;
use App\Models\Magang;
use App\Models\Dudi;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class MagangGuruController extends Controller
{
    /**
     * Helper untuk clear semua cache magang
     */
    private function clearAllMagangCache()
    {
        try {
            $userId = Auth::id() ?? 'guest';

            // Clear cache untuk semua user dan semua pattern
            $cacheKeys = [
                "magang:batch:{$userId}",
                "magang:batch:guest",
                "magang:stats",
                "magang:list",
                "magang:siswa",
                "magang:all"
            ];

            foreach ($cacheKeys as $key) {
                Cache::forget($key);
            }

            // Jika menggunakan Redis, clear dengan pattern
            if (config('cache.default') === 'redis') {
                $redis = Cache::getRedis();

                // Clear semua cache dengan prefix magang:
                $keys = $redis->keys('*magang*');
                foreach ($keys as $key) {
                    $cleanKey = str_replace(config('cache.prefix'), '', $key);
                    Cache::forget($cleanKey);
                }
            }

            Log::info('All magang cache cleared successfully');
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to clear cache: ' . $e->getMessage());
            return false;
        }
    }

    public function getAllMagang()
    {
        try {
            // Cache untuk stats dengan key spesifik
            $cacheKey = 'magang:stats';
            $cacheDuration = 30; // 30 detik saja

            $data = Cache::remember($cacheKey, $cacheDuration, function () {
                $totalSiswa = Magang::distinct('siswa_id')->count('siswa_id');
                $siswaAktif = Magang::where('status', 'berlangsung')->count();
                $siswaSelesai = Magang::where('status', 'selesai')->count();
                $siswaPending = Magang::where('status', 'pending')->count();

                return [
                    'total_siswa' => $totalSiswa,
                    'aktif' => $siswaAktif,
                    'selesai' => $siswaSelesai,
                    'pending' => $siswaPending
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'cached' => Cache::has($cacheKey)
            ], 200);
        } catch (\Throwable $th) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data dashboard magang',
                'error' => $th->getMessage()
            ], 500);
        }
    }

    public function createMagang(Request $request)
    {
        DB::beginTransaction();

        try {
            Log::info('Data received for magang creation:', $request->all());

            // Validasi data
            $validator = Validator::make($request->all(), [
                'siswa_id' => 'required|exists:siswa,id',
                'dudi_id' => 'required|exists:dudi,id',
                'tanggal_mulai' => 'required|date',
                'tanggal_selesai' => 'required|date|after:tanggal_mulai',
                'status' => 'required|in:pending,diterima,ditolak,berlangsung,selesai,dibatalkan',
                'nilai_akhir' => 'nullable|numeric|min:0|max:100',
                'catatan' => 'nullable|string|max:500'
            ], [
                'siswa_id.required' => 'Pilih siswa wajib diisi',
                'siswa_id.exists' => 'Siswa yang dipilih tidak valid',
                'dudi_id.required' => 'Pilih DUDI wajib diisi',
                'dudi_id.exists' => 'DUDI yang dipilih tidak valid',
                'tanggal_selesai.after' => 'Tanggal selesai harus setelah tanggal mulai'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi data gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get guru_id dari user yang login
            $guru = Auth::user()->guru;
            if (!$guru) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data guru tidak ditemukan'
                ], 404);
            }

            // Cek apakah DUDI aktif
            $dudi = Dudi::find($request->dudi_id);
            if (!$dudi) {
                return response()->json([
                    'success' => false,
                    'message' => 'DUDI tidak ditemukan'
                ], 404);
            }

            if ($dudi->status !== 'aktif') {
                return response()->json([
                    'success' => false,
                    'message' => 'DUDI yang dipilih tidak aktif'
                ], 422);
            }

            // Cek apakah siswa sudah memiliki magang aktif
            $magangAktif = Magang::where('siswa_id', $request->siswa_id)
                ->whereIn('status', ['pending', 'diterima', 'berlangsung'])
                ->exists();

            if ($magangAktif) {
                return response()->json([
                    'success' => false,
                    'message' => 'Siswa sudah memiliki magang yang aktif'
                ], 422);
            }

            // CREATE DATA MAGANG
            $magang = Magang::create([
                'siswa_id' => $request->siswa_id,
                'dudi_id' => $request->dudi_id,
                'guru_id' => $guru->id,
                'tanggal_mulai' => $request->tanggal_mulai,
                'tanggal_selesai' => $request->tanggal_selesai,
                'status' => $request->status,
                'nilai_akhir' => $request->nilai_akhir,
                'catatan' => $request->catatan ?? null
            ]);

            // Load relasi untuk response
            $magang->load(['siswa', 'dudi', 'guru']);

            // ========== CLEAR CACHE SETELAH CREATE ==========
            $this->clearAllMagangCache();

            // ========== BROADCAST EVENT ==========
            event(new MagangUpdated($magang, 'created'));
            Log::info('MagangCreated event broadcasted', ['magang_id' => $magang->id]);

            DB::commit();

            Log::info('Magang created successfully:', ['magang_id' => $magang->id]);

            return response()->json([
                'success' => true,
                'message' => 'Data magang berhasil dibuat',
                'data' => $magang,
                'cache_cleared' => true
            ], 201);
        } catch (\Throwable $th) {
            DB::rollBack();

            Log::error('Error creating magang:', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat data magang: ' . $th->getMessage()
            ], 500);
        }
    }

    public function getMagangList(Request $request)
    {
        try {
            // Cache untuk list magang
            $cacheKey = 'magang:list:' . md5(json_encode($request->all()));
            $cacheDuration = 30; // 30 detik

            $magang = Cache::remember($cacheKey, $cacheDuration, function () {
                return Magang::with(['siswa', 'dudi', 'guru'])
                    ->orderBy('created_at', 'desc')
                    ->get();
            });

            return response()->json([
                'success' => true,
                'data' => $magang,
                'message' => 'Data magang berhasil diambil',
                'cached' => Cache::has($cacheKey)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getSiswaList()
    {
        try {
            // Cache untuk list siswa
            $cacheKey = 'magang:siswa';
            $cacheDuration = 60; // 1 menit

            $siswa = Cache::remember($cacheKey, $cacheDuration, function () {
                return Siswa::with(['user'])
                    ->select('id', 'user_id', 'nama', 'nis', 'kelas', 'jurusan', 'telepon', 'alamat')
                    ->orderBy('nama')
                    ->get()
                    ->map(function ($siswa) {
                        return [
                            'id' => $siswa->id,
                            'user_id' => $siswa->user_id,
                            'nama' => $siswa->nama,
                            'nis' => $siswa->nis,
                            'kelas' => $siswa->kelas,
                            'jurusan' => $siswa->jurusan,
                            'telepon' => $siswa->telepon,
                            'alamat' => $siswa->alamat,
                            'email' => $siswa->user->email ?? null
                        ];
                    });
            });

            return response()->json([
                'success' => true,
                'data' => $siswa,
                'cached' => Cache::has($cacheKey)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data siswa: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateMagang(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            Log::info('Update magang request:', ['id' => $id, 'data' => $request->all()]);

            // Validasi input
            $validator = Validator::make($request->all(), [
                'siswa_id' => 'sometimes|required|exists:siswa,id',
                'dudi_id' => 'required|exists:dudi,id',
                'tanggal_mulai' => 'required|date',
                'tanggal_selesai' => 'required|date|after:tanggal_mulai',
                'status' => 'required|in:pending,diterima,ditolak,berlangsung,selesai,dibatalkan',
                'nilai_akhir' => 'nullable|numeric|min:0|max:100',
                'catatan' => 'nullable|string|max:500',
            ], [
                'siswa_id.required' => 'Siswa wajib dipilih',
                'siswa_id.exists' => 'Siswa tidak valid',
                'dudi_id.required' => 'DUDI wajib dipilih',
                'dudi_id.exists' => 'DUDI tidak valid',
                'tanggal_mulai.required' => 'Tanggal mulai wajib diisi',
                'tanggal_mulai.date' => 'Format tanggal mulai tidak valid',
                'tanggal_selesai.required' => 'Tanggal selesai wajib diisi',
                'tanggal_selesai.date' => 'Format tanggal selesai tidak valid',
                'tanggal_selesai.after' => 'Tanggal selesai harus setelah tanggal mulai',
                'status.required' => 'Status wajib dipilih',
                'status.in' => 'Status tidak valid',
                'nilai_akhir.numeric' => 'Nilai akhir harus berupa angka',
                'nilai_akhir.min' => 'Nilai akhir minimal 0',
                'nilai_akhir.max' => 'Nilai akhir maksimal 100',
                'catatan.max' => 'Catatan maksimal 500 karakter',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Cari magang dengan relations
            $magang = Magang::with(['siswa', 'dudi', 'guru'])->find($id);
            if (!$magang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data magang tidak ditemukan'
                ], 404);
            }

            Log::info('Found magang:', ['magang_id' => $magang->id, 'current_status' => $magang->status]);

            // Validasi bisnis logic
            $errors = [];

            // Validasi: Nilai hanya bisa diisi jika status selesai
            if ($request->has('nilai_akhir') && $request->nilai_akhir !== null) {
                if ($request->status !== 'selesai') {
                    $errors['nilai_akhir'] = 'Nilai hanya dapat diberikan untuk magang dengan status selesai';
                }
            }

            // Validasi: Jika status diubah ke selesai, pastikan tanggal selesai sudah lewat
            if ($request->status === 'selesai' && $magang->status !== 'selesai') {
                $tanggalSelesai = \Carbon\Carbon::parse($request->tanggal_selesai);
                $hariIni = \Carbon\Carbon::now()->startOfDay();

                if ($tanggalSelesai->gt($hariIni)) {
                    $errors['status'] = 'Tidak dapat mengubah status ke selesai sebelum tanggal selesai';
                } else {
                    if (is_null($magang->verification_token)) {
                        $magang->verification_token = Str::uuid()->toString();
                    }
                }
            }

            // Validasi: Siswa tidak bisa diubah jika magang sudah berjalan
            $immutableStatuses = ['berlangsung', 'selesai', 'dibatalkan'];
            if ($request->has('siswa_id') && $request->siswa_id != $magang->siswa_id) {
                if (in_array($magang->status, $immutableStatuses)) {
                    $errors['siswa_id'] = 'Siswa tidak dapat diubah untuk magang dengan status ' . $magang->status;
                }
            }

            if (!empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi bisnis gagal',
                    'errors' => $errors
                ], 422);
            }

            // Prepare data untuk update
            $updateData = [
                'dudi_id' => $request->dudi_id,
                'tanggal_mulai' => $request->tanggal_mulai,
                'tanggal_selesai' => $request->tanggal_selesai,
                'status' => $request->status,
                'nilai_akhir' => $request->nilai_akhir,
            ];

            // Hanya update siswa_id jika diperbolehkan
            if ($request->has('siswa_id') && !isset($errors['siswa_id'])) {
                $updateData['siswa_id'] = $request->siswa_id;
            }

            // Update catatan
            if ($request->has('catatan')) {
                $updateData['catatan'] = $request->catatan;
            }

            // Jika token sudah ter-generate, masukkan ke updateData
            if (!is_null($magang->verification_token)) {
                $updateData['verification_token'] = $magang->verification_token;
            }

            Log::info('Updating magang with data:', $updateData);

            // Update data
            $magang->update($updateData);

            // ========== CLEAR CACHE SETELAH UPDATE ==========
            $this->clearAllMagangCache();

            DB::commit();

            // ========== BROADCAST EVENT SETELAH COMMIT ==========
            try {
                // Reload data terbaru
                $magang->refresh();
                $magang->load(['siswa', 'dudi', 'guru']);

                event(new MagangUpdated($magang, 'updated'));

                Log::info('MagangUpdated event broadcasted successfully', [
                    'magang_id' => $magang->id,
                    'action' => 'updated',
                    'new_status' => $magang->status
                ]);
            } catch (\Exception $broadcastError) {
                Log::error('Broadcast event failed but update was successful:', [
                    'magang_id' => $magang->id,
                    'error' => $broadcastError->getMessage()
                ]);
                // Jangan gagalkan response hanya karena broadcast error
            }

            return response()->json([
                'success' => true,
                'message' => 'Data magang berhasil diupdate',
                'data' => $magang,
                'cache_cleared' => true
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error updating magang:', [
                'magang_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan server: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteMagang($id)
    {
        DB::beginTransaction();

        try {
            // Cari magang dengan relations
            $magang = Magang::with(['siswa', 'dudi'])->find($id);
            if (!$magang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data magang tidak ditemukan'
                ], 404);
            }

            // Cek apakah magang bisa dihapus
            $protectedStatuses = ['berlangsung', 'selesai'];
            if (in_array($magang->status, $protectedStatuses)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Magang dengan status ' . $magang->status . ' tidak dapat dihapus'
                ], 422);
            }

            // Simpan data untuk broadcast sebelum delete
            $magangForBroadcast = clone $magang;
            $magangForBroadcast->load(['siswa', 'dudi']);

            // Hapus data terkait (logbooks, dll) jika ada
            if (method_exists($magang, 'logbooks')) {
                $magang->logbooks()->delete();
            }

            // Hapus magang
            $magang->delete();

            // ========== CLEAR CACHE SETELAH DELETE ==========
            $this->clearAllMagangCache();

            DB::commit();

            // ========== BROADCAST EVENT ==========
            try {
                event(new MagangUpdated($magangForBroadcast, 'deleted'));
                Log::info('MagangDeleted event broadcasted successfully', ['magang_id' => $id]);
            } catch (\Exception $broadcastError) {
                Log::error('Broadcast event failed but deletion was successful:', [
                    'magang_id' => $id,
                    'error' => $broadcastError->getMessage()
                ]);
            }

            Log::info('Magang deleted successfully:', ['magang_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Data magang berhasil dihapus',
                'cache_cleared' => true
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error deleting magang:', [
                'magang_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan server: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear cache manual untuk testing/debugging
     */
    public function clearCache()
    {
        try {
            $cleared = $this->clearAllMagangCache();

            return response()->json([
                'success' => $cleared,
                'message' => $cleared ? 'All magang cache cleared successfully' : 'Failed to clear cache',
                'timestamp' => now()->toDateTimeString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error clearing cache: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Broadcast test endpoint untuk debugging
     */
    public function testBroadcast($id)
    {
        try {
            $magang = Magang::with(['siswa', 'dudi'])->find($id);

            if (!$magang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Magang not found'
                ], 404);
            }

            // Test broadcast
            event(new MagangUpdated($magang, 'test'));

            return response()->json([
                'success' => true,
                'message' => 'Test broadcast sent',
                'data' => [
                    'magang_id' => $magang->id,
                    'event' => 'MagangUpdated',
                    'action' => 'test'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Broadcast test failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
