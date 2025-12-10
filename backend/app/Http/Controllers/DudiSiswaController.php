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

            // ===== PENGECEKAN MAGANG SELESAI (BARU) =====
            $magangSelesai = Magang::where('siswa_id', $siswa->id)
                ->where('status', 'selesai')
                ->with('dudi')
                ->first();

            $sudahPernahMagang = (bool) $magangSelesai;

            // ===== PENGECEKAN MAGANG AKTIF =====
            $magangAktif = Magang::where('siswa_id', $siswa->id)
                ->whereIn('status', ['diterima', 'berlangsung'])
                ->with('dudi')
                ->first();

            $sudahPunyaMagangAktif = (bool) $magangAktif;

            // Hitung jumlah pendaftaran yang masih pending/diterima
            $jumlahPendaftaran = Magang::where('siswa_id', $siswa->id)
                ->whereIn('status', ['pending', 'diterima'])
                ->count();

            // ===== LOGIKA BISA DAFTAR (DIPERBARUI) =====
            // Siswa bisa daftar jika:
            // 1. BELUM PERNAH SELESAI MAGANG (paling penting!)
            // 2. Tidak punya magang aktif
            // 3. Belum mencapai batas maksimal pendaftaran (3)
            $bisaDaftar = !$sudahPernahMagang
                && !$sudahPunyaMagangAktif
                && $jumlahPendaftaran < 3;

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
                        'sudah_daftar' => $sudahDaftar,
                        'status_dudi' => $dudi->status
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'dudi_aktif' => $dudiAktif,
                    'jumlah_pendaftaran' => $jumlahPendaftaran,
                    'maksimal_pendaftaran' => 3,
                    'bisa_daftar' => $bisaDaftar,

                    // Info magang aktif
                    'sudah_punya_magang_aktif' => $sudahPunyaMagangAktif,
                    'magang_aktif' => $sudahPunyaMagangAktif ? [
                        'id' => $magangAktif->id,
                        'status' => $magangAktif->status,
                        'tanggal_mulai' => $magangAktif->tanggal_mulai,
                        'tanggal_selesai' => $magangAktif->tanggal_selesai,
                        'dudi' => [
                            'nama_perusahaan' => $magangAktif->dudi->nama_perusahaan ?? 'Tidak diketahui',
                            'bidang_usaha' => 'Perusahaan Mitra'
                        ]
                    ] : null,

                    // ===== INFO MAGANG SELESAI (BARU) =====
                    'sudah_pernah_magang' => $sudahPernahMagang,
                    'magang_selesai' => $sudahPernahMagang ? [
                        'id' => $magangSelesai->id,
                        'status' => $magangSelesai->status,
                        'tanggal_mulai' => $magangSelesai->tanggal_mulai,
                        'tanggal_selesai' => $magangSelesai->tanggal_selesai,
                        'nilai_akhir' => $magangSelesai->nilai_akhir,
                        'dudi' => [
                            'nama_perusahaan' => $magangSelesai->dudi->nama_perusahaan ?? 'Tidak diketahui',
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
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
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

            // ===== VALIDASI 1: CEK SUDAH PERNAH MAGANG SELESAI (PRIORITAS TERTINGGI) =====
            $sudahPernahMagang = Magang::where('siswa_id', $siswa->id)
                ->where('status', 'selesai')
                ->exists();

            if ($sudahPernahMagang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah pernah menyelesaikan magang dan tidak dapat mendaftar lagi. Setiap siswa hanya diperbolehkan magang satu kali.'
                ], 403); // 403 Forbidden
            }

            // ===== VALIDASI 2: CEK DUDI AKTIF =====
            $dudi = Dudi::where('status', 'aktif')->find($dudi_id);

            if (!$dudi) {
                return response()->json([
                    'success' => false,
                    'message' => 'DUDI tidak ditemukan atau tidak aktif'
                ], 404);
            }

            // ===== VALIDASI 3: CEK KUOTA DUDI =====
            $kuotaTerisi = Magang::where('dudi_id', $dudi_id)
                ->whereIn('status', [Magang::STATUS_DITERIMA, Magang::STATUS_BERLANGSUNG])
                ->count();

            $kuotaTotal = 10; // Default kuota

            if ($kuotaTerisi >= $kuotaTotal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kuota magang di DUDI ini sudah penuh'
                ], 400);
            }

            // ===== VALIDASI 4: CEK MAGANG AKTIF =====
            $magangAktif = Magang::where('siswa_id', $siswa->id)
                ->whereIn('status', [Magang::STATUS_DITERIMA, Magang::STATUS_BERLANGSUNG])
                ->first();

            if ($magangAktif) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah memiliki magang aktif di ' . ($magangAktif->dudi->nama_perusahaan ?? 'perusahaan lain')
                ], 400);
            }

            // ===== VALIDASI 5: CEK SUDAH DAFTAR KE DUDI INI =====
            $sudahDaftar = Magang::where('siswa_id', $siswa->id)
                ->where('dudi_id', $dudi_id)
                ->whereIn('status', [Magang::STATUS_PENDING, Magang::STATUS_DITERIMA, Magang::STATUS_BERLANGSUNG])
                ->exists();

            if ($sudahDaftar) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah mendaftar ke DUDI ini'
                ], 400);
            }

            // ===== VALIDASI 6: CEK BATAS MAKSIMAL PENDAFTARAN =====
            $jumlahPendaftaran = Magang::where('siswa_id', $siswa->id)
                ->whereIn('status', [Magang::STATUS_PENDING, Magang::STATUS_DITERIMA])
                ->count();

            if ($jumlahPendaftaran >= 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah mencapai batas maksimal pendaftaran (3 DUDI)'
                ], 400);
            }

            // ===== SEMUA VALIDASI LOLOS, BUAT PENDAFTARAN =====
            $magang = Magang::create([
                'siswa_id' => $siswa->id,
                'dudi_id' => $dudi_id,
                'guru_id' => null, // Akan di-assign nanti
                'status' => Magang::STATUS_PENDING,
                'nilai_akhir' => null,
                'tanggal_mulai' => null,
                'tanggal_selesai' => null,
            ]);

            // Refresh model
            $magang->refresh();

            // Log aktivitas
            Log::info('Pendaftaran magang baru', [
                'siswa_id' => $siswa->id,
                'dudi_id' => $dudi_id,
                'magang_id' => $magang->id,
                'nama_siswa' => $siswa->nama ?? $user->name,
                'nama_dudi' => $dudi->nama_perusahaan
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $magang->id,
                    'siswa_id' => $magang->siswa_id,
                    'dudi_id' => $magang->dudi_id,
                    'status' => $magang->status,
                    'tanggal_daftar' => $magang->created_at->format('Y-m-d H:i:s'),
                    'dudi' => [
                        'nama_perusahaan' => $dudi->nama_perusahaan,
                        'bidang_usaha' => $dudi->bidang_usaha ?? 'Perusahaan Mitra',
                        'alamat' => $dudi->alamat,
                        'penanggung_jawab' => $dudi->penanggung_jawab
                    ]
                ],
                'message' => 'Pendaftaran magang berhasil dikirim. Menunggu verifikasi dari perusahaan.'
            ], 201); // 201 Created

        } catch (\Exception $e) {
            Log::error('Error in store magang: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            Log::error('Request data: ' . json_encode([
                'dudi_id' => $dudi_id,
                'user_id' => Auth::id()
            ]));

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim pendaftaran',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
