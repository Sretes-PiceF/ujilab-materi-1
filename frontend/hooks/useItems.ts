import { useEffect, useState } from 'react';
import useSWR from 'swr';
import api from '@/lib/axios';
import { initEcho } from '@/lib/echo';

interface Item {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UseItemsOptions {
  page?: number;
  limit?: number;
  status?: string;
  realtime?: boolean;
}

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function useItems(options: UseItemsOptions = {}) {
  const { page = 1, limit = 50, status, realtime = true } = options;
  
  // Build query string
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (status) params.append('status', status);
  
  const queryString = params.toString();
  const url = `/items?${queryString}`;

  // Use SWR for data fetching with cache
  const { data, error, mutate, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5000, // Cache for 5 seconds
  });

  // Setup realtime listeners
  useEffect(() => {
    if (!realtime) return;

    const echo = initEcho();
    
    // Subscribe to items channel
    const channel = echo.channel('items');

    // Listen for new items
    channel.listen('.item.created', (payload: Item) => {
      console.log('Item created:', payload);
      mutate(); // Revalidate data
    });

    // Listen for updated items
    channel.listen('.item.updated', (payload: Item) => {
      console.log('Item updated:', payload);
      mutate(); // Revalidate data
    });

    // Listen for deleted items
    channel.listen('.item.deleted', (payload: { id: string }) => {
      console.log('Item deleted:', payload);
      mutate(); // Revalidate data
    });

    // Cleanup
    return () => {
      channel.stopListening('.item.created');
      channel.stopListening('.item.updated');
      channel.stopListening('.item.deleted');
      echo.leave('items');
    };
  }, [realtime, mutate]);

  return {
    items: data?.data?.data || [],
    pagination: {
      current_page: data?.data?.current_page || 1,
      last_page: data?.data?.last_page || 1,
      per_page: data?.data?.per_page || limit,
      total: data?.data?.total || 0,
    },
    source: data?.source || 'unknown',
    isLoading,
    error,
    mutate, // Manual refetch
  };
}

// Hook untuk CRUD operations
export function useItemMutations() {
  const [loading, setLoading] = useState(false);

  const createItem = async (data: Partial<Item>) => {
    setLoading(true);
    try {
      const response = await api.post('/items', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, data: Partial<Item>) => {
    setLoading(true);
    try {
      const response = await api.put(`/items/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    setLoading(true);
    try {
      const response = await api.delete(`/items/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    setLoading(true);
    try {
      const response = await api.post('/items/clear-cache');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  return {
    createItem,
    updateItem,
    deleteItem,
    clearCache,
    loading,
  };
}