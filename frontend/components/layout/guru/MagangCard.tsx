"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MagangItem } from "./MagangItem";
import type { MagangType } from "@/types/dashboard";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";

export function MagangCard() {
  const [items, setItems] = useState<MagangType[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  /** ======================
   * FETCH MAGANG TERBARU
   ====================== */
  const fetchMagang = useCallback(async () => {
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

      if (!res.ok) return;

      const data: MagangType[] = await res.json();
      setItems(data);
    } catch {
      // silent error
    } finally {
      // Skeleton hanya di load pertama
      if (!hasLoadedOnce.current) {
        setInitialLoading(false);
        hasLoadedOnce.current = true;
      }
    }
  }, []);

  /** ======================
   * INITIAL LOAD
   ====================== */
  useEffect(() => {
    fetchMagang();
  }, [fetchMagang]);

  /** ======================
   * REALTIME MAGANG
   ====================== */
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("magang-card-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "magang" },
        fetchMagang
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMagang]);

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="py-4 px-6 border-b">
        <CardTitle className="flex items-center text-base font-semibold text-gray-900">
          <span className="mr-2 text-cyan-600">📝</span>
          Magang Terbaru
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {initialLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </>
        ) : items.length === 0 ? (
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
