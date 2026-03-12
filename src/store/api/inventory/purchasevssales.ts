import { apiSlice } from '../apiSlice';

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
export const purchaseVsSalesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET Menu del usuario con cache largo
    getPurchaseVsSalesReport: builder.query<
      any[],
      { fecha_inicio?: string; fecha_fin?: string; sucursalId?: number }
    >({
      query: ({ fecha_inicio, fecha_fin, sucursalId }) => {
        const params = new URLSearchParams();
        if (
          fecha_inicio !== undefined &&
          fecha_inicio !== null &&
          String(fecha_inicio).trim() !== ''
        ) {
          params.append('fecha_inicio', fecha_inicio as string);
        }
        if (fecha_fin !== undefined && fecha_fin !== null && String(fecha_fin).trim() !== '') {
          params.append('fecha_fin', fecha_fin as string);
        }
        if (sucursalId) {
          params.append('sucursalId', sucursalId.toString());
        }
        const qs = params.toString();
        return `/inv/purchase_vs_sales${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result, error, args) => [{ type: 'Report' as const, id: 'PURCHASE_VS_SALES' }],
      // Cache por 10 minutos (600 segundos)
      keepUnusedDataFor: 600,
      transformResponse: (response: any): any[] => {
        // Asegurarse de que siempre retornemos un array
        return Array.isArray(response) ? response : [];
      }
    })
  })
});

// Export hooks
export const { useGetPurchaseVsSalesReportQuery, useLazyGetPurchaseVsSalesReportQuery } =
  purchaseVsSalesApi;
