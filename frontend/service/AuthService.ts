import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const authService = {
    login: async (email: string, password: string, recaptchaToken: string) => {
        try {
            const response = await axios.post(
                `${API_URL}/login`,
                { email, password, recaptcha_token: recaptchaToken },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            );

            return response.data;

        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data;
            }

            return {
                success: false,
                message: error.message || "Terjadi kesalahan saat login",
            };
        }
    },

    register: async (userData: any) => {
        try {
            const response = await axios.post(
                `${API_URL}/register`,
                userData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            );

            return response.data;

        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data;
            }

            return {
                success: false,
                message: error.message || "Terjadi kesalahan saat registrasi",
            };
        }
    },

    logout: async (token: string) => {
        try {
            const response = await axios.post(
                `${API_URL}/logout`,
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data;

        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data;
            }

            return {
                success: false,
                message: error.message || "Terjadi kesalahan saat logout",
            };
        }
    },

    getProfile: async (token: string) => {
        try {
            const response = await axios.get(
                `${API_URL}/profile`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data;

        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data;
            }

            return {
                success: false,
                message: error.message || "Terjadi kesalahan saat mengambil profil",
            };
        }
    },

    updateProfile: async (token: string, userData: any) => {
        try {
            const response = await axios.put(
                `${API_URL}/profile`,
                userData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data;

        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data;
            }

            return {
                success: false,
                message: error.message || "Terjadi kesalahan saat update profil",
            };
        }
    },

    changePassword: async (token: string, passwordData: any) => {
        try {
            const response = await axios.post(
                `${API_URL}/change-password`,
                passwordData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data;

        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data;
            }

            return {
                success: false,
                message: error.message || "Terjadi kesalahan saat mengganti password",
            };
        }
    },

    refreshToken: async (token: string) => {
        try {
            const response = await axios.post(
                `${API_URL}/refresh`,
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data;

        } catch (error: any) {
            if (error.response?.data) {
                return error.response.data;
            }

            return {
                success: false,
                message: error.message || "Terjadi kesalahan saat refresh token",
            };
        }
    },
};