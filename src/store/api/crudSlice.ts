import { apiSlice } from './apiSlice';

// Interfaces
interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}

interface PaginatedResponse<T> {
  data: T[];
  items?: T[];
  total: number;
  count?: number;
  page?: number;
  limit?: number;
}

// CRUD API Slice con RTK Query
export const crudApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET List con paginación
    getEntityList: builder.query<
      PaginatedResponse<any>,
      { endpoint: string; params?: PaginationParams }
    >({
      query: ({ endpoint, params = {} }) => {
        const session = JSON.parse(localStorage.getItem('auth') || '{}');
        const sucursalId = localStorage.getItem('sucursal');

        const finalParams = {
          ...params,
          ...(sucursalId && {
            id_sucursal: Number(sucursalId),
            sis_sucursal_id: Number(sucursalId)
          }),
          ...(session.id && {
            id_usuario: Number(session.id),
            usuario_crea: Number(session.id),
            usuario_actualiza: Number(session.id)
          })
        };

        const searchParams = new URLSearchParams();
        Object.entries(finalParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
          }
        });

        const queryString = searchParams.toString();
        return queryString ? `${endpoint}?${queryString}` : endpoint;
      },
      providesTags: (result, error, { endpoint }) => {
        const entityType = endpoint.replace(/^\//, '').replace(/\//g, '_').toUpperCase();
        return [
          { type: 'Generic' as const, id: `${entityType}_LIST` },
          { type: 'Generic' as const, id: entityType },
          ...(result?.data || []).map((item: any) => ({
            type: 'Generic' as const,
            id: `${entityType}_${item.id}`
          }))
        ];
      },
      transformResponse: (response: any): PaginatedResponse<any> => {
        if (Array.isArray(response)) {
          return { data: response, total: response.length };
        }
        if (response.data && Array.isArray(response.data)) {
          return {
            data: response.data,
            total: response.total || response.count || response.data.length
          };
        }
        return response;
      },
      // Cache por 5 minutos (300 segundos)
      keepUnusedDataFor: 300
    }),

    // GET by ID
    getEntityById: builder.query<any, { endpoint: string; id: number }>({
      query: ({ endpoint, id }) => `${endpoint}/${id}`,
      providesTags: (result, error, { endpoint, id }) => {
        const entityType = endpoint.replace(/^\//, '').replace(/\//g, '_').toUpperCase();
        return [
          { type: 'Generic' as const, id: `${entityType}_${id}` },
          { type: 'Generic' as const, id: entityType }
        ];
      },
      // Cache por 10 minutos para registros individuales
      keepUnusedDataFor: 600
    }),

    // POST (Create)
    createEntity: builder.mutation<any, { endpoint: string; data: any }>({
      query: ({ endpoint, data }) => {
        const session = JSON.parse(localStorage.getItem('auth') || '{}');
        const sucursalId = localStorage.getItem('sucursal');

        let body = data;
        let headers: any = {};

        if (data instanceof FormData) {
          if (sucursalId) data.append('id_sucursal', String(sucursalId));
          if (session.id) data.append('id_usuario', String(session.id));
          body = data;
          // No establecer Content-Type para FormData, el navegador lo hará automáticamente
        } else {
          body = JSON.stringify({
            ...data,
            ...(sucursalId && { id_sucursal: Number(sucursalId) }),
            ...(session.id && { id_usuario: Number(session.id) })
          });
          headers['Content-Type'] = 'application/json';
        }

        return {
          url: endpoint,
          method: 'POST',
          body,
          headers
        };
      },
      invalidatesTags: (result, error, { endpoint }) => {
        const entityType = endpoint.replace(/^\//, '').replace(/\//g, '_').toUpperCase();
        return [
          { type: 'Generic' as const, id: `${entityType}_LIST` },
          { type: 'Generic' as const, id: entityType }
        ];
      }
    }),

    // PUT (Update)
    updateEntity: builder.mutation<any, { endpoint: string; id: number; data: any }>({
      query: ({ endpoint, id, data }) => {
        const session = JSON.parse(localStorage.getItem('auth') || '{}');
        const sucursalId = localStorage.getItem('sucursal');

        let body = data;
        let headers: any = {};

        if (data instanceof FormData) {
          if (sucursalId) data.append('id_sucursal', String(sucursalId));
          if (session.id) data.append('id_usuario', String(session.id));
          body = data;
        } else {
          body = JSON.stringify({
            ...data,
            ...(sucursalId && { id_sucursal: Number(sucursalId) }),
            ...(session.id && { id_usuario: Number(session.id) })
          });
          headers['Content-Type'] = 'application/json';
        }

        return {
          url: `${endpoint}/${id}`,
          method: 'PUT',
          body,
          headers
        };
      },
      invalidatesTags: (result, error, { endpoint, id }) => {
        const entityType = endpoint.replace(/^\//, '').replace(/\//g, '_').toUpperCase();
        return [
          { type: 'Generic' as const, id: `${entityType}_LIST` },
          { type: 'Generic' as const, id: entityType },
          { type: 'Generic' as const, id: `${entityType}_${id}` }
        ];
      }
    }),

    // DELETE
    deleteEntity: builder.mutation<any, { endpoint: string; id: number }>({
      query: ({ endpoint, id }) => ({
        url: `${endpoint}/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, { endpoint, id }) => {
        const entityType = endpoint.replace(/^\//, '').replace(/\//g, '_').toUpperCase();
        return [
          { type: 'Generic' as const, id: `${entityType}_LIST` },
          { type: 'Generic' as const, id: entityType },
          { type: 'Generic' as const, id: `${entityType}_${id}` }
        ];
      }
    })
  })
});

// Export hooks
export const {
  useGetEntityListQuery,
  useLazyGetEntityListQuery,
  useGetEntityByIdQuery,
  useLazyGetEntityByIdQuery,
  useCreateEntityMutation,
  useUpdateEntityMutation,
  useDeleteEntityMutation
} = crudApi;
