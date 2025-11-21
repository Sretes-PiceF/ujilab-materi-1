'use client';

import { Dudi, DudiFormData } from "@/types/dudi";
import { useEffect, useState } from "react";

export const useDudi = () => {
    const [dudiList, setDudiList] = useState<Dudi[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const getAuthHeaders = () => {
        const token = localStorage.getItem("access_token");
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    };

    // GET ALL DUDI LIST (untuk table) - GUNAKAN ENDPOINT BARU
    const fetchDudi = async () => {
        try {
            setLoading(true);
            setError(null);

            // GUNAKAN ENDPOINT /guru/dudi/list bukan /guru/dudi
            const response = await fetch(`${API_URL}/guru/dudi/list`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.status === 401) {
                localStorage.removeItem("access_token");
                window.location.href = "/";
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                setDudiList(result.data);
            } else {
                throw new Error(result.message || 'Failed to fetch DUDI data');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching DUDI:', err);
        } finally {
            setLoading(false);
        }
    };

    // GET DUDI BY ID
    const fetchDudiById = async (id: number): Promise<Dudi | null> => {
        try {
            const response = await fetch(`${API_URL}/guru/dudi/${id}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to fetch DUDI data');
            }
        } catch (err) {
            console.error('Error fetching DUDI by ID:', err);
            return null;
        }
    };

    // CREATE DUDI
    const createDudi = async (formData: DudiFormData): Promise<boolean> => {
        try {
            const response = await fetch(`${API_URL}/guru/create/dudi`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData),
            });

            const result = await response.json();
        console.log('Full response:', result);
            if (result.success) {
                await fetchDudi(); // Refresh list
                return true;
            } else {
                throw new Error(result.message || 'Failed to create DUDI');
            }
        } catch (err) {
            console.error('Error creating DUDI:', err);
            return false;
        }
    };

    // UPDATE DUDI
    const updateDudi = async (id: number, formData: DudiFormData): Promise<boolean> => {
        try {
            const response = await fetch(`${API_URL}/guru/update/dudi/${id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                await fetchDudi(); // Refresh list
                return true;
            } else {
                throw new Error(result.message || 'Failed to update DUDI');
            }
        } catch (err) {
            console.error('Error updating DUDI:', err);
            return false;
        }
    };

    // DELETE DUDI
    const deleteDudi = async (id: number): Promise<boolean> => {
        try {
            const response = await fetch(`${API_URL}/guru/delete/dudi/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            const result = await response.json();

            if (result.success) {
                await fetchDudi(); // Refresh list
                return true;
            } else {
                throw new Error(result.message || 'Failed to delete DUDI');
            }
        } catch (err) {
            console.error('Error deleting DUDI:', err);
            return false;
        }
    };

    useEffect(() => {
        fetchDudi();
    }, []);

    return {
        dudiList,
        loading,
        error,
        fetchDudi,
        fetchDudiById,
        createDudi,
        updateDudi,
        deleteDudi,
    };
};