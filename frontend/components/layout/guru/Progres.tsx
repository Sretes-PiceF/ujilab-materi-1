// components/ProgressOverviewCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // Menggunakan Progress Shadcn/UI
import { TrendingUp } from "lucide-react";

interface ProgressItemProps {
    label: string;
    value: number; // Persentase 0-100
}

const ProgressItem = ({ label, value }: ProgressItemProps) => (
    <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-700">
            <span>{label}</span>
            <span className="font-semibold">{value}%</span>
        </div>
        {/* Catatan: Anda perlu menginstal komponen Progress dari shadcn/ui */}
        <Progress value={value} className="h-2 [&>div]:bg-blue-500" />
    </div>
);

export function ProgressCard() {
    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader className="py-4 px-6 border-b">
                <CardTitle className="flex items-center text-base font-semibold text-gray-900">
                    <TrendingUp className="h-4 w-4 mr-2 text-purple-600" /> Progress Overview
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <ProgressItem label="Siswa Aktif Magang" value={80} />
                <ProgressItem label="Logbook Hari Ini" value={71} />
            </CardContent>
        </Card>
    );
}