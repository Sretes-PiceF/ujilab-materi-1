"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";

interface ProgressItemProps {
  label: string;
  value: number;
}

const ProgressItem = ({ label, value }: ProgressItemProps) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm text-gray-700">
      <span>{label}</span>
      <span className="font-semibold">{value}%</span>
    </div>
    <Progress value={value} className="h-2 [&>div]:bg-blue-500" />
  </div>
);

export function ProgressCard() {
  const [progress, setProgress] = useState({
    siswa_aktif_magang: 0,
    logbook_hari_ini: 0,
  });

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/progress`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              Accept: "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          }
        );
        const data = await res.json();
        setProgress(data);
      } catch (error) {
        console.error("Gagal memuat progress:", error);
      }
    };

    fetchProgress();
  }, []);

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="py-4 px-6 border-b">
        <CardTitle className="flex items-center text-base font-semibold text-gray-900">
          <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
          Progress Overview
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <ProgressItem
          label="Siswa Aktif Magang"
          value={progress.siswa_aktif_magang}
        />
        <ProgressItem
          label="Logbook Hari Ini"
          value={progress.logbook_hari_ini}
        />
      </CardContent>
    </Card>
  );
}
