"use client";

import { useRef, useState } from "react";
import { User, Mail, Lock, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/service/AuthService";
import ReCAPTCHA from "react-google-recaptcha";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showError, setShowError] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleCloseError = () => {
    setShowError(false);
    setErrorMsg("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setShowError(false);

    if (!captchaToken) {
      setErrorMsg("Harap selesaikan reCAPTCHA terlebih dahulu.");
      setShowError(true);
      setLoading(false);
      return;
    }
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }

    try {
      const res = await authService.login(email, password, captchaToken);

      if (!res.success) {
        throw new Error(res.message || "Login tidak berhasil.");
      }

      const { user, token } = res.data;

      if (!user || !token) {
        throw new Error("Terjadi kesalahan pada sistem. Silakan coba lagi.");
      }

      // Simpan ke localStorage
      localStorage.setItem("access_token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Encode user data untuk cookie
      const encodedUser = encodeURIComponent(JSON.stringify(user));

      // Set cookie
      document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `user_data=${encodedUser}; path=/; max-age=86400; SameSite=Lax`;

      // Tunggu cookie ter-set
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redirect berdasarkan role
      if (user.role === "guru") {
        router.push("/guru/dashboard");
      } else if (user.role === "siswa") {
        router.push("/siswa/dashboard");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch (error: any) {
      const message =
        error.message || "Login gagal, periksa kembali email atau password.";
      setErrorMsg(message);
      setShowError(true);

      // Auto-hide error setelah 6 detik
      setTimeout(() => {
        setShowError(false);
      }, 6000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6 relative">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to your account
            </p>
          </div>

          {/* Error Alert dengan Animasi */}
          {showError && errorMsg && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-400 rounded-lg p-4 shadow-lg relative overflow-hidden animate-slideDown">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 animate-bounce">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 mb-1">
                    Login Gagal
                  </h3>
                  <p className="text-xs text-red-700">{errorMsg}</p>
                </div>
                <button
                  onClick={handleCloseError}
                  className="flex-shrink-0 text-red-600 hover:text-red-800 hover:bg-red-200 rounded-full p-1 transition-all"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-red-600 rounded-b-lg animate-shrink"></div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (showError) setShowError(false);
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (showError) setShowError(false);
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <div className="w-full pl-10 pr-2 py-5 border-gray-200 rounded-lg transition-all ">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                  onChange={(token) => setCaptchaToken(token || "")}
                  onExpired={() => {
                    setCaptchaToken("");
                    recaptchaRef.current?.reset();
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              type="button"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Dont have an account?{" "}
              <Link
                href="/auth/Register"
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }

        .animate-shrink {
          animation: shrink 6s linear;
        }
      `}</style>
    </div>
  );
}
