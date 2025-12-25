// AuthService.ts
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

  logout: async (): Promise<{ success: boolean; message: string }> => {
    try {
      // Ambil token dari berbagai sumber
      const tokenFromLocalStorage = localStorage.getItem("access_token");
      const tokenFromSessionStorage = sessionStorage.getItem("access_token");
      const token = tokenFromLocalStorage || tokenFromSessionStorage;
      
      if (!token) {
        console.log("⚠️ Tidak ada token yang ditemukan");
        return { 
          success: true, 
          message: "Tidak ada token, melanjutkan cleanup lokal" 
        };
      }

      console.log("📡 Mengirim request logout ke backend...");
      const response = await axios.post(
        `${API_URL}/logout`,
        {},
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Response dari API logout:", response.data);
      return response.data;
      
    } catch (error: any) {
      console.error("❌ Error saat API logout:", error);
      
      // Jika error karena token invalid/expired, anggap berhasil
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { 
          success: true, 
          message: "Token expired/invalid, melanjutkan cleanup" 
        };
      }
      
      // Untuk error lainnya, tetap return sukses untuk local cleanup
      return {
        success: true,
        message: error.message || "Melanjutkan cleanup lokal",
      };
    }
  },

  getProfile: async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/profile`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

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
      const response = await axios.put(`${API_URL}/profile`, userData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

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

  // Fungsi helper untuk membersihkan semua data autentikasi di client
  clearClientAuthData: (): void => {
    console.log("🧹 Membersihkan data autentikasi di client...");
    
    // 1. Clear localStorage
    const localStorageKeys = [
      "access_token",
      "user",
      "user_data",
      "refresh_token",
      "token",
      "auth_token",
      "auth_user"
    ];
    
    localStorageKeys.forEach(key => localStorage.removeItem(key));
    localStorage.clear();
    
    // 2. Clear sessionStorage
    sessionStorage.clear();
    
    // 3. Clear cookies
    const cookieNames = [
      "access_token",
      "user_data",
      "refresh_token",
      "token",
      "laravel_session",
      "XSRF-TOKEN"
    ];
    
    cookieNames.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/siswa;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/guru;`;
    });
    
    console.log("✅ Data client telah dibersihkan");
  }
};