import { GraduationCap } from "lucide-react";

interface MagangItemProps {
    name: string;
    company: string;
    dateRange: string;
    status: 'Aktif' | 'Selesai';
}

export function MagangItem({ name, company, dateRange, status }: MagangItemProps) {
    const statusClass = status === 'Aktif' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600';

    return (
        <div className="flex items-center space-x-3 py-3 border-b last:border-b-0">
            {/* Ikon Kiri */}
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-cyan-100 text-cyan-600 shrink-0">
                <GraduationCap className="h-5 w-5" />
            </div>

            {/* Detail Tengah */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{name}</p>
                <p className="text-sm text-gray-600 truncate">{company}</p>
                <p className="text-xs text-gray-500">{dateRange}</p>
            </div>

            {/* Status Kanan */}
            <div className={`px-3 py-1 text-xs font-medium rounded-full ${statusClass} shrink-0`}>
                {status}
            </div>
        </div>
    );
}