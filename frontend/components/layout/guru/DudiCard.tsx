"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { DudiItem } from "./DudiItem";
import type { DudiType } from "@/types/dashboard";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";

export function DudiCard() {
  const [dudi, setDudi] = useState<DudiType[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  /** ======================
   * FETCH DUDI AKTIF
   ====================== */
  const fetchDudi = useCallback(async () => {
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

      if (!res.ok) return;

      const data: DudiType[] = await res.json();
      setDudi(data);
    } catch {
      // silent fail (UX tetap jalan)
    } finally {
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
    fetchDudi();
  }, [fetchDudi]);

  /** ======================
   * REALTIME DUDI
   ====================== */
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("dudi-card-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dudi" },
        fetchDudi
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDudi]);

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="py-4 px-6 border-b">
        <CardTitle className="flex items-center text-base font-semibold text-gray-900">
          <Briefcase className="h-4 w-4 mr-2 text-orange-500" />
          DUDI Aktif
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {initialLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </>
        ) : dudi.length === 0 ? (
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
