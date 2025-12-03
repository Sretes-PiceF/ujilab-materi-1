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
        'image_format',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
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
