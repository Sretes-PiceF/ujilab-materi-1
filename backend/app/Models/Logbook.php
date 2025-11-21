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
    ];

    protected $casts = [
        'tanggal' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

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