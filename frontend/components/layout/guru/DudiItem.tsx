import { MapPin, Phone } from "lucide-react";

interface DudiItemProps {
    company: string;
    address: string;
    phone: string;
    studentCount: number;
}

export function DudiItem({ company, address, phone, studentCount }: DudiItemProps) {
    return (
        <div className="py-3 border-b last:border-b-0 space-y-1">
            <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-800">{company}</p>
                {/* Badge Siswa Kanan */}
                <span className="px-3 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    {studentCount} siswa
                </span>
            </div>

            <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                <span>{address}</span>
            </div>

            <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                <span>{phone}</span>
            </div>
        </div>
    );
}