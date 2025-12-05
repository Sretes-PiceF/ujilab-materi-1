<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Laporan Magang {{ $data_magang->nis }}</title>
    
    @php
        use Carbon\Carbon;
        Carbon::setLocale('id');
        $tanggal_cetak = Carbon::now()->translatedFormat('d F Y');
    @endphp

    <style>
        /* Pengaturan Halaman */
        @page {
            margin: 1.5cm 1.5cm 1.5cm 1.5cm; /* Atur margin: Atas Kanan Bawah Kiri */
        }

        /* Styling Dasar */
        body {
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
            color: #333;
        }
        
        /* Header (Nama Sekolah) - Statis */
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 16pt;
            margin: 0;
            color: #1a5c88; 
            text-transform: uppercase;
        }
        .header p {
            font-size: 10pt;
            margin-top: 5px;
        }
        .separator {
            border-bottom: 2px solid #333;
            margin: 15px 0 25px 0;
        }

        /* Konten Data (Dinamis) - Menggunakan float untuk 2 kolom */
        .data-grid {
            margin-bottom: 30px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            overflow: hidden; 
        }
        
        .data-item {
            width: 49%; /* Hampir 50% untuk 2 kolom */
            float: left; 
            margin-bottom: 10px;
        }
        
        .data-item:nth-child(even) {
            float: right; 
        }
        
        .label {
            display: block;
            font-size: 9pt;
            color: #777;
            margin-bottom: 2px;
        }
        
        .value {
            font-size: 10pt;
            font-weight: bold;
            color: #000;
        }

        /* Styling Nilai Akhir agar menjorok */
        .final-grade-item {
            width: 100%;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px dashed #ddd;
        }
        
        /* Footer (Tanda Tangan) - Statis/Dummy */
        .signature-area {
            margin-top: 70px;
            float: right;
            width: 50%;
            text-align: center;
        }
        
        .signer-line {
            border-bottom: 1px solid #000;
            display: inline-block;
            min-width: 200px;
            margin-top: 50px; /* Jarak untuk Tanda Tangan */
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>LAPORAN DATA MAGANG SISWA</h1>
        <p>Diperoleh dari Sistem Manajemen Magang SISWA</p>
        <div class="separator"></div>
    </div>

    <h2 style="font-size: 12pt; margin-bottom: 15px;">Detail Data Magang Siswa</h2>
    <div class="data-grid">
        
        <div class="data-item">
            <span class="label">Nama Siswa:</span>
            <span class="value">{{ $data_magang->name }}</span>
        </div>
        <div class="data-item">
            <span class="label">NIS:</span>
            <span class="value">{{ $data_magang->nis }}</span>
        </div>
        
        <div style="clear: both;"></div> 
        
        <div class="data-item">
            <span class="label">Kelas:</span>
            <span class="value">{{ $data_magang->class }}</span>
        </div>
        <div class="data-item">
            <span class="label">Jurusan:</span>
            <span class="value">{{ $data_magang->major }}</span>
        </div>

        <div style="clear: both;"></div> 
        
        <div class="data-item">
            <span class="label">Nama Perusahaan:</span>
            <span class="value">{{ $data_magang->company }}</span>
        </div>
        <div class="data-item">
            <span class="label">Alamat Perusahaan:</span>
            <span class="value">{{ $data_magang->address }}</span>
        </div>
        
        <div style="clear: both;"></div>
        
        <div class="data-item">
            <span class="label">Periode Magang:</span>
            <span class="value">{{ $data_magang->period }}</span>
        </div>
        <div class="data-item">
            <span class="label">Status:</span>
            <span class="value">{{ $data_magang->status }}</span>
        </div>
        
        <div style="clear: both;"></div>

        @if($data_magang->finalGrade)
        <div class="final-grade-item">
            <span class="label">Nilai Akhir:</span>
            <span class="value" style="font-size: 14pt; color: #d97706;">
                {{ $data_magang->finalGrade }}
            </span>
        </div>
        @endif
    </div>
    
    <div class="signature-area">
        <p>Malang, {{ $tanggal_cetak }}</p>
        <p style="margin-bottom: 3px;">Kepala Sekolah, Mohammad Taufik</p>
        
        <div class="signer-line"></div>
        <p style="margin: 3px 0 0 0; font-weight: bold; font-size: 10pt;">SMK Negeri 6 Malang</p>
        <p style="margin: 0; font-size: 8pt;">NIP. 1789123</p>
    </div>

</body>
</html>