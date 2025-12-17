<?php
// app/Events/MagangCreated.php

namespace App\Events;

use App\Models\Magang;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MagangCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $magang;

    public function __construct(Magang $magang)
    {
        // Load relations
        $this->magang = $magang->load(['siswa', 'dudi', 'guru']);
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('magang'); // Public channel
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'magang.created';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->magang->id,
            'siswa_id' => $this->magang->siswa_id,
            'dudi_id' => $this->magang->dudi_id,
            'status' => $this->magang->status,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
