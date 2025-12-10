<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RealtimeController;

// ... routes lainnya ...

// Supabase webhook (tambahkan ini saja)
Route::post('/realtime/webhook', [RealtimeController::class, 'handleWebhook'])->name('realtime.webhook')->withoutMiddleware(['csrf']);
