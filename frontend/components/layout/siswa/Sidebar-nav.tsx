"use client";

import { usePathname } from "next/navigation";
import { SidebarNavItem } from "./Sidebar-nav-item";
import { NavigationItem } from "../../../types/types";

interface SidebarNavProps {
    items: NavigationItem[];
}

const normalizePath = (path: string) => path.replace(/\/$/, "");

export function SidebarNav({ items }: SidebarNavProps) {
    const rawPath = usePathname();
    const currentPath = normalizePath(rawPath);

    return (
        <nav className="space-y-1 px-6">
            {items.map((item, index) => {
                if (item.isSection) {
                    return (
                        <div key={index} className="pt-2 pb-3">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {item.title}
                            </h3>
                        </div>
                    );
                }

                const itemHref = normalizePath(item.href);
                const isActive = currentPath === itemHref;

                return (
                    <SidebarNavItem
                        key={index}
                        item={item}
                        isActive={isActive}
                    />
                );
            })}
        </nav>
    );
}
