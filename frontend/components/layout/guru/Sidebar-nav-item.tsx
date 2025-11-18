import Link from "next/link";
import { cn } from "@/lib/utils";
import { NavigationItem } from "../../../types/types";

interface SidebarNavItemProps {
    item: NavigationItem;
    isActive: boolean;
}

export function SidebarNavItem({ item, isActive }: SidebarNavItemProps) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive
                    ? "bg-[#0097BB] text-white shadow-md"
                    : "hover:bg-gray-100 text-gray-800"
            )}
        >
            <Icon
                className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-white" : "text-gray-500"
                )}
            />

            <div className="flex-1 min-w-0">
                <p
                    className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-white" : "text-gray-900"
                    )}
                >
                    {item.title}
                </p>

                {item.description && (
                    <p
                        className={cn(
                            "text-xs truncate",
                            isActive ? "text-white" : "text-gray-500"
                        )}
                    >
                        {item.description}
                    </p>
                )}
            </div>
        </Link>
    );
}
