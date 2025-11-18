// components/CardStats.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface CardStatsProps {
    title: string;
    value: string | number;
    description: string;
    icon: LucideIcon; // Menerima komponen ikon dari lucide-react
}

export function CardStats({ title, value, description, icon: Icon }: CardStatsProps) {
    return (
        <Card className="shadow-lg transition-shadow duration-300 hover:shadow-xl rounded-xl">
            {/* Header: Judul/Label */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                    {title}
                </CardTitle>

                {/* ICON WRAPPER: Ikon di sudut kanan atas */}
                <Icon className="h-5 w-5 text-gray-400" />
            </CardHeader>

            {/* Content: Angka dan Deskripsi */}
            <CardContent className="p-5 pt-0">
                {/* Nilai / Angka Besar */}
                <div className="text-3xl font-bold text-gray-900">
                    {value}
                </div>

                {/* Deskripsi / Keterangan */}
                <p className="text-sm text-gray-500 mt-1">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}