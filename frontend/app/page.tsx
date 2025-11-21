"use client";

import { useState } from "react";
import { User, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/service/AuthService";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            const res = await authService.login(email, password);

            console.log("📡 RESPONSE FROM API:", res);

            if (!res.success) {
                throw new Error(res.message || "Login tidak berhasil.");
            }

            // res.data = { user, token, token_type, siswa/guru/dudi }
            const { user, token } = res.data;

            if (!user || !token) {
                throw new Error("Format API tidak sesuai. Cek console.");
            }

            console.log("✅ LOGIN SUCCESS");
            console.log("USER:", user);
            console.log("ROLE:", user.role);

            // SIMPAN KE LOCALSTORAGE
            localStorage.setItem("access_token", token);
            localStorage.setItem("user", JSON.stringify(user));

            // 🔥 FIX: ENCODE USER DATA UNTUK COOKIE
            const encodedUser = encodeURIComponent(JSON.stringify(user));

            // SET COOKIE DENGAN BENAR
            document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `user_data=${encodedUser}; path=/; max-age=86400; SameSite=Lax`;

            console.log("🍪 COOKIE SET:");
            console.log("Token:", token.substring(0, 20) + "...");
            console.log("User:", encodedUser.substring(0, 50) + "...");

            // TUNGGU SEBENTAR AGAR COOKIE TER-SET
            await new Promise(resolve => setTimeout(resolve, 100));

            // REDIRECT BERDASARKAN ROLE
            if (user.role === "guru") {
                console.log("➡️ REDIRECT ke /guru/dashboard");
                router.push("/guru/dashboard");
            } else if (user.role === "siswa") {
                console.log("➡️ REDIRECT ke /siswa/dashboard");
                router.push("/siswa/dashboard");
            } else {
                console.log("➡️ REDIRECT ke /dashboard");
                router.push("/dashboard");
            }

            // FORCE REFRESH untuk trigger middleware
            router.refresh();

        } catch (error: any) {
            console.error("❌ LOGIN ERROR:", error);
            setErrorMsg(error.message || "Login gagal, periksa kembali email atau password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-200 to-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">

                    <div className="flex justify-center">
                        <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                        </div>
                    </div>

                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                        <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
                    </div>

                    {errorMsg && (
                        <p className="text-xs text-red-500 text-center">{errorMsg}</p>
                    )}

                    <form className="space-y-4" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? "Signing In..." : "Sign In"}
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            Don't have an account?{" "}
                            <Link href="/auth/Register" className="text-blue-600 hover:text-blue-800 font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}