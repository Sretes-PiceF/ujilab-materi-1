<?php

// ========================================
// File: app/Events/LogbookCreated.php
// ========================================

namespace App\Events\guru\logbook;

use App\Models\Logbook;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LogbookCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $logbook;

    public function __construct(Logbook $logbook)
    {
        $this->logbook = $logbook->load(['magang.siswa', 'magang.dudi']);
    }

    public function broadcastOn()
    {
        return new Channel('logbook');
    }

    public function broadcastAs()
    {
        return 'logbook.created';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->logbook->id,
            'magang_id' => $this->logbook->magang_id,
            'siswa_id' => $this->logbook->magang->siswa->id ?? null,
            'siswa_nama' => $this->logbook->magang->siswa->nama ?? 'Unknown',
            'dudi_id' => $this->logbook->magang->dudi->id ?? null,
            'dudi_nama' => $this->logbook->magang->dudi->nama_perusahaan ?? 'Unknown',
            'tanggal' => $this->logbook->tanggal->format('Y-m-d'),
            'tanggal_formatted' => $this->logbook->tanggal->format('d M Y'),
            'kegiatan' => $this->logbook->kegiatan,
            'kendala' => $this->logbook->kendala,
            'status_verifikasi' => $this->logbook->status_verifikasi,
            'file' => $this->logbook->file,
            'created_at' => $this->logbook->created_at->toDateTimeString(),
        ];
    }
}
