"use client";

import { User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function TopbarSiswa() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });

        const result = await res.json();
        if (result.success) {
          setUserData(result.data.user);
        }
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="w-full h-[93px] flex items-center justify-between px-8 bg-white border-b border-gray-100">
      {/* ================= LEFT (TIDAK SKELETON) ================= */}
      <div className="flex flex-col leading-tight">
        <h1 className="text-xl font-semibold text-gray-800">SIMNAS</h1>
        <p className="text-sm text-gray-500 -mt-0.5">
          Sistem Pelaporan Magang Siswa SIMNAS
        </p>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight space-y-1">
          {loading ? (
            <>
              <Skeleton className="h-4 w-28 bg-gray-200 ml-auto" />
              <Skeleton className="h-3 w-20 bg-gray-200 ml-auto" />
            </>
          ) : (
            <>
              <p className="font-semibold text-sm text-gray-800">
                {userData?.name}
              </p>
              <p className="text-xs text-gray-500 -mt-0.5">{userData?.role}</p>
            </>
          )}
        </div>

        {/* AVATAR — TETAP MUNCUL */}
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="h-5 w-5 text-gray-600" />
        </div>
      </div>
    </div>
  );
}
