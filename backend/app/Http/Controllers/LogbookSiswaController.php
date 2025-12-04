<?php

namespace App\Http\Controllers;

use App\Models\Logbook;
use App\Models\Magang;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class LogbookSiswaController extends Controller
{

    private function getActiveMagang()
    {
        $siswa = Auth::user()->siswa;

        if (!$siswa) {
            return null;
        }

        // Cari magang dengan status 'berlangsung'
        $magang = Magang::where('siswa_id', $siswa->id)
            ->where('status', 'berlangsung')
            ->first();

        return $magang;
    }

    // app/Http/Controllers/LogbookSiswaController.php
    public function getStatusMagang()
    {
        try {
            $siswa = Auth::user()->siswa;

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            // Cari magang terbaru siswa
            $latestMagang = Magang::where('siswa_id', $siswa->id)
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$latestMagang) {
                // Jika tidak ada data magang sama sekali
                return response()->json([
                    'success' => true,
                    'data' => [
                        'status_magang' => 'pending', // atau status default sesuai bisnis logic
                        'has_magang' => false,
                        'magang' => null
                    ],
                    'message' => 'Belum memiliki data magang'
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
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
                ],
                'message' => 'Status magang berhasil diambil'
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
            $siswa = Auth::user()->siswa;

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            $perPage = $request->input('per_page', 10);
            $search = $request->input('search', '');
            $status = $request->input('status', 'all');

            // Ambil semua logbook berdasarkan magang siswa
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

            // Transform data
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

            return response()->json([
                'success' => true,
                'data' => $logbooks->items(),
                'meta' => [
                    'current_page' => $logbooks->currentPage(),
                    'last_page' => $logbooks->lastPage(),
                    'per_page' => $logbooks->perPage(),
                    'total' => $logbooks->total(),
                    'from' => $logbooks->firstItem(),
                    'to' => $logbooks->lastItem(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data logbook',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function store(Request $request)
    {
        Log::info('=== LOGBOOK STORE START ===');

        try {
            // Cek apakah siswa memiliki magang aktif
            $magang = $this->getActiveMagang();

            if (!$magang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki magang aktif.'
                ], 403);
            }

            // Validasi input DENGAN 3 FILE
            $validator = Validator::make($request->all(), [
                'tanggal' => 'required|date|before_or_equal:today',
                'kegiatan' => 'required|string|min:10',
                'kendala' => 'required|string|min:5',
                'file' => 'nullable|image|mimes:jpeg,jpg,png|max:5120', // JPG dari frontend
                'webp_image' => 'nullable|mimes:webp|max:5120',        // WebP dari frontend
                'webp_thumbnail' => 'nullable|mimes:webp|max:2048',    // Thumbnail WebP
                'original_size' => 'nullable|integer',                  // Metadata
                'compressed_size' => 'nullable|integer',                // Metadata
                'webp_size' => 'nullable|integer',                      // Metadata
                'thumbnail_size' => 'nullable|integer',                 // Metadata
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Cek duplikat tanggal
            $existingLogbook = Logbook::where('magang_id', $magang->id)
                ->whereDate('tanggal', $request->tanggal)
                ->first();

            if ($existingLogbook) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah membuat logbook untuk tanggal ini'
                ], 422);
            }

            // Data logbook dasar
            $logbookData = [
                'magang_id' => $magang->id,
                'tanggal' => $request->tanggal,
                'kegiatan' => $request->kegiatan,
                'kendala' => $request->kendala,
                'status_verifikasi' => 'pending',
                'original_size' => $request->original_size ?? 0,
                'optimized_size' => $request->compressed_size ?? 0,
            ];

            // Generate unique base filename
            $timestamp = time();
            $randomString = Str::random(10);
            $baseFilename = 'logbook_' . $timestamp . '_' . $randomString;

            $directory = 'logbook';

            Log::info('Base filename: ' . $baseFilename);

            // Handle upload MULTIPLE FILES
            $hasAnyFile = $request->hasFile('file') ||
                $request->hasFile('webp_image') ||
                $request->hasFile('webp_thumbnail');

            if ($hasAnyFile) {
                Log::info('Processing image uploads (multi-format)');

                // 1. Simpan file JPG (dari field 'file' - untuk kompatibilitas)
                if ($request->hasFile('file')) {
                    $file = $request->file('file');
                    $fileExtension = strtolower($file->getClientOriginalExtension());

                    // Jika JPG/PNG dari frontend
                    if (in_array($fileExtension, ['jpg', 'jpeg', 'png'])) {
                        $mainFileName = $baseFilename . '.jpg';
                        $mainFilePath = $file->storeAs($directory, $mainFileName, 'public');

                        $logbookData['file'] = $mainFilePath; // Legacy: 'file' column
                        $logbookData['original_image'] = $mainFilePath; // 'original_image' column

                        Log::info('JPG/PNG saved as: ' . $mainFilePath);
                    }
                }

                // 2. Simpan WebP image (utama)
                if ($request->hasFile('webp_image')) {
                    $webpFile = $request->file('webp_image');
                    $webpFilename = $baseFilename . '.webp';
                    $webpPath = $webpFile->storeAs($directory, $webpFilename, 'public');
                    $logbookData['webp_image'] = $webpPath;

                    Log::info('WebP image saved: ' . $webpPath);

                    // Jika belum ada JPG, gunakan WebP sebagai fallback
                    if (!isset($logbookData['file'])) {
                        $logbookData['file'] = $webpPath;
                        $logbookData['original_image'] = $webpPath;
                    }
                }

                // 3. Simpan WebP thumbnail
                if ($request->hasFile('webp_thumbnail')) {
                    $thumbnailFile = $request->file('webp_thumbnail');
                    $thumbnailFilename = $baseFilename . '_thumbnail.webp';
                    $thumbnailPath = $thumbnailFile->storeAs($directory, $thumbnailFilename, 'public');
                    $logbookData['webp_thumbnail'] = $thumbnailPath; // 'webp_thumbnail' column

                    Log::info('WebP thumbnail saved: ' . $thumbnailPath);
                }
                // Jika tidak ada thumbnail khusus, buat dari webp_image
                elseif (isset($logbookData['webp_image'])) {
                    // Simpan path yang sama untuk thumbnail (tidak ideal tapi kompatibel)
                    $logbookData['webp_thumbnail'] = $logbookData['webp_image'];
                }

                // Verifikasi file tersimpan
                $filesToCheck = array_filter([
                    $logbookData['file'] ?? null,
                    $logbookData['webp_image'] ?? null,
                ]);

                foreach ($filesToCheck as $filePath) {
                    if ($filePath && !Storage::disk('public')->exists($filePath)) {
                        Log::error('File not found: ' . $filePath);
                        throw new \Exception('File tidak tersimpan dengan benar: ' . $filePath);
                    }
                }

                Log::info('Image processing completed');
            } else {
                Log::info('No images uploaded');
            }

            // Simpan logbook ke database
            Log::info('Saving logbook to database');
            $logbook = Logbook::create($logbookData);
            Log::info('Logbook saved with ID: ' . $logbook->id);

            // Return response dengan SEMUA data
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

                    // File paths
                    'file' => $logbook->file,
                    'original_image' => $logbook->original_image,
                    'webp_image' => $logbook->webp_image,
                    'webp_thumbnail' => $logbook->webp_thumbnail,

                    // URLs
                    'file_url' => $logbook->file ? url('storage/' . $logbook->file) : null,
                    'original_image_url' => $logbook->original_image ? url('storage/' . $logbook->original_image) : null,
                    'webp_image_url' => $logbook->webp_image ? url('storage/' . $logbook->webp_image) : null,
                    'thumbnail_url' => $logbook->thumbnail ? url('storage/' . $logbook->thumbnail) : null,
                    'webp_thumbnail_url' => $logbook->webp_thumbnail ? url('storage/' . $logbook->webp_thumbnail) : null,

                    // Metadata
                    'original_size' => $logbook->original_size,
                    'optimized_size' => $logbook->optimized_size,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Logbook store error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan logbook: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tampilkan detail logbook
     */
    public function show($id)
    {
        try {
            $siswa = Auth::user()->siswa;

            $logbook = Logbook::whereHas('magang', function ($query) use ($siswa) {
                $query->where('siswa_id', $siswa->id);
            })
                ->with(['magang.dudi'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
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
                ]
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
            $siswa = Auth::user()->siswa;

            // Cari logbook milik siswa
            $logbook = Logbook::whereHas('magang', function ($query) use ($siswa) {
                $query->where('siswa_id', $siswa->id);
            })->findOrFail($id);

            // Cek apakah logbook masih bisa diedit (hanya yang pending)
            if ($logbook->status_verifikasi !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Logbook yang sudah diverifikasi tidak dapat diedit'
                ], 403);
            }

            // ✅ PERBAIKAN: Semua field OPTIONAL untuk update
            $validator = Validator::make($request->all(), [
                'tanggal' => 'nullable|date|before_or_equal:today',
                'kegiatan' => 'nullable|string|min:10',
                'kendala' => 'nullable|string|min:5',
                'file' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            ], [
                'tanggal.date' => 'Format tanggal tidak valid',
                'tanggal.before_or_equal' => 'Tanggal tidak boleh melebihi hari ini',
                'kegiatan.min' => 'Kegiatan minimal 10 karakter',
                'kendala.min' => 'Kendala minimal 5 karakter',
                'file.image' => 'File harus berupa gambar',
                'file.mimes' => 'File harus berformat JPEG, JPG, atau PNG',
                'file.max' => 'Ukuran file maksimal 2MB',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // ✅ PERBAIKAN: Hanya update field yang dikirim
            $updateData = [];

            if ($request->has('tanggal')) {
                $updateData['tanggal'] = $request->tanggal;
            }

            if ($request->has('kegiatan')) {
                $updateData['kegiatan'] = trim($request->kegiatan);
            }

            if ($request->has('kendala')) {
                $updateData['kendala'] = trim($request->kendala);
            }

            // Handle upload file baru
            if ($request->hasFile('file')) {
                // Hapus file lama jika ada
                if ($logbook->file && Storage::disk('public')->exists($logbook->file)) {
                    Storage::disk('public')->delete($logbook->file);
                }

                $file = $request->file('file');
                $fileName = 'logbook_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $filePath = $file->storeAs('logbook', $fileName, 'public');
                $updateData['file'] = $filePath;
            }

            // Update hanya field yang ada
            if (!empty($updateData)) {
                $logbook->update($updateData);
            }

            // Reload dengan relasi
            $logbook->load('magang.siswa.user', 'magang.dudi');

            return response()->json([
                'success' => true,
                'message' => 'Logbook berhasil diupdate',
                'data' => $logbook
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
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Hapus logbook (hanya jika status masih pending)
     */
    public function destroy($id)
    {
        try {
            $siswa = Auth::user()->siswa;

            // Cari logbook milik siswa
            $logbook = Logbook::whereHas('magang', function ($query) use ($siswa) {
                $query->where('siswa_id', $siswa->id);
            })
                ->findOrFail($id);

            // Cek apakah logbook masih bisa dihapus (hanya yang pending)
            if ($logbook->status_verifikasi !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Logbook yang sudah diverifikasi tidak dapat dihapus'
                ], 403);
            }

            // Hapus file jika ada
            if ($logbook->file && Storage::disk('public')->exists($logbook->file)) {
                Storage::disk('public')->delete($logbook->file);
            }

            $logbook->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logbook berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus logbook',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
