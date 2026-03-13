import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_APP_API_URL || 'http://localhost:8082',
  prepareHeaders: (headers, { getState, endpoint }) => {
    const state = getState() as RootState;
    const session = JSON.parse(localStorage.getItem('auth') || '{}');
    const sucursalId = localStorage.getItem('sucursal');

    // Agregar token de autorización
    if (session.token) {
      headers.set('Authorization', `Bearer ${session.token}`);
    }

    // Agregar ID de usuario
    if (session.id) {
      headers.set('X-User', String(session.id));
    }

    // NO establecer Content-Type si no existe (permite que el navegador lo maneje para FormData)
    // Solo establecerlo si ya está definido explícitamente
    // El navegador establecerá automáticamente 'multipart/form-data' para FormData

    return headers;
  }
});

const baseQueryWithAuth = async (args: any, api: any, extraOptions: any) => {
  const result = await baseQuery(args, api, extraOptions);

  // Si hay error 401, limpiar sesión
  if (result.error && result.error.status === 401) {
    localStorage.removeItem('auth');
    localStorage.removeItem('sucursal');
    window.location.href = '/auth';
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    'User',
    'Product',
    'Order',
    'Generic',
    'Menu',
    'Inventory',
    'NotasCredito',
    'Ventas',
    'Productos',
    'Report'
  ],
  // Configuración global de caché
  keepUnusedDataFor: 300, // 5 minutos por defecto
  refetchOnMountOrArgChange: false, // No refetch automático al montar
  refetchOnFocus: false, // No refetch cuando la ventana obtiene foco
  refetchOnReconnect: true, // Sí refetch cuando se reconecta la red
  endpoints: () => ({})
});
