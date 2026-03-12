import { apiSlice } from './apiSlice';

export const retencionesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Trae facturas de compras
    getComprasList: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 50, search = '' } = {}) => {
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('limit', String(limit));
        if (search) params.append('search', search);
        return `/inv/compras?${params.toString()}`;
      },
      providesTags: (result) => [{ type: 'Generic' as const, id: 'INV_COMPRAS_LIST' }]
    }),

    // Trae retenciones (lista)
    getRetencionesList: builder.query<
      any,
      { page?: number; limit?: number; proveedor_id?: number }
    >({
      query: ({ page = 1, limit = 50, proveedor_id } = {}) => {
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('limit', String(limit));
        if (proveedor_id) params.append('proveedor_id', String(proveedor_id));
        return `/fin/retenciones?${params.toString()}`;
      },
      providesTags: (result) => [{ type: 'Generic' as const, id: 'FIN_RETENCIONES_LIST' }]
    }),

    // Crear retención
    createRetencion: builder.mutation<any, { data: any }>({
      query: ({ data }) => ({
        url: '/fin/retenciones',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Generic' as const, id: 'FIN_RETENCIONES_LIST' }]
    }),

    // Procesar retención (contabilizar)
    processRetencion: builder.mutation<any, { id: number; data: any }>({
      query: ({ id, data }) => ({
        url: `/fin/retenciones/${id}/process`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Generic' as const, id: 'FIN_RETENCIONES_LIST' }]
    })
  })
});

export const {
  useGetComprasListQuery,
  useGetRetencionesListQuery,
  useCreateRetencionMutation,
  useProcessRetencionMutation
} = retencionesApi;
