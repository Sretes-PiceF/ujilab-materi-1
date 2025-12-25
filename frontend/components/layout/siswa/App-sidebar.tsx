// AppSidebarSiswa.tsx
"use client";
import {
  GraduationCap,
  Building2,
  BookOpen,
  LayoutDashboardIcon,
  LogOut,
  MapPin,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboardIcon,
    href: "/siswa/dashboard",
    description: "Ringkasan aktivitas",
  },
  {
    title: "DUDI",
    icon: Building2,
    href: "/siswa/dudi",
    description: "Dunia Usaha & Industri",
  },
  {
    title: "Magang",
    icon: GraduationCap,
    href: "/siswa/magang",
    description: "Data siswa magang",
  },
  {
    title: "Logbook",
    icon: BookOpen,
    href: "/siswa/logbook",
    description: "Catatan harian",
  },
  {
    title: "Lokasi Anda",
    icon: MapPin,
    href: "#",
    isLocation: true,
    description: "Lokasi saat ini",
  },
  {
    title: "Logout",
    icon: LogOut,
    href: "#",
    isLogout: true,
    description: "Keluar",
  },
];

export function AppSidebarSiswa() {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fungsi untuk menangani logout
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    // Konfirmasi logout
    if (!window.confirm("Apakah Anda yakin ingin logout?")) {
      setIsLoggingOut(false);
      return;
    }

    try {
      // Ambil token dari localStorage
      const token = localStorage.getItem("access_token");

      if (token) {
        // Kirim request logout ke backend
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/logout`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );
      }

      // Hapus semua data autentikasi dari semua tempat
      localStorage.clear();
      sessionStorage.clear();

      // Hapus semua cookies dengan berbagai path
      const cookies = ["access_token", "user_data", "refresh_token", "token"];
      cookies.forEach((cookieName) => {
        // Hapus untuk semua path yang mungkin
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        document.cookie = `${cookieName}=; path=/siswa; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `${cookieName}=; path=/guru; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });

      // Redirect ke halaman login dengan hard refresh
      setTimeout(() => {
        window.location.href = "/";
      }, 300);

    } catch (error) {
      console.error("Logout error:", error);
      // Tetap hapus data lokal dan redirect meskipun error
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_data=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    }
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-72 flex flex-col bg-white border-r border-gray-100 shadow-sm z-50">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-[#4FC3F7] flex items-center justify-center shadow-sm">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Magang</h1>
            <p className="text-xs text-gray-500 -mt-0.5">Portal Siswa</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-3">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            // Untuk tombol lokasi khusus
            if (item.isLocation) {
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (!isLoggingOut) {
                      // Tambahkan logika untuk modal lokasi di sini
                      console.log("Lokasi diklik");
                    }
                  }}
                  disabled={isLoggingOut}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group w-full text-left",
                    // HOVER: biru muda transparan, text biru tua
                    "hover:bg-blue-50 hover:text-blue-800",
                    // DEFAULT: text abu-abu
                    "text-gray-700",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      // DEFAULT: icon abu-abu
                      "text-gray-500",
                      // HOVER: icon biru
                      "group-hover:text-blue-600"
                    )}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900 group-hover:text-blue-800">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs truncate mt-0.5 text-gray-500 group-hover:text-blue-600">
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            }
            
            // Untuk tombol logout khusus
            if (item.isLogout) {
              return (
                <button
                  key={index}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group text-left",
                    // HOVER: merah muda, text merah tua
                    "hover:bg-red-50 hover:text-red-700",
                    // DEFAULT: text merah
                    "text-red-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isLoggingOut && "bg-red-50"
                  )}
                >
                  <div className="h-5 w-5 shrink-0 flex items-center justify-center">
                    {isLoggingOut ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">
                      {isLoggingOut ? "Logging out..." : item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-red-500 truncate mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            }
            
            // Untuk navigation item biasa
            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                  // AKTIF: bg biru muda, text putih
                  isActive
                    ? "bg-[#4FC3F7] text-white shadow-md"
                    // DEFAULT/HOVER: bg transparan saat hover, text biru tua saat hover
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-800"
                )}
                onClick={(e) => {
                  // Jika sedang logout, prevent navigation
                  if (isLoggingOut) {
                    e.preventDefault();
                  }
                }}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    // AKTIF: icon putih
                    isActive
                      ? "text-white"
                      // DEFAULT/HOVER: icon sesuai state
                      : "text-gray-500 group-hover:text-blue-600"
                  )}
                />
                
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate transition-colors",
                      // AKTIF: text putih
                      isActive
                        ? "text-white"
                        // DEFAULT/HOVER: text sesuai state
                        : "text-gray-900 group-hover:text-blue-800"
                    )}
                  >
                    {item.title}
                  </p>
                  {item.description && (
                    <p
                      className={cn(
                        "text-xs truncate mt-0.5 transition-colors",
                        // AKTIF: deskripsi biru muda/putih transparan
                        isActive
                          ? "text-blue-100"
                          // DEFAULT/HOVER: deskripsi sesuai state
                          : "text-gray-500 group-hover:text-blue-600"
                      )}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-800">
            N
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-none truncate">
              SMK Negeri 6 Malang
            </p>
            <p className="text-xs text-gray-500 truncate">
              Sistem Pelaporan v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}