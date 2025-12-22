<?php

namespace App\Events\guru\dudi;

use App\Models\Dudi;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DudiCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $dudi;

    public function __construct(Dudi $dudi)
    {
        $this->dudi = $dudi;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('dudi'); // Channel sama untuk semua DUDI events
    }

    public function broadcastAs(): string
    {
        return 'dudi.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->dudi->id,
            'nama_perusahaan' => $this->dudi->nama_perusahaan,
            'status' => $this->dudi->status,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
