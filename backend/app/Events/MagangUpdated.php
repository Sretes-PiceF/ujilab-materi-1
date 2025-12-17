<?php
// app/Events/MagangUpdated.php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // PASTIKAN ShouldBroadcastNow
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class MagangUpdated implements ShouldBroadcastNow // HARUS ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $magang;
    public $action;

    public function __construct($magang, $action = 'updated')
    {
        $this->magang = $magang;
        $this->action = $action;

        // Pastikan data lengkap
        if (is_object($magang) && method_exists($magang, 'loadMissing')) {
            $magang->loadMissing(['siswa', 'dudi']);
        }

        Log::info('MagangUpdated Event Created', [
            'id' => $magang->id ?? 'unknown',
            'action' => $action,
            'timestamp' => now()->toISOString()
        ]);
    }

    public function broadcastOn()
    {
        return new Channel('magang');
    }

    public function broadcastAs()
    {
        return 'magang.' . $this->action;
    }

    public function broadcastWith()
    {
        // Kirim SEMUA data yang diperlukan frontend
        return [
            'id' => $this->magang->id ?? null,
            'siswa_id' => $this->magang->siswa_id ?? null,
            'siswa_nama' => $this->magang->siswa->nama ??
                ($this->magang->siswa['nama'] ?? 'N/A'),
            'dudi_id' => $this->magang->dudi_id ?? null,
            'dudi_nama' => $this->magang->dudi->nama_perusahaan ??
                ($this->magang->dudi['nama_perusahaan'] ?? 'N/A'),
            'status' => $this->magang->status ?? null,
            'tanggal_mulai' => $this->magang->tanggal_mulai ?? null,
            'tanggal_selesai' => $this->magang->tanggal_selesai ?? null,
            'nilai_akhir' => $this->magang->nilai_akhir ?? null,
            'action' => $this->action,
            'timestamp' => now()->toISOString(),
            'updated_at' => isset($this->magang->updated_at)
                ? $this->magang->updated_at->toISOString()
                : now()->toISOString(),
            'immediate' => true // Flag untuk frontend
        ];
    }
}
