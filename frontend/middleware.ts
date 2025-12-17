import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const userDataRaw = req.cookies.get("user_data")?.value;

  const { pathname } = req.nextUrl;

  console.log("====== MIDDLEWARE DEBUG ======");
  console.log("PATH       :", pathname);
  console.log("TOKEN      :", token ? "(ADA)" : "(TIDAK ADA)");
  console.log("USER RAW   :", userDataRaw ? userDataRaw.substring(0, 50) + "..." : "(null)");

  //  FIX: DECODE USER DATA
  let user = null;
  try {
    if (userDataRaw) {
      const decoded = decodeURIComponent(userDataRaw);
      user = JSON.parse(decoded);
    }
  } catch (error) {
    console.log("ERROR: JSON PARSE USER", error);
    user = null;
  }

  console.log("USER PARSED:", user);
  console.log("ROLE       :", user?.role || "(tidak ada)");
  console.log("================================\n");

  const isAuthRoute = pathname.startsWith("/siswa") || pathname.startsWith("/guru");
  const isLoginPage = pathname === "/";

  //  Proteksi halaman siswa & guru
  if (isAuthRoute) {
    console.log(" AUTH ROUTE TERDETEKSI:", pathname);

    if (!token || !user) {
      console.log(" BLOKIR — token/user tidak ada, redirect ke /");
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Role check untuk siswa
    if (pathname.startsWith("/siswa") && user.role !== "siswa") {
      console.log(" ROLE SALAH — mau ke siswa tapi role:", user.role);
      return NextResponse.redirect(
        new URL(user.role === "guru" ? "/guru/dashboard" : "/", req.url)
      );
    }

    // Role check untuk guru
    if (pathname.startsWith("/guru") && user.role !== "guru") {
      console.log(" ROLE SALAH — mau ke guru tapi role:", user.role);
      return NextResponse.redirect(
        new URL(user.role === "siswa" ? "/siswa/dashboard" : "/", req.url)
      );
    }

    console.log(" ROLE VALID — akses diizinkan.\n");
  }

  // Redirect dari halaman login jika sudah login
  if (isLoginPage && token && user?.role) {
    console.log(" LOGIN PAGE — user sudah login, redirect berdasarkan role.");

    if (user.role === "siswa") {
      return NextResponse.redirect(new URL("/siswa/dashboard", req.url));
    }
    if (user.role === "guru") {
      return NextResponse.redirect(new URL("/guru/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};