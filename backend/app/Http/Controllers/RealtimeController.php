<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RealtimeController extends Controller
{
    /**
     * Handle Supabase realtime webhooks
     */
    public function handleWebhook(Request $request)
    {
        // 1. Verify secret
        $incomingSecret = $request->header('X-Webhook-Secret');
        $expectedSecret = env('SUPABASE_WEBHOOK_SECRET');

        if (!$incomingSecret || $incomingSecret !== $expectedSecret) {
            Log::warning('Webhook unauthorized', [
                'ip' => $request->ip(),
                'secret_provided' => $incomingSecret ? 'yes' : 'no'
            ]);
            return response('Unauthorized', 401);
        }

        // 2. Get payload
        $payload = $request->all();
        $table = $payload['table'] ?? null;
        $event = $payload['event'] ?? null;

        if (!$table || !$event) {
            return response('Invalid payload', 400);
        }

        // 3. Invalidate cache for this table
        $this->invalidateTableCache($table);

        // 4. Log success
        Log::info("🔄 Cache invalidated", [
            'table' => $table,
            'event' => $event,
            'record_id' => $payload['record']['id'] ?? $payload['old_record']['id'] ?? 'unknown'
        ]);

        // 5. Return success
        return response()->json([
            'status' => 'success',
            'message' => 'Cache invalidated',
            'table' => $table,
            'event' => $event,
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Invalidate all cache related to a table
     */
    private function invalidateTableCache(string $table): void
    {
        // Method 1: Cache tags (if using Redis)
        if (config('cache.default') === 'redis') {
            Cache::tags([$table])->flush();
            return;
        }

        // Method 2: Pattern matching (fallback)
        $patterns = [
            "{$table}_*",
            "*{$table}*",
            "api_{$table}_*",
            "cache_{$table}_*"
        ];

        foreach ($patterns as $pattern) {
            Cache::forget($pattern);
        }
    }
}
