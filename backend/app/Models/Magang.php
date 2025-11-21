<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Magang extends Model
{
    use HasFactory;

    protected $table = 'magang';
    public $timestamps = true;
    protected $fillable = [
        'siswa_id',
        'dudi_id',
        'guru_id',
        'status',
        'nilai_akhir',
        'tanggal_mulai',
        'tanggal_selesai'
    ];

    // ENUM values dari database
    const STATUS_PENDING = 'pending';
    const STATUS_DITERIMA = 'diterima';
    const STATUS_DITOLAK = 'ditolak';
    const STATUS_BERLANGSUNG = 'berlangsung';
    const STATUS_SELESAI = 'selesai';
    const STATUS_DIBATALKAN = 'dibatalkan';

    public static function getStatuses()
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_DITERIMA,
            self::STATUS_DITOLAK,
            self::STATUS_BERLANGSUNG,
            self::STATUS_SELESAI,
            self::STATUS_DIBATALKAN,
        ];
    }

    // Relationships
    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }

    public function dudi()
    {
        return $this->belongsTo(Dudi::class);
    }

    public function guru()
    {
        return $this->belongsTo(Guru::class);
    }

    public function logbooks()
    {
        return $this->hasMany(Logbook::class);
    }
    
}