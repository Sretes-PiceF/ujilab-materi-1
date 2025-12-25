// SidebarNavItem.tsx
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { NavigationItem } from "../../../types/types";
import { useState } from "react";

interface SidebarNavItemProps {
  item: NavigationItem;
  isActive: boolean;
  isLoggingOut?: boolean;
}

export function SidebarNavItem({ item, isActive, isLoggingOut = false }: SidebarNavItemProps) {
  const [localLoggingOut, setLocalLoggingOut] = useState(false);

  // Jika ini adalah section header
  if (item.isSection) {
    return (
      <div className="pt-6 pb-2 px-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {item.title}
        </h3>
      </div>
    );
  }

  // Jika ini adalah item logout
  if (item.isLogout) {
    const Icon = item.icon;

    const handleLogout = async () => {
      try {
        setLocalLoggingOut(true);

        // Konfirmasi logout
        if (!window.confirm("Apakah Anda yakin ingin logout?")) {
          setLocalLoggingOut(false);
          return;
        }

        // Ambil token dari localStorage
        const token = localStorage.getItem("access_token");

        if (token) {
          // Kirim request logout ke backend
          await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
            }/logout`,
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
      <button
        onClick={handleLogout}
        disabled={localLoggingOut}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
          "text-red-600 hover:bg-red-50 hover:text-red-700",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          localLoggingOut && "bg-red-50"
        )}
      >
        {Icon && (
          <div className="h-5 w-5 shrink-0 flex items-center justify-center">
            {localLoggingOut ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium truncate">
            {localLoggingOut ? "Logging out..." : item.title}
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

  // Jika ini adalah regular navigation item
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
        isActive
          ? "bg-blue-100 text-blue-800" // Aktif: bg biru muda solid, text biru tua
          : "text-gray-700 hover:bg-blue-50 hover:text-blue-800" // Hover: bg biru muda transparan, text biru tua
      )}
      onClick={(e) => {
        // Jika sedang logout, prevent navigation
        if (isLoggingOut || localLoggingOut) {
          e.preventDefault();
        }
      }}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isActive 
              ? "text-blue-600" // Aktif: icon biru
              : "text-gray-500 group-hover:text-blue-600" // Default/Hover: icon sesuai state
          )}
        />
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate transition-colors",
            isActive 
              ? "text-blue-800" // Aktif: text biru tua
              : "text-gray-900 group-hover:text-blue-800" // Default/Hover: text sesuai state
          )}
        >
          {item.title}
        </p>

        {item.description && (
          <p
            className={cn(
              "text-xs truncate mt-0.5 transition-colors",
              isActive
                ? "text-blue-600" // Aktif: deskripsi biru sedang
                : "text-gray-500 group-hover:text-blue-600" // Default/Hover: deskripsi sesuai state
            )}
          >
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
}