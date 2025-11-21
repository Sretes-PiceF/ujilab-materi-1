<?php

namespace App\Http\Controllers;

use App\Models\Magang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class MagangSiswaController extends Controller
{
    public function getMagangSiswa(Request $request)
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

            // Get data magang siswa dengan relasi
            $magang = Magang::with(['dudi', 'guru'])
                ->where('siswa_id', $siswa->id)
                ->whereIn('status', ['diterima', 'berlangsung', 'selesai'])
                ->first();

            if (!$magang) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => 'Belum memiliki magang aktif'
                ]);
            }

            // Format data response
            $data = [
                'id' => $magang->id,
                'status' => $magang->status,
                'nilai_akhir' => $magang->nilai_akhir,
                'tanggal_mulai' => $magang->tanggal_mulai ? $magang->tanggal_mulai->format('Y-m-d') : null,
                'tanggal_selesai' => $magang->tanggal_selesai ? $magang->tanggal_selesai->format('Y-m-d') : null,
                'siswa' => [
                    'nama' => $siswa->nama,
                    'nis' => $siswa->nis,
                    'kelas' => $siswa->kelas,
                    'jurusan' => $siswa->jurusan,
                ],
                'dudi' => [
                    'nama_perusahaan' => $magang->dudi->nama_perusahaan,
                    'alamat' => $magang->dudi->alamat,
                    'telepon' => $magang->dudi->telepon,
                    'email' => $magang->dudi->email,
                    'penanggung_jawab' => $magang->dudi->penanggung_jawab,
                ],
                'guru' => $magang->guru ? [
                    'nama' => $magang->guru->nama,
                    'nip' => $magang->guru->nip,
                ] : null
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Data magang berhasil diambil'
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getMagangSiswa: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data magang',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
