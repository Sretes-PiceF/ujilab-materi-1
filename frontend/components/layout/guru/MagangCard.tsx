"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MagangItem } from "./MagangItem";
import type { MagangType } from "@/types/dashboard";

export function MagangCard() {
  const [items, setItems] = useState<MagangType[]>([]);

  useEffect(() => {
    const fetchMagang = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/magang`,
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

        const data: MagangType[] = await res.json();
        setItems(data);
      } catch (error) {
        console.error("Gagal memuat data magang:", error);
      }
    };

    fetchMagang();
  }, []);

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="py-4 px-6 border-b">
        <CardTitle className="flex items-center text-base font-semibold text-gray-900">
          <span className="mr-2 text-cyan-600">📝</span> Magang Terbaru
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada data magang.</p>
        ) : (
          items.map((item) => (
            <MagangItem
              key={item.id}
              name={item.siswa.nama}
              company={item.dudi.nama_perusahaan}
              dateRange={`${item.tanggal_mulai} - ${item.tanggal_selesai}`}
              status={item.status}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
