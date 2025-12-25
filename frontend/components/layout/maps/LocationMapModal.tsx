// components/layout/maps/LokasiAndaCard.tsx
'use client';

import { useState, useEffect } from "react";
import { MapPin, Navigation, RefreshCw, Loader2, X, Compass } from "lucide-react";
import dynamic from 'next/dynamic';

// Dynamic import untuk CurrentLocationMap (Leaflet)
const CurrentLocationMap = dynamic(
  () => import('./CurrentLocationMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-xs text-gray-600">Memuat peta...</p>
        </div>
      </div>
    )
  }
);

interface LocationStats {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface LokasiAndaCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LokasiAndaCard({ isOpen, onClose }: LokasiAndaCardProps) {
  const [location, setLocation] = useState<LocationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && !location) {
      getCurrentLocation();
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolocation');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationStats = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp
        };
        setLocation(locationData);
        setLoading(false);
      },
      (err) => {
        setError('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diberikan.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleClose}
      />
      
      <div className={`
        relative w-full max-w-2xl bg-white rounded-t-xl md:rounded-xl shadow-lg
        transform transition-all duration-200 ease-out
        ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
      `}>
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Compass className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lokasi Anda</h2>
              <p className="text-sm text-gray-500">Posisi saat ini</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Action Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Status Lokasi</h3>
              <p className="text-sm text-gray-500">
                {location 
                  ? 'Lokasi berhasil dideteksi'
                  : 'Ambil lokasi untuk melihat peta'
                }
              </p>
            </div>
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {location ? 'Refresh' : 'Ambil Lokasi'}
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="h-3 w-3 text-red-600" />
                </div>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Map Container */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Peta Lokasi</h3>
              {location && (
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  Live
                </div>
              )}
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <div className="h-[350px]">
                <CurrentLocationMap />
              </div>
            </div>
          </div>

          {/* Location Info */}
          {location && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-gray-900">Detail Lokasi</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Koordinat</p>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-mono text-gray-900">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                        );
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Salin
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Terakhir Update</p>
                  <p className="text-sm text-gray-900">
                    {new Date(location.timestamp).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Tips Lokasi</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Pastikan GPS perangkat aktif</li>
                  <li>• Berikan izin lokasi pada browser</li>
                  <li>• Refresh untuk memperbarui posisi</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {location ? 'Refresh Lokasi' : 'Ambil Lokasi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}