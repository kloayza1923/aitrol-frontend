import { apiSlice } from './apiSlice';

/**
 * API dinámica que permite hacer cualquier request sin definir endpoints estáticos
 * Mantiene compatibilidad total con la interfaz de FetchData
 */
export const dynamicApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Endpoint dinámico para cualquier request
    dynamicRequest: builder.mutation<
      any,
      {
        url: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE';
        data?: any;
        headers?: HeadersInit;
      }
    >({
      queryFn: async ({ url, method, data, headers }, api, extraOptions, baseQuery) => {
        const sucursalId = localStorage.getItem('sucursal');
        const session = JSON.parse(localStorage.getItem('auth') || '{}');
        const usuarioId = session.id;

        // Clonar data para no mutar el original
        let bodyData = data;

        // Si es un objeto plano (no FormData ni Array), clonar y agregar campos automáticos
        if (
          bodyData &&
          !(bodyData instanceof FormData) &&
          !Array.isArray(bodyData) &&
          typeof bodyData === 'object'
        ) {
          bodyData = { ...data };
          if (sucursalId && !bodyData.id_sucursal) {
            bodyData.id_sucursal = Number(sucursalId);
          }
          if (usuarioId && !bodyData.id_usuario) {
            bodyData.id_usuario = Number(usuarioId);
            bodyData.usuario_crea = Number(usuarioId);
            bodyData.usuario_actualiza = Number(usuarioId);
          }
        }

        // Si es FormData, agregar campos
        if (bodyData instanceof FormData) {
          if (sucursalId && !bodyData.has('id_sucursal')) {
            bodyData.append('id_sucursal', String(sucursalId));
          }
          if (usuarioId && !bodyData.has('id_usuario')) {
            bodyData.append('id_usuario', String(usuarioId));
            bodyData.append('usuario_crea', String(usuarioId));
            bodyData.append('usuario_actualiza', String(usuarioId));
          }
        }

        // Construir los args para baseQuery
        const queryArgs: any = {
          url: url,
          method: method,
          headers: headers || {}
        };

        // Para GET, convertir data a query params
        if (method === 'GET' && bodyData && !(bodyData instanceof FormData)) {
          const params = new URLSearchParams(bodyData).toString();
          queryArgs.url = params ? `${url}?${params}` : url;
        } else if (bodyData) {
          // Para otros métodos, enviar en el body
          queryArgs.body = bodyData;

          // Si no es FormData, asegurar JSON Content-Type
          if (!(bodyData instanceof FormData)) {
            queryArgs.headers = {
              'Content-Type': 'application/json',
              ...queryArgs.headers
            };
          }
        }

        const result = await baseQuery(queryArgs);

        if (result.error) {
          return { error: result.error };
        }

        return { data: result.data };
      },
      // Invalidar tags según el método
      invalidatesTags: (result, error, arg) => {
        if (arg.method !== 'GET') {
          // Para mutations, invalidar Generic para forzar refetch de listas
          return ['Generic'];
        }
        return [];
      }
    }),

    // Endpoint dinámico para GET con caché
    dynamicQuery: builder.query<
      any,
      {
        url: string;
        data?: any;
        headers?: HeadersInit;
        cacheTime?: number;
      }
    >({
      queryFn: async ({ url, data, headers }, api, extraOptions, baseQuery) => {
        const sucursalId = localStorage.getItem('sucursal');
        const session = JSON.parse(localStorage.getItem('auth') || '{}');
        const usuarioId = session.id;

        // Agregar campos automáticos a data para GET
        let queryData = data ? { ...data } : {};
        if (sucursalId) queryData.id_sucursal = Number(sucursalId);
        if (usuarioId) queryData.id_usuario = Number(usuarioId);

        // Construir URL con query params
        const params = new URLSearchParams(queryData).toString();
        const fullUrl = params ? `${url}?${params}` : url;

        const result = await baseQuery({
          url: fullUrl,
          method: 'GET',
          headers: headers || {}
        });

        if (result.error) {
          return { error: result.error };
        }

        return { data: result.data };
      },
      // Tag para caché
      providesTags: ['Generic']
      // Tiempo de caché dinámico (keepUnusedDataFor se maneja a nivel global)
    })
  })
});

export const { useDynamicRequestMutation, useDynamicQueryQuery } = dynamicApi;
