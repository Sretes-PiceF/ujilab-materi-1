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
