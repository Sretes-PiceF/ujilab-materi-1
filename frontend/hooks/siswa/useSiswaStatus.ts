'use client'
import { useState, useEffect } from 'react';

export function useSiswaStatus() {
    const [statusMagang, setStatusMagang] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                setLoading(true);
                // Ganti dengan API call yang sesuai
                const response = await fetch('/api/siswa/status-magang');
                const data = await response.json();
                
                if (data.success) {
                    setStatusMagang(data.data.status);
                } else {
                    setError(data.message);
                }
            } catch (err) {
                setError('Gagal memuat status magang');
            } finally {
                setLoading(false);
            }
        };
        
        fetchStatus();
    }, []);
    
    return {
        statusMagang,
        loading,
        error
    };
}