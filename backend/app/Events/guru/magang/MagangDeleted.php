<?php

namespace App\Events\guru\magang;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MagangDeleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $magangData;

    public function __construct(int $magangData)
    {
        $this->magangData = $magangData;
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
            'id' => $this->magangData['id'],
            'siswa_id' => $this->magangData['siswa_id'] ?? null,
            'dudi_id' => $this->magangData['dudi_id'] ?? null,
            'siswa_nama' => $this->magangData['siswa_nama'] ?? '',
            'siswa_nis' => $this->magangData['siswa_nis'] ?? '',
            'dudi_nama' => $this->magangData['dudi_nama'] ?? '',
            'message' => 'Data magang berhasil dihapus',
            'timestamp' => now()->toISOString(),
        ];
    }
}
