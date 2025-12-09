"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabaseClient";

interface ProgressState {
  siswa_aktif_magang: number;
  logbook_hari_ini: number;
}

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
  const [progress, setProgress] = useState<ProgressState>({
    siswa_aktif_magang: 0,
    logbook_hari_ini: 0,
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  /** ======================
   * FETCH PROGRESS
   ====================== */
  const fetchProgress = useCallback(async () => {
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

      if (!res.ok) return;

      const data: ProgressState = await res.json();
      setProgress(data);
    } catch {
      // silent (UX > console panic)
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
    fetchProgress();
  }, [fetchProgress]);

  /** ======================
   * REALTIME LISTENER
   ====================== */
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("progress-card-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "magang" },
        fetchProgress
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "logbook" },
        fetchProgress
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProgress]);

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader className="py-4 px-6 border-b">
        <CardTitle className="flex items-center text-base font-semibold text-gray-900">
          <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
          Progress Overview
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {initialLoading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </>
        ) : (
          <>
            <ProgressItem
              label="Siswa Aktif Magang"
              value={progress.siswa_aktif_magang}
            />
            <ProgressItem
              label="Logbook Hari Ini"
              value={progress.logbook_hari_ini}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
