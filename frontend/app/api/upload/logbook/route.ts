// app/api/upload/logbook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file yang diupload' },
        { status: 400 }
      );
    }

    // Validasi tipe file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Format file tidak didukung' },
        { status: 400 }
      );
    }

    // Konversi File ke Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const originalExtension = file.name.split('.').pop();
    const uuid = uuidv4();
    const originalFilename = `${uuid}.${originalExtension}`;
    const thumbnailFilename = `${uuid}_thumbnail.${originalExtension}`;
    const webpFilename = `${uuid}.webp`;
    const thumbnailWebpFilename = `${uuid}_thumbnail.webp`;

    // Path untuk menyimpan file
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'logbooks');
    
    // Buat direktori jika belum ada
    await mkdir(uploadDir, { recursive: true });

    // 1. Simpan gambar asli
    const originalPath = join(uploadDir, originalFilename);
    await writeFile(originalPath, buffer);

    // 2. Buat thumbnail (300x300)
    const thumbnailBuffer = await sharp(buffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    const thumbnailPath = join(uploadDir, thumbnailFilename);
    await writeFile(thumbnailPath, thumbnailBuffer);

    // 3. Konversi ke WebP (untuk gambar asli)
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();
    
    const webpPath = join(uploadDir, webpFilename);
    await writeFile(webpPath, webpBuffer);

    // 4. Buat thumbnail WebP
    const thumbnailWebpBuffer = await sharp(buffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 70 })
      .toBuffer();
    
    const thumbnailWebpPath = join(uploadDir, thumbnailWebpFilename);
    await writeFile(thumbnailWebpPath, thumbnailWebpBuffer);

    // Return response
    return NextResponse.json({
      success: true,
      message: 'File berhasil diupload dan dioptimasi',
      data: {
        original: `/uploads/logbooks/${originalFilename}`,
        thumbnail: `/uploads/logbooks/${thumbnailFilename}`,
        webp: `/uploads/logbooks/${webpFilename}`,
        thumbnail_webp: `/uploads/logbooks/${thumbnailWebpFilename}`,
        original_size: buffer.length,
        thumbnail_size: thumbnailBuffer.length,
        webp_size: webpBuffer.length,
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat upload' },
      { status: 500 }
    );
  }
}