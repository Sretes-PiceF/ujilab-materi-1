<?php

namespace App\Events\Siswa\Dudi;

use App\Models\Magang;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DudiCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $magang;
    public $targetUsers;

    public function __construct(Magang $magang, array $targetUsers = [])
    {
        $this->magang = $magang;
        $this->targetUsers = $targetUsers;
    }

    /**
     * Get the channels the event should broadcast on.
     * Channel khusus untuk GURU
     */
    public function broadcastOn(): array
    {
        $channels = [];

        foreach ($this->targetUsers as $userId) {
            // Channel untuk guru: guru.{id}
            $channels[] = new PrivateChannel('guru.' . $userId);
        }

        // TAMBAHKAN channel public untuk monitoring
        $channels[] = new Channel('magang');

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'magang.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->magang->id,
            'siswa_id' => $this->magang->siswa_id,
            'dudi_id' => $this->magang->dudi_id,
            'status' => $this->magang->status,
            'created_at' => $this->magang->created_at->toISOString(),

            // Data lengkap untuk frontend
            'siswa_nama' => $this->magang->siswa->nama ?? 'N/A',
            'siswa_nis' => $this->magang->siswa->nis ?? '',
            'siswa_kelas' => $this->magang->siswa->kelas ?? '',
            'siswa_jurusan' => $this->magang->siswa->jurusan ?? '',
            'siswa_email' => $this->magang->siswa->user->email ?? '',

            'dudi_nama' => $this->magang->dudi->nama_perusahaan ?? 'N/A',
            'dudi_alamat' => $this->magang->dudi->alamat ?? '',
            'dudi_telepon' => $this->magang->dudi->telepon ?? '',
            'dudi_email' => $this->magang->dudi->email ?? '',

            'message' => "Pendaftaran magang baru dari " . ($this->magang->siswa->nama ?? 'siswa'),
            'timestamp' => now()->toISOString(),
            'type' => 'new_registration'
        ];
    }
}
