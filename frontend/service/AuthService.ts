// service/AuthService.ts
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL; // contoh: http://127.0.0.1:8000/api

// Fungsi untuk mendapatkan token dari localStorage
const getToken = (): string | null => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("token");
    }
    return null;
};

// Interceptor untuk menambahkan token ke header secara otomatis
axios.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (email: string, password: string) => {
        try {
            const res = await axios.post(`${API_URL}/login`, {
                email,
                password,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            });

            // Simpan token setelah login berhasil
            if (res.data.token && typeof window !== "undefined") {
                localStorage.setItem("token", res.data.token);
            }

            return res.data; // contoh response: { token: "...", user: {...} }
        } catch (error) {
            throw error;
        }
    },

    // Method untuk request yang membutuhkan auth
    getProfile: async () => {
        try {
            const res = await axios.get(`${API_URL}/profile`);
            return res.data;
        } catch (error) {
            throw error;
        }
    },

    // Method untuk request lainnya yang membutuhkan auth
    updateProfile: async (data: any) => {
        try {
            const res = await axios.put(`${API_URL}/profile`, data);
            return res.data;
        } catch (error) {
            throw error;
        }
    },

    // Logout - hapus token
    logout: () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
        }
    },

    // Cek apakah user sudah login
    isAuthenticated: (): boolean => {
        if (typeof window !== "undefined") {
            return !!localStorage.getItem("token");
        }
        return false;
    },

    // Get token (jika diperlukan)
    getToken: getToken,
};