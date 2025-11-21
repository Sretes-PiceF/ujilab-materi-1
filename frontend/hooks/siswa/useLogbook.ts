// hooks/useLogbook.ts
import { useState, useEffect } from 'react';

export interface LogbookData {
    id: number;
    magang_id: number;
    tanggal: string;
    tanggal_formatted: string;
    kegiatan: string;
    kendala: string;
    file: string | null;
    status_verifikasi: 'pending' | 'disetujui' | 'ditolak';
    catatan_guru: string | null;
    catatan_dudi: string | null;
    dudi: {
        id: number | null;
        nama_perusahaan: string | null;
    };
    created_at: string;
    updated_at: string;
}

interface LogbookResponse {
    success: boolean;
    data: LogbookData[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    message?: string;
}

interface CreateLogbookData {
    tanggal: string;
    kegiatan: string;
    kendala: string;
    file?: File;
}

// Base URL untuk API Laravel
const API_BASE_URL = 'http://localhost:8000';

// Helper function untuk mendapatkan token dari cookies
const getAuthToken = (): string | null => {
    if (typeof document !== 'undefined') {
        // Mengambil token dari cookies
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
        if (tokenCookie) {
            return tokenCookie.split('=')[1];
        }
    }
    return null;
};

// Helper function untuk mendapatkan headers
const getHeaders = (contentType: string = 'application/json'): HeadersInit => {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Accept': 'application/json',
    };

    // Only add Content-Type if it's not FormData
    if (contentType !== 'multipart/form-data') {
        headers['Content-Type'] = contentType;
    }

    // Add Authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Add X-Requested-With header for Laravel
    headers['X-Requested-With'] = 'XMLHttpRequest';

    return headers;
};

export const useLogbook = () => {
    const [logbooks, setLogbooks] = useState<LogbookData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0
    });

    // Debug function
    const debugResponse = async (response: Response, context: string) => {
        console.group(`🔍 DEBUG RESPONSE - ${context}`);
        console.log('URL:', response.url);
        console.log('Status:', response.status, response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Raw Response:', responseText);
        
        try {
            const jsonData = JSON.parse(responseText);
            console.log('Parsed JSON:', jsonData);
        } catch (e) {
            console.log('❌ JSON Parse Error:', e);
            console.log('Response is not valid JSON');
        }
        console.groupEnd();
        
        // Return the text for further processing
        return responseText;
    };

    // Check authentication status
    const checkAuth = (): boolean => {
        const token = getAuthToken();
        console.log('🔐 Auth Check - Token:', token ? '✅ Available' : '❌ Missing');
        
        if (!token) {
            setError('Anda belum login. Silakan login terlebih dahulu.');
            return false;
        }
        return true;
    };

    // Handle unauthorized response
    const handleUnauthorized = () => {
        setError('Sesi Anda telah berakhir. Silakan login kembali.');
        // Redirect to login page
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
    };

    // Fetch logbooks
    const fetchLogbooks = async (page = 1, perPage = 10, search = '', status = 'all') => {
        // Check authentication first
        if (!checkAuth()) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            console.group('🔄 FETCH LOGBOOKS');
            console.log('Params:', { page, perPage, search, status });

            const token = getAuthToken();
            console.log('Auth Token:', token ? '✅ Available' : '❌ Missing');
            console.log('Cookies:', document.cookie);

            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString(),
                ...(search && { search }),
                ...(status !== 'all' && { status })
            });

            const apiUrl = `${API_BASE_URL}/api/siswa/logbook?${params}`;
            console.log('API URL:', apiUrl);

            const response = await fetch(apiUrl, {
                headers: getHeaders(),
                credentials: 'include' // Important for cookies
            });

            // Debug the response
            const responseText = await debugResponse(response, 'FETCH LOGBOOKS');

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let data: LogbookResponse;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                throw new Error('Response is not valid JSON');
            }
            
            if (data.success) {
                console.log('✅ Data fetched successfully:', data.data);
                setLogbooks(data.data);
                if (data.meta) {
                    setPagination(data.meta);
                }
            } else {
                console.error('❌ API returned error:', data.message);
                throw new Error(data.message || 'Gagal mengambil data logbook');
            }
        } catch (err) {
            console.error('❌ Fetch error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
            setError(errorMessage);
        } finally {
            setLoading(false);
            console.groupEnd();
        }
    };

    // Create logbook
    const createLogbook = async (logbookData: CreateLogbookData): Promise<{success: boolean; message: string; data?: LogbookData}> => {
        // Check authentication first
        if (!checkAuth()) {
            return {
                success: false,
                message: 'Anda belum login. Silakan login terlebih dahulu.'
            };
        }

        try {
            console.group('🔄 CREATE LOGBOOK');
            console.log('Logbook data:', logbookData);

            const token = getAuthToken();
            console.log('Auth Token:', token ? '✅ Available' : '❌ Missing');

            const formData = new FormData();
            formData.append('tanggal', logbookData.tanggal);
            formData.append('kegiatan', logbookData.kegiatan);
            formData.append('kendala', logbookData.kendala);
            
            if (logbookData.file) {
                formData.append('file', logbookData.file);
                console.log('File attached:', logbookData.file.name);
            }

            const response = await fetch(`${API_BASE_URL}/siswa/logbook/create`, {
                method: 'POST',
                headers: getHeaders('multipart/form-data'),
                body: formData,
                credentials: 'include'
            });

            // Debug the response
            const responseText = await debugResponse(response, 'CREATE LOGBOOK');

            if (response.status === 401) {
                handleUnauthorized();
                return {
                    success: false,
                    message: 'Sesi telah berakhir'
                };
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                return {
                    success: false,
                    message: 'Response is not valid JSON'
                };
            }
            
            console.log('Create result:', result);
            
            if (result.success) {
                console.log('✅ Logbook created successfully');
                await fetchLogbooks();
            } else {
                console.error('❌ Create failed:', result.message);
            }
            
            return result;
        } catch (err) {
            console.error('❌ Create error:', err);
            return {
                success: false,
                message: err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat logbook'
            };
        } finally {
            console.groupEnd();
        }
    };

    // Update logbook
    const updateLogbook = async (id: number, logbookData: Partial<CreateLogbookData>): Promise<{success: boolean; message: string}> => {
        // Check authentication first
        if (!checkAuth()) {
            return {
                success: false,
                message: 'Anda belum login. Silakan login terlebih dahulu.'
            };
        }

        try {
            console.group('🔄 UPDATE LOGBOOK');
            console.log('Update data:', { id, logbookData });

            const token = getAuthToken();
            console.log('Auth Token:', token ? '✅ Available' : '❌ Missing');

            const formData = new FormData();
            if (logbookData.tanggal) formData.append('tanggal', logbookData.tanggal);
            if (logbookData.kegiatan) formData.append('kegiatan', logbookData.kegiatan);
            if (logbookData.kendala) formData.append('kendala', logbookData.kendala);
            
            if (logbookData.file) {
                formData.append('file', logbookData.file);
            }

            const response = await fetch(`${API_BASE_URL}/api/siswa/logbook/update/${id}`, {
                method: 'PATCH',
                headers: getHeaders('multipart/form-data'),
                body: formData,
                credentials: 'include'
            });

            // Debug the response
            const responseText = await debugResponse(response, 'UPDATE LOGBOOK');

            if (response.status === 401) {
                handleUnauthorized();
                return {
                    success: false,
                    message: 'Sesi telah berakhir'
                };
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                return {
                    success: false,
                    message: 'Response is not valid JSON'
                };
            }
            
            console.log('Update result:', result);
            
            if (result.success) {
                console.log('✅ Logbook updated successfully');
                await fetchLogbooks();
            }
            
            return result;
        } catch (err) {
            console.error('❌ Update error:', err);
            return {
                success: false,
                message: err instanceof Error ? err.message : 'Terjadi kesalahan saat mengupdate logbook'
            };
        } finally {
            console.groupEnd();
        }
    };

    // Delete logbook
    const deleteLogbook = async (id: number): Promise<{success: boolean; message: string}> => {
        // Check authentication first
        if (!checkAuth()) {
            return {
                success: false,
                message: 'Anda belum login. Silakan login terlebih dahulu.'
            };
        }

        try {
            console.group('🔄 DELETE LOGBOOK');
            console.log('Delete ID:', id);

            const token = getAuthToken();
            console.log('Auth Token:', token ? '✅ Available' : '❌ Missing');

            const response = await fetch(`${API_BASE_URL}/api/siswa/logbook/delete/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
                credentials: 'include'
            });

            // Debug the response
            const responseText = await debugResponse(response, 'DELETE LOGBOOK');

            if (response.status === 401) {
                handleUnauthorized();
                return {
                    success: false,
                    message: 'Sesi telah berakhir'
                };
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                return {
                    success: false,
                    message: 'Response is not valid JSON'
                };
            }
            
            console.log('Delete result:', result);
            
            if (result.success) {
                console.log('✅ Logbook deleted successfully');
                await fetchLogbooks();
            }
            
            return result;
        } catch (err) {
            console.error('❌ Delete error:', err);
            return {
                success: false,
                message: err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus logbook'
            };
        } finally {
            console.groupEnd();
        }
    };

    // Get logbook detail
    const getLogbookDetail = async (id: number): Promise<{success: boolean; data?: LogbookData; message?: string}> => {
        // Check authentication first
        if (!checkAuth()) {
            return {
                success: false,
                message: 'Anda belum login. Silakan login terlebih dahulu.'
            };
        }

        try {
            console.group('🔄 GET LOGBOOK DETAIL');
            console.log('Logbook ID:', id);

            const token = getAuthToken();
            console.log('Auth Token:', token ? '✅ Available' : '❌ Missing');

            const response = await fetch(`${API_BASE_URL}/api/siswa/logbook/${id}`, {
                headers: getHeaders(),
                credentials: 'include'
            });

            // Debug the response
            const responseText = await debugResponse(response, 'GET LOGBOOK DETAIL');

            if (response.status === 401) {
                handleUnauthorized();
                return {
                    success: false,
                    message: 'Sesi telah berakhir'
                };
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                return {
                    success: false,
                    message: 'Response is not valid JSON'
                };
            }
            
            console.log('Detail result:', result);
            return result;
        } catch (err) {
            console.error('❌ Get detail error:', err);
            return {
                success: false,
                message: err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil detail logbook'
            };
        } finally {
            console.groupEnd();
        }
    };

    // Clear error
    const clearError = () => {
        setError(null);
    };

    useEffect(() => {
        console.log('🎯 useLogbook hook mounted, fetching initial data...');
        console.log('Initial Auth Token:', getAuthToken() ? '✅ Available' : '❌ Missing');
        console.log('All Cookies:', document.cookie);
        fetchLogbooks();
    }, []);

    return {
        logbooks,
        loading,
        error,
        pagination,
        fetchLogbooks,
        createLogbook,
        updateLogbook,
        deleteLogbook,
        getLogbookDetail,
        clearError
    };
};