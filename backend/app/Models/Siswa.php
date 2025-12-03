<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Siswa extends Model
{
    use HasFactory;
    protected $table = 'siswa';
    public $timestamps = true;
    protected $fillable = [
        'user_id',
        'nama',
        'nis',
        'kelas',
        'jurusan',
        'alamat',
        'telepon'
    ];

    // ✅ TAMBAHKAN INI - Accessor untuk email
    protected $appends = ['email'];

    public function getEmailAttribute()
    {
        return $this->user->email ?? null;
    }

    // Relationship dengan user
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function magang()
    {
        return $this->hasMany(Magang::class);
    }
}
