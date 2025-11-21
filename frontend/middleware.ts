import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;

    // Jika akses halaman guru atau siswa tanpa token → redirect
    if (
        req.nextUrl.pathname.startsWith("/guru") ||
        req.nextUrl.pathname.startsWith("/siswa")
    ) {
        if (!token) {
            return NextResponse.redirect(new URL("/", req.url));
        }
    }

    return NextResponse.next();
}

// Tentukan halaman apa saja yang dicegat middleware
export const config = {
    matcher: ["/guru/:path*", "/siswa/:path*"],
};
