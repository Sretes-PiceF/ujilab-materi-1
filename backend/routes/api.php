<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DudiGuruController;
use App\Http\Controllers\DudiSiswaController;
use App\Http\Controllers\LogbookGuruController;
use App\Http\Controllers\LogbookSiswaController;
use App\Http\Controllers\MagangGuruController;
use App\Http\Controllers\SiswaController;
use App\Http\Middleware\GuruMiddleware;
use App\Http\Middleware\SiswaMiddleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/register/siswa', [AuthController::class, 'registerSiswa']);
Route::post('/register/guru', [AuthController::class, 'registerGuru']);
Route::post('/login', [AuthController::class, 'login']);


// Protected routes - butuh authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware(SiswaMiddleware::class)->group(function () {
        Route::get('/siswa/profile', [SiswaController::class, 'getProfile']);
        Route::put('/siswa/profile', [SiswaController::class, 'updateProfile']);
        Route::get('/siswa/dashboard', [SiswaController::class, 'dashboard']);
        //Logbook SIswa
        Route::get('/magang/status', [LogbookSiswaController::class, 'getStatusMagang']);
        Route::prefix('siswa')->group(function () {
            Route::get('/logbook', [LogbookSiswaController::class, 'index']);
            Route::get('/logbook/id', [LogbookSiswaController::class, 'show']);
            Route::post('/logbook/create', [LogbookSiswaController::class, 'store']);
            Route::patch('/logbook/update/{id}', [LogbookSiswaController::class, 'update']);
            Route::delete('/logbook/delete/{id}', [LogbookSiswaController::class, 'destroy']);

            //Route DUdi
            Route::get('dudi/aktif', [DudiSiswaController::class, 'getDudiAktif']);
            Route::get('dudi/{id}', [DudiSiswaController::class, 'show']);
            Route::post('dudi/{dudi_id}/daftar', [DudiSiswaController::class, 'store']);
        });
    });
});


Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);

    Route::middleware(GuruMiddleware::class)->group(function () {
        //Route DUDI
        Route::get('/guru/dudi/list', [DudiGuruController::class, 'getDudiList']);
        Route::get('/guru/dudi', [DudiGuruController::class, 'getAllDudi']);
        Route::get('/guru/dudi/{id}', [DudiGuruController::class, 'getDudiById']);
        Route::post('/guru/create/dudi', [DudiGuruController::class, 'createDudi']);
        Route::patch('/guru/update/dudi/{id}', [DudiGuruController::class, 'updateDudi']);
        Route::delete('/guru/delete/dudi/{id}', [DudiGuruController::class, 'deleteDudi']);
        Route::get('/guru/status/dudi', [DudiGuruController::class, 'getStatistics']);

        //Route DASHBOARD
        Route::get('/dashboard', [DashboardController::class, 'getDashboardData']);
        Route::get('/dashboard/progress', [DashboardController::class, 'overview']);
        Route::get('/dashboard/dudi', [DashboardController::class, 'listDudi']);
        Route::get('/dashboard/magang', [DashboardController::class, 'listMagang']);

        //Route LOGBOOK
        Route::get('/guru/logbook', [LogbookGuruController::class, 'getAllLogbook']);
        Route::get('/logbook', [LogbookGuruController::class, 'index']);
        Route::get('/logbook/{id}', [LogbookGuruController::class, 'show']);
        // Verifikasi logbook
        Route::put('/logbook/{id}/verifikasi', [LogbookGuruController::class, 'verifikasi']);


        //Route MAGANG
        Route::get('/guru/magang', [MagangGuruController::class, 'getAllMagang']);
        Route::get('/guru/magang/list', [MagangGuruController::class, 'getMagangList']);
        Route::post('/guru/magang/create', [MagangGuruController::class, 'createMagang']);
        Route::patch('/guru/magang/update/{id}', [MagangGuruController::class, 'updateMagang']);
        Route::get('/guru/siswa/list', [MagangGuruController::class, 'getSiswaList']);
        Route::delete('/guru/magang/delete/{id}', [MagangGuruController::class, 'deleteMagang']);
    });
});
