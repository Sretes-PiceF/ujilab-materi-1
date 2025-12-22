<?php

namespace App\Events\guru\magang;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MagangUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $magang;
    public $action;

    public function __construct($magang, string $action = 'updated')
    {
        $this->magang = $magang;
        $this->action = $action;

        // Load relations untuk memastikan data lengkap
        if (is_object($magang)) {
            $magang->load(['siswa.user', 'dudi']);
        }
    }

    public function broadcastOn(): Channel
    {
        return new Channel('magang');
    }

    public function broadcastAs(): string
    {
        // ✅ KOREKSI: Return 'magang.created' atau 'magang.updated'
        return 'magang.' . $this->action;
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->magang->id,
            'siswa_id' => $this->magang->siswa_id,
            'dudi_id' => $this->magang->dudi_id,
            'status' => $this->magang->status,
            'nilai_akhir' => $this->magang->nilai_akhir,
            'tanggal_mulai' => $this->magang->tanggal_mulai,
            'tanggal_selesai' => $this->magang->tanggal_selesai,

            'siswa_nama' => $this->magang->siswa->nama ?? '',
            'siswa_nis' => $this->magang->siswa->nis ?? '',
            'siswa_email' => $this->magang->siswa->user->email ?? '',
            'siswa_kelas' => $this->magang->siswa->kelas ?? '',
            'siswa_jurusan' => $this->magang->siswa->jurusan ?? '',

            'dudi_nama' => $this->magang->dudi->nama_perusahaan ?? '',
            'dudi_alamat' => $this->magang->dudi->alamat ?? '',
            'dudi_telepon' => $this->magang->dudi->telepon ?? '',
            'dudi_email' => $this->magang->dudi->email ?? '',

            'action' => $this->action,
            'timestamp' => now()->toISOString(),
        ];
    }
}
