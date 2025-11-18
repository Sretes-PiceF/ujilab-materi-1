// components/LogbookTerbaruCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { LogbookItem } from "./LogbookItem"; // Pastikan path import benar

export function LogbookCard() {
    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader className="py-4 px-6 border-b">
                <CardTitle className="flex items-center text-base font-semibold text-gray-900">
                    <BookOpen className="h-4 w-4 mr-2 text-green-600" /> Logbook Terbaru
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-1">

                {/* Contoh data Logbook 1: Disetujui */}
                <LogbookItem
                    activity="Mempelajari sistem database dan melakukan backup..."
                    date="21/7/2024"
                    note="Tidak ada kendala berarti"
                    status="Disetujui"
                />

                {/* Contoh data Logbook 2: Menunggu */}
                <LogbookItem
                    activity="Membuat design mockup untuk website perusahaan"
                    date="21/7/2024"
                    note="Perlu konfirmasi aset gambar dari tim marketing"
                    status="Menunggu"
                />

                {/* Anda dapat menambahkan lebih banyak item di sini */}

            </CardContent>
        </Card>
    );
}