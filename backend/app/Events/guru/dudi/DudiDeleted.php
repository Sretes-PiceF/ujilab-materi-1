<?php

namespace App\Events\guru\dudi;

use App\Models\Dudi;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DudiDeleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $dudiId;
    public $dudiName;

    public function __construct(Dudi $dudi)
    {
        $this->dudiId = $dudi->id;
        $this->dudiName = $dudi->nama_perusahaan;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('dudi'); // SAMA!
    }

    public function broadcastAs(): string
    {
        return 'dudi.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->dudiId,
            'nama_perusahaan' => $this->dudiName,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
