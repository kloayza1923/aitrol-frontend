import { useEffect, useState } from 'react';
import { FetchData, clearCache } from '@/utils/FetchData';

interface UseFetchOptions {
  method?: string;
  data?: any;
  headers?: HeadersInit;
  cacheTime?: number; // segundos
  enabled?: boolean; // si la petición debe ejecutarse automáticamente
}

export function useFetchData<T = any>(
  url: string,
  {
    method = 'GET',
    data,
    headers,
    cacheTime = 60, // 1 min por defecto
    enabled = true
  }: UseFetchOptions = {}
) {
  const [response, setResponse] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<any>(null);

  const refetch = async (overrideData?: any) => {
    try {
      setLoading(true);
      setError(null);
      const finalData = overrideData !== undefined ? overrideData : data;
      const res = await FetchData(url, method, finalData, headers, cacheTime);
      setResponse(res);
      return res;
    } catch (err) {
      console.error('useFetchData error:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled]);

  return {
    data: response,
    loading,
    error,
    refetch,
    clearCache: () => clearCache(url),
    // Métodos helper para diferentes HTTP methods
    post: (postData?: any) => refetch({ ...data, ...postData }),
    put: (putData?: any) => refetch({ ...data, ...putData }),
    delete: (deleteData?: any) => refetch({ ...data, ...deleteData })
  };
}
