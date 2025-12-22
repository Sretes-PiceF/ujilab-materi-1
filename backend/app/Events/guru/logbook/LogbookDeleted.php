<?php

namespace App\Events\guru\logbook;

use App\Models\Logbook;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LogbookDeleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $logbookId;

    public function __construct($logbookId)
    {
        $this->logbookId = $logbookId;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('logbook');
    }

    public function broadcastAs(): string
    {
        return 'logbook.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->logbookId,
            'stats' => [
                'total' => Logbook::count(),
                'pending' => Logbook::where('status_verifikasi', 'pending')->count(),
                'disetujui' => Logbook::where('status_verifikasi', 'disetujui')->count(),
                'ditolak' => Logbook::where('status_verifikasi', 'ditolak')->count(),
            ],
            'timestamp' => now()->toIso8601String(),
            'message' => 'Logbook telah dihapus'
        ];
    }
}
