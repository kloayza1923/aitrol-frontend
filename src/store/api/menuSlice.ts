import { apiSlice } from './apiSlice';

// Interface para el menú
interface MenuItem {
  id: number;
  name: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
  [key: string]: any;
}

// Menu API Slice con RTK Query
export const menuApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET Menu del usuario con cache largo
    getUserMenu: builder.query<MenuItem[], number>({
      query: (usuarioId) => `/menu/usuario/${usuarioId}`,
      providesTags: (result, error, usuarioId) => [
        { type: 'Menu' as const, id: usuarioId },
        { type: 'Menu' as const, id: 'LIST' }
      ],
      // Cache por 1 hora (3600 segundos) ya que el menú rara vez cambia
      keepUnusedDataFor: 3600,
      transformResponse: (response: any): MenuItem[] => {
        // Asegurarse de que siempre retornemos un array
        return Array.isArray(response) ? response : [];
      }
    }),

    // Invalidar cache del menú (útil cuando cambian permisos)
    invalidateUserMenu: builder.mutation<void, number>({
      query: () => ({
        url: '/menu/invalidate', // endpoint ficticio, no hace request real
        method: 'POST'
      }),
      invalidatesTags: (result, error, usuarioId) => [
        { type: 'Menu' as const, id: usuarioId },
        { type: 'Menu' as const, id: 'LIST' }
      ]
    })
  })
});

// Export hooks
export const { useGetUserMenuQuery, useLazyGetUserMenuQuery, useInvalidateUserMenuMutation } =
  menuApi;
