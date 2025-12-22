<?php

namespace App\Http\Controllers;

use App\Events\guru\magang\MagangDeleted;
use App\Events\guru\magang\MagangUpdated;
use App\Models\Magang;
use App\Models\Dudi;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class MagangGuruController extends Controller
{
    private function clearAllMagangCache()
    {
        try {
            $userId = Auth::id() ?? 'guest';

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

            if (config('cache.default') === 'redis') {
                $redis = Cache::getRedis();
                $keys = $redis->keys('*magang*');
                foreach ($keys as $key) {
                    $cleanKey = str_replace(config('cache.prefix'), '', $key);
                    Cache::forget($cleanKey);
                }
            }

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getAllMagang()
    {
        try {
            $cacheKey = 'magang:stats';
            $cacheDuration = 30;

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
                'message' => 'Gagal mengambil data dashboard magang'
            ], 500);
        }
    }

    public function createMagang(Request $request)
    {
        DB::beginTransaction();

        try {
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

            $guru = Auth::user()->guru;
            if (!$guru) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data guru tidak ditemukan'
                ], 404);
            }

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

            $magangAktif = Magang::where('siswa_id', $request->siswa_id)
                ->whereIn('status', ['pending', 'diterima', 'berlangsung'])
                ->exists();

            if ($magangAktif) {
                return response()->json([
                    'success' => false,
                    'message' => 'Siswa sudah memiliki magang yang aktif'
                ], 422);
            }

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

            // ✅ LOAD RELATIONS LENGKAP SEBELUM BROADCAST
            $magang->load(['siswa.user', 'dudi', 'guru']);

            $this->clearAllMagangCache();

            // ✅ EVENT DENGAN ACTION 'created'
            event(new MagangUpdated($magang, 'created'));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data magang berhasil dibuat',
                'data' => $magang,
                'cache_cleared' => true
            ], 201);
        } catch (\Throwable $th) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat data magang'
            ], 500);
        }
    }

    public function getMagangList(Request $request)
    {
        try {
            $cacheKey = 'magang:list:' . md5(json_encode($request->all()));
            $cacheDuration = 30;

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
                'message' => 'Terjadi kesalahan'
            ], 500);
        }
    }

    public function getSiswaList()
    {
        try {
            $cacheKey = 'magang:siswa';
            $cacheDuration = 60;

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
                'message' => 'Gagal mengambil data siswa'
            ], 500);
        }
    }

    public function updateMagang(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $validationRules = [
                'siswa_id' => 'sometimes|required|exists:siswa,id',
                'dudi_id' => 'required|exists:dudi,id',
                'status' => 'required|in:pending,diterima,ditolak,berlangsung,selesai,dibatalkan',
                'nilai_akhir' => 'nullable|numeric|min:0|max:100',
                'catatan' => 'nullable|string|max:500',
            ];

            $status = $request->input('status');
            $requiresDates = in_array($status, ['diterima', 'berlangsung', 'selesai']);

            if ($requiresDates) {
                $validationRules['tanggal_mulai'] = 'required|date';
                $validationRules['tanggal_selesai'] = 'required|date|after:tanggal_mulai';
            } else {
                $validationRules['tanggal_mulai'] = 'nullable|date';
                $validationRules['tanggal_selesai'] = 'nullable|date|after_or_equal:tanggal_mulai';

                if ($request->filled('tanggal_mulai') && $request->filled('tanggal_selesai')) {
                    $validationRules['tanggal_selesai'] = 'date|after_or_equal:tanggal_mulai';
                }
            }

            $validator = Validator::make($request->all(), $validationRules, [
                'siswa_id.required' => 'Siswa wajib dipilih',
                'siswa_id.exists' => 'Siswa tidak valid',
                'dudi_id.required' => 'DUDI wajib dipilih',
                'dudi_id.exists' => 'DUDI tidak valid',
                'tanggal_mulai.required' => 'Tanggal mulai wajib diisi untuk status ini',
                'tanggal_mulai.date' => 'Format tanggal mulai tidak valid',
                'tanggal_selesai.required' => 'Tanggal selesai wajib diisi untuk status ini',
                'tanggal_selesai.date' => 'Format tanggal selesai tidak valid',
                'tanggal_selesai.after' => 'Tanggal selesai harus setelah tanggal mulai',
                'tanggal_selesai.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai',
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

            $magang = Magang::with(['siswa', 'dudi', 'guru'])->find($id);
            if (!$magang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data magang tidak ditemukan'
                ], 404);
            }

            $errors = [];

            if ($request->has('nilai_akhir') && $request->nilai_akhir !== null) {
                if ($request->status !== 'selesai') {
                    $errors['nilai_akhir'] = 'Nilai hanya dapat diberikan untuk magang dengan status selesai';
                }
            }

            if ($request->status === 'selesai' && $magang->status !== 'selesai') {
                if (!$request->filled('tanggal_selesai')) {
                    $errors['tanggal_selesai'] = 'Tanggal selesai wajib diisi untuk status selesai';
                } else {
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
            }

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

            $updateData = [
                'dudi_id' => $request->dudi_id,
                'status' => $request->status,
                'nilai_akhir' => $request->nilai_akhir,
            ];

            if (in_array($request->status, ['ditolak', 'dibatalkan', 'pending'])) {
                $updateData['tanggal_mulai'] = null;
                $updateData['tanggal_selesai'] = null;
            } else {
                $updateData['tanggal_mulai'] = $request->tanggal_mulai;
                $updateData['tanggal_selesai'] = $request->tanggal_selesai;
            }

            if ($request->has('siswa_id') && !isset($errors['siswa_id'])) {
                $updateData['siswa_id'] = $request->siswa_id;
            }

            if ($request->has('catatan')) {
                $updateData['catatan'] = $request->catatan;
            }

            if (!is_null($magang->verification_token)) {
                $updateData['verification_token'] = $magang->verification_token;
            }

            $magang->update($updateData);

            $this->clearAllMagangCache();

            DB::commit();

            // ✅ REFRESH DAN LOAD RELATIONS SEBELUM BROADCAST
            $magang->refresh();
            $magang->load(['siswa.user', 'dudi', 'guru']);

            event(new MagangUpdated($magang, 'updated'));

            return response()->json([
                'success' => true,
                'message' => 'Data magang berhasil diupdate',
                'data' => $magang,
                'cache_cleared' => true
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan server'
            ], 500);
        }
    }

    public function deleteMagang($id)
    {
        DB::beginTransaction();

        try {
            $magang = Magang::with(['siswa', 'dudi'])->find($id);
            if (!$magang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data magang tidak ditemukan'
                ], 404);
            }

            $protectedStatuses = ['berlangsung', 'selesai'];
            if (in_array($magang->status, $protectedStatuses)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Magang dengan status ' . $magang->status . ' tidak dapat dihapus'
                ], 422);
            }

            if (method_exists($magang, 'logbooks')) {
                $magang->logbooks()->delete();
            }

            $magang->delete();

            $this->clearAllMagangCache();

            DB::commit();

            event(new MagangDeleted($id));

            return response()->json([
                'success' => true,
                'message' => 'Data magang berhasil dihapus',
                'cache_cleared' => true,
                'broadcasted' => true
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan server'
            ], 500);
        }
    }

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
                'message' => 'Error clearing cache'
            ], 500);
        }
    }
}
