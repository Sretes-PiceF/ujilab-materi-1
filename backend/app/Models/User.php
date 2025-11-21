<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // ENUM values dari database
    const ROLE_ADMIN = 'admin';
    const ROLE_SISWA = 'siswa';
    const ROLE_GURU = 'guru';
    const ROLE_DUDI = 'dudi';

    public static function getRoles()
    {
        return [
            self::ROLE_ADMIN,
            self::ROLE_SISWA,
            self::ROLE_GURU,
            self::ROLE_DUDI,
        ];
    }
    

    // Relationships
    public function siswa()
    {
        return $this->hasOne(Siswa::class, 'user_id');
    }

    public function guru()
    {
        return $this->hasOne(Guru::class);
    }

    public function dudi()
    {
        return $this->hasOne(Dudi::class);
    }

    // Role checks
    public function isSiswa()
    {
        return $this->role === self::ROLE_SISWA;
    }

    public function isGuru()
    {
        return $this->role === self::ROLE_GURU;
    }

    public function isDudi()
    {
        return $this->role === self::ROLE_DUDI;
    }

    public function isAdmin()
    {
        return $this->role === self::ROLE_ADMIN;
    }
}