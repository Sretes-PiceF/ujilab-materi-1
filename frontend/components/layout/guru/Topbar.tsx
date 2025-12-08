"use client";
import { User } from "lucide-react";
import { useState, useEffect } from "react";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function TopbarGuru() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data user yang sedang login
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUserData(result.data.user);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Jika masih loading, tampilkan placeholder
  if (loading) {
    return (
      <div className="w-full h-[93px] flex items-center justify-between px-8 bg-white border-b border-gray-100 flex-shrink-0">
        {/* KIRI — Judul */}
        <div className="flex flex-col leading-tight">
          <h1 className="text-xl font-semibold text-gray-800">SIMNAS</h1>
          <p className="text-sm text-gray-500 -mt-0.5">
            Sistem Pelaporan Magang Siswa SIMNAS
          </p>
        </div>
        {/* KANAN — Profil */}
        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="font-semibold text-sm text-gray-800">Memuat...</p>
            <p className="text-xs text-gray-500 -mt-0.5">Memuat...</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[93px] flex items-center justify-between px-8 bg-white border-b border-gray-100 flex-shrink-0">
      {/* KIRI — Judul */}
      <div className="flex flex-col leading-tight">
        <h1 className="text-xl font-semibold text-gray-800">SIMNAS</h1>
        <p className="text-sm text-gray-500 -mt-0.5">
          Sistem Pelaporan Magang Siswa SIMNAS
        </p>
      </div>
      {/* KANAN — Profil */}
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <p className="font-semibold text-sm text-gray-800">
            {userData?.name || "Nama Guru"}
          </p>
          <p className="text-xs text-gray-500 -mt-0.5">
            {userData?.role ? `${userData.role}` : "Guru Pembimbing"}
          </p>
        </div>
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="h-5 w-5 text-gray-600" />
        </div>
      </div>
    </div>
  );
}
