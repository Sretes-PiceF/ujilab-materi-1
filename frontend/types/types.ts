import { LucideIcon } from "lucide-react";

export interface NavigationItem {
    title: string;
    icon: LucideIcon;
    href: string;
    badge?: string | null;
    description?: string;
    isSection?: boolean; // Tambahkan untuk section header
    isLogout?: boolean;
}