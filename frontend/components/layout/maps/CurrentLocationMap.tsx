'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import type { LatLngExpression, LatLngTuple } from 'leaflet';

// 1. FIX UNTUK ICON MARKER (TIPE AMAN)
// Gunakan pendekatan yang lebih aman untuk mengatasi ikon yang hilang[citation:9]
const DefaultIcon = L.icon({
  iconUrl: '/leaflet/images/marker-icon.png',
  iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
  shadowUrl: '/leaflet/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// 2. TIPE PROPS UNTUK RecenterMap
interface RecenterMapProps {
  position: LatLngExpression | null;
}

// Komponen untuk auto-center ke lokasi user
function RecenterMap({ position }: RecenterMapProps) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  
  return null;
}

// 3. FIX STATE DAN TIPE UNTUK Live Tracking
function LocationTracker() {
  const [position, setPosition] = useState<LatLngTuple | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition: LatLngTuple = [
          pos.coords.latitude, 
          pos.coords.longitude
        ];
        setPosition(newPosition);
        map.setView(newPosition, map.getZoom());
      },
      (error) => {
        console.error('Error mendapatkan lokasi:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map]);

  if (!position) return null;

  // Custom icon dengan animasi
  const customIcon = L.divIcon({
    html: `
      <div class="relative">
        <div class="animate-ping absolute -inset-1 rounded-full bg-blue-500 opacity-20"></div>
        <div class="relative h-6 w-6 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
          <div class="h-2 w-2 rounded-full bg-white"></div>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    className: 'custom-live-marker'
  });

  return (
    <Marker position={position} icon={customIcon}>
      <Popup>
        <div className="p-2">
          <h3 className="font-bold text-sm">📍 Anda di sini</h3>
          <p className="text-xs mt-1">
            Lat: {position[0].toFixed(6)}<br />
            Lng: {position[1].toFixed(6)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Posisi diperbarui otomatis
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

// 4. KOMPONEN UTAMA DENGAN TIPE YANG TEPAT
export default function CurrentLocationMap() {
  const defaultPosition: LatLngTuple = [-7.9666, 112.6326]; // Default Malang
  const [location, setLocation] = useState<LatLngExpression>(defaultPosition);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPosition: LatLngTuple = [
            pos.coords.latitude, 
            pos.coords.longitude
          ];
          setLocation(userPosition);
          setLoading(false);
        },
        (error) => {
          console.log('Gagal mendapatkan lokasi:', error.message);
          setLocation(defaultPosition);
          setLoading(false);
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.log('Geolocation tidak didukung browser');
      setLoading(false);
    }
  }, []);

  return (
    <>
      {loading ? (
        <div className="h-full w-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Mendeteksi lokasi...</p>
          </div>
        </div>
      ) : (
        <MapContainer
          center={location}
          zoom={15}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationTracker />
          <RecenterMap position={location} />
        </MapContainer>
      )}
    </>
  );
}