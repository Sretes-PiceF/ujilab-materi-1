"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { DudiItem } from "./DudiItem";
import type { DudiType } from "@/types/dashboard"; // import type

export function DudiCard() {
  const [dudi, setDudi] = useState<DudiType[]>([]); // ← NO ANY

  useEffect(() => {
    const fetchDudi = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/dudi`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              Accept: "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        if (!res.ok) {
          console.error("Gagal fetch:", res.status);
          return;
        }

        const data: DudiType[] = await res.json(); // ← STRICT TYPE
        setDudi(data);
      } catch (error) {
        console.error("Gagal memuat data DUDI:", error);
      }
    };

    fetchDudi();
  }, []);

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="py-4 px-6 border-b">
        <CardTitle className="flex items-center text-base font-semibold text-gray-900">
          <Briefcase className="h-4 w-4 mr-2 text-orange-500" /> DUDI Aktif
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-2">
        {dudi.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada DUDI aktif.</p>
        ) : (
          dudi.map((item) => (
            <DudiItem
              key={item.id}
              company={item.nama_perusahaan}
              address={item.alamat}
              phone={item.telepon}
              studentCount={item.student_count}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
