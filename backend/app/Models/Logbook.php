<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

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

    // ========================================
    // ACCESSORS FOR IMAGE URLS
    // ========================================

    public function getImageUrlAttribute()
    {
        if ($this->webp_image && request()->header('Accept') && str_contains(request()->header('Accept'), 'image/webp')) {
            return asset('storage/' . $this->webp_image);
        }

        if ($this->original_image) {
            return asset('storage/' . $this->original_image);
        }

        return $this->file ? asset('storage/' . $this->file) : null;
    }

    public function getBestImageUrlAttribute()
    {
        if ($this->webp_image) {
            return asset('storage/' . $this->webp_image);
        }

        if ($this->original_image) {
            return asset('storage/' . $this->original_image);
        }

        return $this->file ? asset('storage/' . $this->file) : null;
    }

    public function getBestThumbnailUrlAttribute()
    {
        if ($this->webp_thumbnail) {
            return asset('storage/' . $this->webp_thumbnail);
        }

        if ($this->thumbnail) {
            return asset('storage/' . $this->thumbnail);
        }

        return $this->getBestImageUrlAttribute();
    }

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

    // ========================================
    // FILE SIZE HELPERS
    // ========================================

    public function getCompressionPercentageAttribute()
    {
        if ($this->original_size && $this->optimized_size && $this->original_size > 0) {
            return round((($this->original_size - $this->optimized_size) / $this->original_size) * 100, 1);
        }
        return 0;
    }

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

    // ========================================
    // RELATIONSHIPS
    // ========================================

    public function magang()
    {
        return $this->belongsTo(Magang::class, 'magang_id');
    }

    public function getSiswaAttribute()
    {
        return $this->magang?->siswa;
    }

    public function getDudiAttribute()
    {
        return $this->magang?->dudi;
    }

    // ========================================
    // SCOPES
    // ========================================

    public function scopeByStatus($query, $status)
    {
        if ($status && $status !== 'all') {
            return $query->where('status_verifikasi', $status);
        }
        return $query;
    }

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

    // ========================================
    // BOOT METHOD - AUTO BROADCAST
    // ========================================

    protected static function boot()
    {
        parent::boot();

        // Broadcast saat created
        static::created(function ($logbook) {
            try {
                $logbook->load(['magang.siswa.user', 'magang.dudi']);
                broadcast(new \App\Events\guru\logbook\LogbookUpdated($logbook, 'created'))->toOthers();

                // Auto-invalidate cache
                \App\Http\Controllers\Api\LogbookController::invalidateCache();
            } catch (\Exception $e) {
                Log::error('Logbook Broadcast created failed: ' . $e->getMessage());
            }
        });

        // Broadcast saat updated
        static::updated(function ($logbook) {
            try {
                $logbook->load(['magang.siswa.user', 'magang.dudi']);
                broadcast(new \App\Events\guru\logbook\LogbookUpdated($logbook, 'updated'))->toOthers();

                // Auto-invalidate cache
                \App\Http\Controllers\Api\LogbookController::invalidateCache();
            } catch (\Exception $e) {
                Log::error('Logbook Broadcast updated failed: ' . $e->getMessage());
            }
        });

        // Broadcast saat deleted
        static::deleted(function ($logbook) {
            try {
                broadcast(new \App\Events\guru\logbook\LogbookDeleted($logbook->id))->toOthers();

                // Auto-invalidate cache
                \App\Http\Controllers\Api\LogbookController::invalidateCache();
            } catch (\Exception $e) {
                Log::error('Logbook Broadcast deleted failed: ' . $e->getMessage());
            }
        });
    }
}
