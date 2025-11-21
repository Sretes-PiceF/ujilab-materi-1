<?php

namespace App\Http\Controllers;

use App\Models\Dudi;
use App\Models\Magang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class DudiSiswaController extends Controller
{
    // app/Http/Controllers/DudiSiswaController.php
    // app/Http/Controllers/DudiSiswaController.php
    public function getDudiAktif(Request $request)
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

            // Cek apakah siswa sudah memiliki magang aktif
            $magangAktif = Magang::where('siswa_id', $siswa->id)
                ->whereIn('status', ['diterima', 'berlangsung'])
                ->first();

            $sudahPunyaMagangAktif = (bool) $magangAktif;

            // Hitung jumlah pendaftaran yang masih pending/diterima
            $jumlahPendaftaran = Magang::where('siswa_id', $siswa->id)
                ->whereIn('status', ['pending', 'diterima'])
                ->count();

            // Get DUDI aktif - TANPA FILTER KUOTA
            $dudiAktif = Dudi::where('status', 'aktif')
                ->withCount(['magang as kuota_terisi' => function ($query) {
                    $query->whereIn('status', ['diterima', 'berlangsung']);
                }])
                ->get()
                ->map(function ($dudi) use ($siswa) {
                    // Cek apakah siswa sudah mendaftar ke DUDI ini (dalam status apapun)
                    $sudahDaftar = Magang::where('siswa_id', $siswa->id)
                        ->where('dudi_id', $dudi->id)
                        ->whereIn('status', ['pending', 'diterima', 'berlangsung'])
                        ->exists();

                    // Default kuota (asumsi 10)
                    $kuotaTotal = 10;
                    $kuotaTerisi = $dudi->kuota_terisi;
                    $kuotaTersisa = $kuotaTotal - $kuotaTerisi;

                    return [
                        'id' => $dudi->id,
                        'nama_perusahaan' => $dudi->nama_perusahaan,
                        'alamat' => $dudi->alamat,
                        'telepon' => $dudi->telepon,
                        'email' => $dudi->email,
                        'penanggung_jawab' => $dudi->penanggung_jawab,
                        // Field dengan nilai default
                        'website' => null,
                        'bidang_usaha' => 'Perusahaan Mitra',
                        'deskripsi' => 'Perusahaan mitra magang siswa SMK Negeri 6 Malang',
                        'kuota' => [
                            'terisi' => $kuotaTerisi,
                            'total' => $kuotaTotal,
                            'tersisa' => $kuotaTersisa
                        ],
                        'fasilitas' => [],
                        'persyaratan' => [],
                        'sudah_daftar' => $sudahDaftar, // Ini yang penting untuk tombol
                        'status_dudi' => $dudi->status
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'dudi_aktif' => $dudiAktif,
                    'jumlah_pendaftaran' => $jumlahPendaftaran,
                    'maksimal_pendaftaran' => 3,
                    'bisa_daftar' => !$sudahPunyaMagangAktif && $jumlahPendaftaran < 3,
                    'sudah_punya_magang_aktif' => $sudahPunyaMagangAktif,
                    'magang_aktif' => $sudahPunyaMagangAktif ? [
                        'id' => $magangAktif->id,
                        'status' => $magangAktif->status,
                        'dudi' => [
                            'nama_perusahaan' => $magangAktif->dudi->nama_perusahaan ?? 'Tidak diketahui',
                            'bidang_usaha' => 'Perusahaan Mitra'
                        ]
                    ] : null
                ],
                'message' => $dudiAktif->isEmpty()
                    ? 'Tidak ada DUDI aktif yang tersedia'
                    : 'Data DUDI aktif berhasil diambil'
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getDudiAktif: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data DUDI',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $dudi = Dudi::where('status', 'aktif')
                ->withCount(['magang as kuota_terisi' => function ($query) {
                    $query->whereIn('status', ['diterima', 'berlangsung']);
                }])
                ->find($id);

            if (!$dudi) {
                return response()->json([
                    'success' => false,
                    'message' => 'DUDI tidak ditemukan atau tidak aktif'
                ], 404);
            }

            $user = Auth::user();
            $siswa = $user->siswa;

            // Cek apakah siswa sudah mendaftar ke DUDI ini
            $sudahDaftar = false;
            if ($siswa) {
                $sudahDaftar = Magang::where('siswa_id', $siswa->id)
                    ->where('dudi_id', $dudi->id)
                    ->exists();
            }

            $data = [
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
                'status_dudi' => $dudi->status
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Detail DUDI berhasil diambil'
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

            // Validasi
            $validator = Validator::make($request->all(), [
                'surat_pengantar' => 'required|string',
                'cv' => 'nullable|string',
                'portofolio' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Cek apakah DUDI aktif
            $dudi = Dudi::where('status', 'aktif')->find($dudi_id);

            if (!$dudi) {
                return response()->json([
                    'success' => false,
                    'message' => 'DUDI tidak ditemukan atau tidak aktif'
                ], 404);
            }

            // Cek kuota dengan menghitung siswa aktif
            $kuotaTerisi = Magang::where('dudi_id', $dudi_id)
                ->whereIn('status', ['diterima', 'berlangsung'])
                ->count();

            $kuotaTotal = 10; // Default kuota

            if ($kuotaTerisi >= $kuotaTotal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kuota magang di DUDI ini sudah penuh'
                ], 400);
            }

            // Cek apakah siswa sudah memiliki magang aktif
            $magangAktif = Magang::where('siswa_id', $siswa->id)
                ->whereIn('status', ['diterima', 'berlangsung'])
                ->first();

            if ($magangAktif) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah memiliki magang aktif'
                ], 400);
            }

            // Cek apakah sudah mendaftar ke DUDI ini (dalam status apapun)
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

            // Cek jumlah pendaftaran (maksimal 3)
            $jumlahPendaftaran = Magang::where('siswa_id', $siswa->id)
                ->whereIn('status', ['pending', 'diterima'])
                ->count();

            if ($jumlahPendaftaran >= 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah mencapai batas maksimal pendaftaran (3 DUDI)'
                ], 400);
            }

            // Buat pendaftaran magang
            $magang = Magang::create([
                'siswa_id' => $siswa->id,
                'dudi_id' => $dudi_id,
                'status' => 'pending',
                'surat_pengantar' => $request->surat_pengantar,
                'cv' => $request->cv,
                'portofolio' => $request->portofolio,
                'tanggal_daftar' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $magang->id,
                    'siswa_id' => $magang->siswa_id,
                    'dudi_id' => $magang->dudi_id,
                    'status' => $magang->status,
                    'tanggal_daftar' => $magang->tanggal_daftar->format('Y-m-d'),
                    'dudi' => [
                        'nama_perusahaan' => $dudi->nama_perusahaan,
                        'bidang_usaha' => 'Perusahaan Mitra'
                    ]
                ],
                'message' => 'Pendaftaran magang berhasil dikirim'
            ]);
        } catch (\Exception $e) {
            Log::error('Error in store magang: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim pendaftaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
