import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const authService = {
    login: async (email: string, password: string) => {
        try {
            const response = await axios.post(
                `${API_URL}/login`,
                { email, password },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            );

            // API Laravel mengembalikan: { success, message, data: { user, token, token_type, siswa/guru/dudi } }
            console.log("📡 API RESPONSE:", response.data);

            // Return response.data langsung karena sudah format yang benar
            return response.data;

        } catch (error: any) {
            console.error("❌ API ERROR:", error.response?.data || error.message);
            
            // Jika error dari API (401, 422, dll)
            if (error.response?.data) {
                return error.response.data;
            }

            // Jika network error atau error lain
            return {
                success: false,
                message: error.message || "Terjadi kesalahan saat login",
            };
        }
    },
};