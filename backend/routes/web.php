<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MagangSiswaController;
use App\Http\Controllers\VerifikasiController;
use App\Http\Middleware\SiswaMiddleware;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

require __DIR__ . '/auth.php';

Route::get('/verifikasi/magang/{token}', [VerifikasiController::class, 'viewPublic'])->name('verifikasi.magang.public');
Route::get('/verifikasi/pdf/{token}', [VerifikasiController::class, 'generatePdfPublic'])->name('verifikasi.pdf.public');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::middleware(SiswaMiddleware::class)->group(function () {
        Route::get('pdf', [MagangSiswaController::class, 'generateLaporanMagangPdf']);
    });
});
