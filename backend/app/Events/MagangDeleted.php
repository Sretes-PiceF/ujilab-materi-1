<?php
// app/Events/MagangDeleted.php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MagangDeleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $magangId;

    public function __construct(string $magangId)
    {
        $this->magangId = $magangId;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('magang');
    }

    public function broadcastAs(): string
    {
        return 'magang.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->magangId,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
