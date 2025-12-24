<?php

use Illuminate\Support\Facades\Broadcast;


Broadcast::routes(['middleware' => ['auth:sanctum', 'cors']]);
// Public channel - anyone can listen

Broadcast::channel('guru.{id}', function ($user, $id) {
    // Hanya user dengan role guru/admin yang bisa listen
    return (int) $user->id === (int) $id &&
        $user->hasAnyRole(['guru', 'admin']);
});

Broadcast::channel('magang.public', function ($user) {
    // Semua yang terauthentikasi bisa listen
    return !is_null($user);
});

// Channel untuk user umum
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('magang', function () {
    return true;
});

Broadcast::channel('logbook', function () {
    return true;
});


// ✅ TAMBAHKAN CHANNEL UNTUK SISWA LOGBOOK
Broadcast::channel('siswa.logbook.{siswaId}', function ($user, $siswaId) {
    // Hanya siswa yang bersangkutan yang bisa listen channel-nya
    return $user->siswa && (int) $user->siswa->id === (int) $siswaId;
});

Broadcast::channel('siswa.user.{userId}', function ($user, $userId) {
    // Hanya user yang bersangkutan yang bisa listen
    return (int) $user->id === (int) $userId;
});

// Channel untuk notifikasi global siswa
Broadcast::channel('siswa.notifications', function ($user) {
    // Hanya user dengan role siswa yang bisa listen
    return $user->hasRole('siswa');
});

// Channel untuk semua logbook siswa (jika perlu monitoring)
Broadcast::channel('logbook.siswa.all', function ($user) {
    // Admin dan guru bisa monitor semua logbook siswa
    return $user->hasAnyRole(['admin', 'guru']);
});
