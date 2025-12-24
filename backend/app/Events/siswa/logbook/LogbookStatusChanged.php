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

class LogbookStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $logbook;
    public $siswa;
    public $oldStatus;
    public $newStatus;
    public $timestamp;

    public function __construct(Logbook $logbook, Siswa $siswa, string $oldStatus, string $newStatus)
    {
        $this->logbook = [
            'id' => $logbook->id,
            'tanggal' => $logbook->tanggal->format('Y-m-d'),
            'tanggal_formatted' => $logbook->tanggal->format('d M Y'),
            'kegiatan' => $logbook->kegiatan,
            'status_verifikasi' => $logbook->status_verifikasi,
            'catatan_guru' => $logbook->catatan_guru,
        ];

        $this->siswa = [
            'id' => $siswa->id,
            'nama' => $siswa->nama,
            'nis' => $siswa->nis,
        ];

        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
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
        return 'logbook.status.changed';
    }

    public function broadcastWith(): array
    {
        $statusMessages = [
            'pending' => 'menunggu verifikasi',
            'disetujui' => 'disetujui',
            'ditolak' => 'ditolak',
        ];

        $icon = $this->newStatus == 'disetujui' ? 'success' : ($this->newStatus == 'ditolak' ? 'error' : 'info');

        $title = $this->newStatus == 'disetujui' ? 'Logbook Disetujui' : ($this->newStatus == 'ditolak' ? 'Logbook Ditolak' : 'Status Logbook Berubah');

        return [
            'type' => 'logbook_status_changed',
            'title' => $title,
            'message' => "Logbook tanggal {$this->logbook['tanggal_formatted']} telah {$statusMessages[$this->newStatus]}",
            'data' => $this->logbook,
            'siswa' => $this->siswa,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'timestamp' => $this->timestamp,
            'icon' => $icon,
        ];
    }
}
