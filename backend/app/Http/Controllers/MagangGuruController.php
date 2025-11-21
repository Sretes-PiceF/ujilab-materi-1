<?php

namespace App\Http\Controllers;

use App\Models\Magang;
use App\Http\Requests\StoreMagangRequest;
use App\Http\Requests\UpdateMagangRequest;
use App\Models\Dudi;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MagangGuruController extends Controller
{
    public function getAllMagang ()
    {
        try {
        // TOTAL SISWA MAGANG - semua siswa yang pernah magang
        $totalSiswa = Magang::distinct('siswa_id')->count('siswa_id');
        
        // SISWA DENGAN STATUS MAGANG AKTIF (berlangsung)
        $siswaAktif = Magang::where('status', 'berlangsung')->count();
        
        // SISWA DENGAN STATUS MAGANG SELESAI
        $siswaSelesai = Magang::where('status', 'selesai')->count();
        
        // SISWA DENGAN STATUS PENDING (menunggu penempatan)
        $siswaPending = Magang::where('status', 'pending')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_siswa' => $totalSiswa,
                'aktif' => $siswaAktif,
                'selesai' => $siswaSelesai,
                'pending' => $siswaPending
            ]
        ], 200);
    } catch (\Throwable $th) {
        return response()->json([
            'success' => false,
            'message' => 'Gagal mengambil data dashboard magang',
            'error' => $th->getMessage()
        ], 500);
    }
    }

   // MagangGuruController.php
 public function createMagang(Request $request)
    {
        DB::beginTransaction();
        
        try {
            Log::info('Data received for magang creation:', $request->all());

            // Validasi data
            $validator = Validator::make($request->all(), [
                // Data siswa (pilih dari dropdown)
                'siswa_id' => 'required|exists:siswa,id',
                
                // Data magang
                'dudi_id' => 'required|exists:dudi,id',
                'tanggal_mulai' => 'required|date',
                'tanggal_selesai' => 'required|date|after:tanggal_mulai',
                'status' => 'required|in:pending,diterima,ditolak,berlangsung,selesai,dibatalkan',
                'nilai_akhir' => 'nullable|numeric|min:0|max:100'
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
                'nilai_akhir' => $request->nilai_akhir
            ]);

            // Load relasi untuk response
            $magang->load(['siswa', 'dudi', 'guru']);

            DB::commit();

            Log::info('Magang created successfully:', ['magang_id' => $magang->id]);

            return response()->json([
                'success' => true,
                'message' => 'Data magang berhasil dibuat',
                'data' => $magang
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
            // Query data magang
            $magang = Magang::with(['siswa', 'dudi', 'guru']) // Sesuaikan relasi
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $magang,
                'message' => 'Data magang berhasil diambil'
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
            $siswa = Siswa::with(['user']) // Sesuaikan dengan relasi Anda
                ->select('id', 'user_id', 'nama', 'nis', 'kelas', 'jurusan', 'telepon', 'alamat')
                ->orderBy('nama')
                ->get()
                ->map(function ($siswa) {
                    return [
                        'id' => $siswa->id,
                        'nama' => $siswa->nama,
                        'nis' => $siswa->nis,
                        'kelas' => $siswa->kelas,
                        'jurusan' => $siswa->jurusan,
                        'telepon' => $siswa->telepon,
                        'alamat' => $siswa->alamat,
                        'email' => $siswa->user->email ?? null
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $siswa
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
        try {
            DB::beginTransaction();

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

            // Cari magang
            $magang = Magang::find($id);
            if (!$magang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data magang tidak ditemukan'
                ], 404);
            }

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
                if ($tanggalSelesai->isFuture()) {
                    $errors['status'] = 'Tidak dapat mengubah status ke selesai sebelum tanggal selesai';
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

            // Update catatan jika ada field di database
            if ($request->has('catatan')) {
                // Jika ada field catatan di model, uncomment line berikut:
                // $updateData['catatan'] = $request->catatan;
            }

            // Update data
            $magang->update($updateData);

            DB::commit();

            // Load relasi untuk response
            $magang->load(['siswa', 'dudi', 'guru']);

            return response()->json([
                'success' => true,
                'message' => 'Data magang berhasil diupdate',
                'data' => $magang
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan server',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function deleteMagang($id) {
    try {
            DB::beginTransaction();

            // Cari magang
            $magang = Magang::find($id);
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

            // Hapus data terkait (logbooks, dll) jika ada
            $magang->logbooks()->delete();

            // Hapus magang
            $magang->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data magang berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan server',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}