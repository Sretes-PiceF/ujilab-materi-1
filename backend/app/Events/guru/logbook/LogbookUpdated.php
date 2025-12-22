<?php

namespace App\Events\guru\logbook;

use App\Models\Logbook;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LogbookUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $logbook;
    public $action;

    public function __construct(Logbook $logbook, $action = 'updated')
    {
        // Load relations lengkap
        $this->logbook = $logbook->load(['magang.siswa.user', 'magang.dudi']);
        $this->action = $action;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('logbook'); // Channel publik seperti magang
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'logbook.' . $this->action;
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->logbook->id,
            'magang_id' => $this->logbook->magang_id,
            'tanggal' => $this->logbook->tanggal->format('Y-m-d'),
            'tanggal_formatted' => $this->logbook->tanggal->format('d M Y'),
            'kegiatan' => $this->logbook->kegiatan,
            'kendala' => $this->logbook->kendala,
            'status_verifikasi' => $this->logbook->status_verifikasi,
            'catatan_guru' => $this->logbook->catatan_guru,
            'catatan_dudi' => $this->logbook->catatan_dudi,

            // Stats realtime untuk update langsung
            'stats' => [
                'total' => Logbook::count(),
                'pending' => Logbook::where('status_verifikasi', 'pending')->count(),
                'disetujui' => Logbook::where('status_verifikasi', 'disetujui')->count(),
                'ditolak' => Logbook::where('status_verifikasi', 'ditolak')->count(),
            ],

            // Data siswa & dudi
            'siswa' => [
                'id' => $this->logbook->magang->siswa->id ?? null,
                'nama' => $this->logbook->magang->siswa->nama ?? 'N/A',
                'nis' => $this->logbook->magang->siswa->nis ?? 'N/A',
            ],
            'dudi' => [
                'id' => $this->logbook->magang->dudi->id ?? null,
                'nama_perusahaan' => $this->logbook->magang->dudi->nama_perusahaan ?? 'N/A',
            ],

            'action' => $this->action,
            'timestamp' => now()->toIso8601String(),
            'message' => $this->getMessage(),
        ];
    }

    private function getMessage(): string
    {
        $siswaNama = $this->logbook->magang->siswa->nama ?? 'Siswa';
        $actions = [
            'created' => "Logbook baru dari {$siswaNama}",
            'updated' => "Logbook {$siswaNama} diperbarui",
            'deleted' => "Logbook {$siswaNama} dihapus"
        ];

        return $actions[$this->action] ?? 'Logbook diperbarui';
    }
}
