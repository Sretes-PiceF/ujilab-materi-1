"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const useAuth = () => {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/");
        }
    }, []);
};
