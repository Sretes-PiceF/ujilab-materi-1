// components/OptimizedImage.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

interface OptimizedImageProps {
  src: string;
  webpSrc?: string;
  thumbnailSrc?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  webpSrc,
  thumbnailSrc,
  alt,
  width,
  height,
  className,
  fallbackSrc = "/placeholder-image.jpg",
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc || src);

  const handleLoad = () => {
    setIsLoading(false);
    // Load full image setelah thumbnail
    if (thumbnailSrc && currentSrc === thumbnailSrc) {
      const img = new window.Image();
      img.src = webpSrc || src;
      img.onload = () => {
        setCurrentSrc(webpSrc || src);
      };
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {hasError ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <span className="text-gray-500 text-sm">Gagal memuat gambar</span>
        </div>
      ) : (
        <picture>
          {/* WebP format (lebih kecil) */}
          {webpSrc && (
            <source
              srcSet={webpSrc}
              type="image/webp"
              onError={() => console.log("WebP not supported")}
            />
          )}

          {/* Fallback ke format original */}
          <source srcSet={src} type={getMimeType(src)} />

          {/* Fallback ke img tag */}
          <Image
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            className={`transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
        </picture>
      )}
    </div>
  );
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}
