// components/LogbookItem.tsx
import { BookOpen } from "lucide-react";

interface LogbookItemProps {
    activity: string;
    date: string;
    note: string;
    status: 'Disetujui' | 'Menunggu';
}

export function LogbookItem({ activity, date, note, status }: LogbookItemProps) {
    const statusClass = status === 'Disetujui' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600';

    return (
        <div className="py-3 border-b last:border-b-0 space-y-1">
            <div className="flex justify-between items-start">
                {/* Detail Kiri */}
                <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-green-100 text-green-600 shrink-0 mt-1">
                        <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{activity}</p>
                        <p className="text-xs text-gray-500">{date}</p>
                        <p className="text-sm text-orange-700 italic">{note}</p>
                    </div>
                </div>

                {/* Status Kanan */}
                <div className={`px-3 py-1 text-xs font-medium rounded-full ${statusClass} shrink-0`}>
                    {status}
                </div>
            </div>
        </div>
    );
}