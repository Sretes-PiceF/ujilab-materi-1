<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class Dudi extends Model
{
    use HasFactory;

    protected $table = 'dudi';
    public $timestamps = true;
    protected $fillable = [
        'user_id',
        'nama_perusahaan',
        'alamat',
        'telepon',
        'email',
        'penanggung_jawab',
        'status'
    ];

    // ENUM values dari database
    const STATUS_AKTIF = 'aktif';
    const STATUS_NONAKTIF = 'nonaktif';
    const STATUS_PENDING = 'pending';

    public static function getStatuses()
    {
        return [
            self::STATUS_AKTIF,
            self::STATUS_NONAKTIF,
            self::STATUS_PENDING,
        ];
    }

    // Relationship dengan user
    public function magang()
    {
        return $this->hasMany(Magang::class, 'dudi_id');
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scope untuk status
    public function scopeAktif($query)
    {
        return $query->where('status', self::STATUS_AKTIF);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeNonaktif($query)
    {
        return $query->where('status', self::STATUS_NONAKTIF);
    }

    // ✅ BOOT METHOD - Auto broadcast events
    protected static function boot()
    {
        parent::boot();

        // Broadcast saat created
        static::created(function ($dudi) {
            Log::info('Dudi Created Event', ['id' => $dudi->id]);
            broadcast(new \App\Events\guru\dudi\DudiCreated($dudi))->toOthers();
        });

        // Broadcast saat updated
        static::updated(function ($dudi) {
            Log::info('Dudi Updated Event', ['id' => $dudi->id]);
            broadcast(new \App\Events\guru\dudi\DudiUpdated($dudi))->toOthers();
        });

        // Broadcast saat deleted
        static::deleted(function ($dudi) {
            Log::info('Dudi Deleted Event', ['id' => $dudi->id]);
            broadcast(new \App\Events\guru\dudi\DudiDeleted($dudi->id))->toOthers();
        });
    }
}
