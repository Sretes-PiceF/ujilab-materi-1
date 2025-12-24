// SidebarNavItem.tsx
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NavigationItem } from "../../../types/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SidebarNavItemProps {
    item: NavigationItem;
    isActive: boolean;
}

export function SidebarNavItem({ item, isActive }: SidebarNavItemProps) {
    const Icon = item.icon;
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    // Jika ini adalah item logout
    if (item.isLogout) {
        const Icon = item.icon;

        const handleLogout = async () => {
            try {
                setIsLoggingOut(true);

                // Konfirmasi logout
                if (!window.confirm("Apakah Anda yakin ingin logout?")) {
                    setIsLoggingOut(false);
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

                // Hapus semua data autentikasi
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                localStorage.removeItem("user_data");

                // Hapus cookies
                const cookies = ["access_token", "user_data"];
                cookies.forEach((cookieName) => {
                    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
                });

                // Redirect ke halaman login
                router.push("/");
                router.refresh();
            } catch (error) {
                console.error("Logout error:", error);
                // Tetap hapus data lokal dan redirect meskipun error
                localStorage.clear();
                document.cookie =
                    "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                document.cookie =
                    "user_data=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                router.push("/");
            } finally {
                setIsLoggingOut(false);
            }
        };

        return (
            <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    "text-red-600 hover:bg-red-50 hover:text-red-700 hover:shadow-sm",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isLoggingOut && "bg-red-50"
                )}
                style={{ borderRadius: "0.75rem" }}
            >
                {Icon && (
                    <div className="h-5 w-5 shrink-0 flex items-center justify-center">
                        {isLoggingOut ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                        ) : (
                            <Icon className="h-5 w-5" />
                        )}
                    </div>
                )}

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

    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                isActive
                    ? "bg-[#4FC3F7] text-white shadow-md"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
            )}
            style={{ borderRadius: "0.75rem" }}
        >
            <Icon
                className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-blue-600"
                )}
            />

            <div className="flex-1 min-w-0">
                <p
                    className={cn(
                        "text-sm font-medium truncate transition-colors",
                        isActive ? "text-white" : "text-gray-900 group-hover:text-blue-700"
                    )}
                >
                    {item.title}
                </p>

                {item.description && (
                    <p
                        className={cn(
                            "text-xs truncate mt-0.5 transition-colors",
                            isActive ? "text-blue-100" : "text-gray-500 group-hover:text-blue-500"
                        )}
                    >
                        {item.description}
                    </p>
                )}
            </div>
        </Link>
    );
}