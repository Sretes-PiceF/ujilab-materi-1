import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { DudiItem } from "./DudiItem";

export function DudiCard() {
    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader className="py-4 px-6 border-b">
                <CardTitle className="flex items-center text-base font-semibold text-gray-900">
                    <Briefcase className="h-4 w-4 mr-2 text-orange-500" /> DUDI Aktif
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
                <DudiItem
                    company="PT. Teknologi Nusantara"
                    address="Jl. HR Muhammad No. 123, Surabaya"
                    phone="031-5551234"
                    studentCount={8}
                />
                {/* ... DudiItem lainnya ... */}
            </CardContent>
        </Card>
    );
}