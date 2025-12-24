<?php

namespace App\Events\siswa\logbook;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Logbook;
use App\Models\Siswa;

class LogbookUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $logbook;
    public $siswa;
    public $action = 'updated';
    public $changes;
    public $timestamp;

    public function __construct(Logbook $logbook, Siswa $siswa, array $changes = [])
    {
        $this->logbook = [
            'id' => $logbook->id,
            'tanggal' => $logbook->tanggal->format('Y-m-d'),
            'tanggal_formatted' => $logbook->tanggal->format('d M Y'),
            'kegiatan' => $logbook->kegiatan,
            'status_verifikasi' => $logbook->status_verifikasi,
            'updated_at' => $logbook->updated_at->toDateTimeString(),
        ];

        $this->siswa = [
            'id' => $siswa->id,
            'nama' => $siswa->nama,
            'nis' => $siswa->nis,
        ];

        $this->changes = $changes;
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
        return 'logbook.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'type' => 'logbook_updated',
            'title' => 'Logbook Berhasil Diupdate',
            'message' => 'Logbook berhasil diperbarui',
            'data' => $this->logbook,
            'siswa' => $this->siswa,
            'changes' => $this->changes,
            'action' => $this->action,
            'timestamp' => $this->timestamp,
            'icon' => 'info',
        ];
    }
}
