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

            // RAW DATA YANG BENAR
            const api = res.data;

            const user = api.user;
            const token = api.token;

            if (!user || !token) {
                throw new Error("Response dari API tidak sesuai.");
            }

            console.log("USER ROLE:", user.role);

            // SIMPAN TOKEN DAN USER
            localStorage.setItem("access_token", token);
            localStorage.setItem("user", JSON.stringify(user));

            document.cookie = `access_token=${token}; path=/;`;

            // CEK ROLE
            if (user.role === "guru") {
                router.push("/guru/dashboard");
            } else if (user.role === "siswa") {
                router.push("/siswa/dashboard");
            } else {
                router.push("/dashboard");
            }

        } catch (error: any) {

            console.log("🛑 ERROR RAW:", error);
            console.log("🛑 ERROR RES:", error.response);
            console.log("🛑 ERROR DATA:", error.response?.data);
            console.log("🛑 ERROR STATUS:", error.response?.status);

            setErrorMsg("Login gagal, periksa kembali data Anda.");
        }
        finally {
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
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            {loading ? "Signing In..." : "Sign In"}
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            Dont have an account?{" "}
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
