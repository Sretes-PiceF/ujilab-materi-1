<?php

namespace App\Events\siswa\logbook;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Siswa;

class LogbookDeleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $logbookId;
    public $siswa;
    public $tanggal;
    public $timestamp;

    public function __construct(int $logbookId, Siswa $siswa, string $tanggal)
    {
        $this->logbookId = $logbookId;
        $this->siswa = [
            'id' => $siswa->id,
            'nama' => $siswa->nama,
            'nis' => $siswa->nis,
        ];
        $this->tanggal = $tanggal;
        $this->timestamp = now()->toDateTimeString();
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('siswa.logbook.' . $this->siswa['id']),
        ];
    }

    public function broadcastAs(): string
    {
        return 'logbook.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'type' => 'logbook_deleted',
            'title' => 'Logbook Dihapus',
            'message' => "Logbook untuk tanggal {$this->tanggal} telah dihapus",
            'logbook_id' => $this->logbookId,
            'siswa' => $this->siswa,
            'action' => 'deleted',
            'timestamp' => $this->timestamp,
            'icon' => 'warning',
        ];
    }
}
