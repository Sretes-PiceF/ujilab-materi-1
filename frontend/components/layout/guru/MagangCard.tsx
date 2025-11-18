import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MagangItem } from "./MagangItem"; // Import komponen item

export function MagangCard() {
    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader className="py-4 px-6 border-b">
                <CardTitle className="flex items-center text-base font-semibold text-gray-900">
                    <span className="mr-2 text-cyan-600">📝</span> Magang Terbaru
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
                <MagangItem
                    name="Ahmad Rizki"
                    company="PT. Teknologi Nusantara"
                    dateRange="15/1/2024 - 15/4/2024"
                    status="Aktif"
                />
                <MagangItem
                    name="Siti Nurhaliza"
                    company="CV. Digital Kreativa"
                    dateRange="20/1/2024 - 20/4/2024"
                    status="Aktif"
                />
                {/* ... item lainnya ... */}
            </CardContent>
        </Card>
    );
}