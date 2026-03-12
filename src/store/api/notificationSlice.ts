import { apiSlice } from './apiSlice';
import { purchaseVsSalesApi } from './inventory/purchasevssales';

// Interface para el menú
interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  fecha_creacion: string;
  estado: string;
  ruta_archivo?: string;
}

// Menu API Slice con RTK Query
export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET Menu del usuario con cache largo
    getNotification: builder.query<Notificacion[], void>({
      query: () => '/notificaciones',
      providesTags: (result) => (result ? [{ type: 'Notification', id: 'LIST' }] : []),
      // Cache por 10 minutos (600 segundos)
      keepUnusedDataFor: 600,
      transformResponse: (response: any): Notificacion[] => {
        // Asegurarse de que siempre retornemos un array
        return Array.isArray(response) ? response : [];
      }
    }),
    getUnreadCount: builder.query<{ unreadCount: number }, { user_id: number }>({
      query: ({ user_id }) => `/notificaciones/no-leidas/count/${user_id}`,
      providesTags: (result) => (result ? [{ type: 'Notification', id: 'UNREAD_COUNT' }] : []),
      keepUnusedDataFor: 300, // Cache por 5 minutos
      transformResponse: (response: any): { unreadCount: number } => {
        return { unreadCount: response.unreadCount || 0 };
      }
    })
  })
});

// Export hooks
export const { useGetNotificationQuery, useLazyGetNotificationQuery, useGetUnreadCountQuery } =
  notificationApi;
