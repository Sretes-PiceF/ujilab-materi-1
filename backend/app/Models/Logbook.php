<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Logbook extends Model
{
    use HasFactory;

    protected $table = 'logbook';

    protected $fillable = [
        'magang_id',
        'tanggal',
        'kegiatan',
        'kendala',
        'file',
        'status_verifikasi',
        'catatan_guru',
        'catatan_dudi',
        'original_image',
        'thumbnail',
        'webp_image',
        'webp_thumbnail',
        'original_size',
        'optimized_size',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'original_size' => 'integer',
        'optimized_size' => 'integer',
    ];


    protected $appends = [
        'image_url',
        'original_image_url',
        'webp_image_url',
        'thumbnail_url',
        'webp_thumbnail_url',
        'best_image_url',
        'best_thumbnail_url',
    ];

    public function getImageUrlAttribute()
    {
        // Prioritize webp for modern browsers
        if ($this->webp_image && request()->header('Accept') && str_contains(request()->header('Accept'), 'image/webp')) {
            return asset('storage/' . $this->webp_image);
        }

        // Fallback to original image
        if ($this->original_image) {
            return asset('storage/' . $this->original_image);
        }

        // Legacy support
        return $this->file ? asset('storage/' . $this->file) : null;
    }

    /**
     * URL gambar terbaik (untuk frontend modern)
     */
    public function getBestImageUrlAttribute()
    {
        // Return WebP jika ada
        if ($this->webp_image) {
            return asset('storage/' . $this->webp_image);
        }

        // Fallback ke original
        if ($this->original_image) {
            return asset('storage/' . $this->original_image);
        }

        // Legacy
        return $this->file ? asset('storage/' . $this->file) : null;
    }

    /**
     * URL thumbnail terbaik
     */
    public function getBestThumbnailUrlAttribute()
    {
        // Prioritize WebP thumbnail
        if ($this->webp_thumbnail) {
            return asset('storage/' . $this->webp_thumbnail);
        }

        // Fallback ke regular thumbnail
        if ($this->thumbnail) {
            return asset('storage/' . $this->thumbnail);
        }

        // Fallback ke gambar utama
        return $this->getBestImageUrlAttribute();
    }

    // Add accessors for image URLs
    public function getOriginalImageUrlAttribute()
    {
        if ($this->original_image) {
            return asset('storage/' . $this->original_image);
        }
        return $this->file ? asset('storage/' . $this->file) : null;
    }

    public function getThumbnailUrlAttribute()
    {
        if ($this->thumbnail) {
            return asset('storage/' . $this->thumbnail);
        }
        return $this->getImageUrlAttribute();
    }

    public function getWebpImageUrlAttribute()
    {
        if ($this->webp_image) {
            return asset('storage/' . $this->webp_image);
        }
        return null;
    }

    public function getWebpThumbnailUrlAttribute()
    {
        if ($this->webp_thumbnail) {
            return asset('storage/' . $this->webp_thumbnail);
        }
        return null;
    }

    /**
     * Persentase penghematan
     */
    public function getCompressionPercentageAttribute()
    {
        if ($this->original_size && $this->optimized_size && $this->original_size > 0) {
            return round((($this->original_size - $this->optimized_size) / $this->original_size) * 100, 1);
        }
        return 0;
    }

    /**
     * Format file size untuk display
     */
    public function getOriginalSizeFormattedAttribute()
    {
        return $this->formatBytes($this->original_size);
    }

    public function getOptimizedSizeFormattedAttribute()
    {
        return $this->formatBytes($this->optimized_size);
    }

    private function formatBytes($bytes, $precision = 2)
    {
        if (!$bytes) return '0 Bytes';

        $units = ['Bytes', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }


    /**
     * Relasi ke tabel magang
     */
    public function magang()
    {
        return $this->belongsTo(Magang::class, 'magang_id');
    }

    /**
     * Accessor untuk mendapatkan data siswa melalui magang
     */
    public function getSiswaAttribute()
    {
        return $this->magang?->siswa;
    }

    /**
     * Accessor untuk mendapatkan data DUDI melalui magang
     */
    public function getDudiAttribute()
    {
        return $this->magang?->dudi;
    }

    /**
     * Scope untuk filter berdasarkan status verifikasi
     */
    public function scopeByStatus($query, $status)
    {
        if ($status && $status !== 'all') {
            return $query->where('status_verifikasi', $status);
        }
        return $query;
    }

    /**
     * Scope untuk pencarian
     */
    public function scopeSearch($query, $search)
    {
        if ($search) {
            return $query->whereHas('magang.siswa', function ($q) use ($search) {
                $q->where('nama', 'ILIKE', "%{$search}%");
            })
                ->orWhere('kegiatan', 'ILIKE', "%{$search}%")
                ->orWhere('kendala', 'ILIKE', "%{$search}%");
        }
        return $query;
    }
}
