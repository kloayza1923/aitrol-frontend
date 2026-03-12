import { apiSlice } from '../apiSlice';

export const inventoryDashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Endpoint principal para las estadísticas del Dashboard
    getInventoryStats: builder.query<any, void>({
      query: () => ({
        url: '/inv/dashboard-stats', // Ruta sugerida en FastAPI
        method: 'GET'
      }),
      providesTags: ['Inventory']
    }),

    // 2. Reporte de Compras vs Ventas (usando el archivo que ya tienes referenciado)
    getPurchaseVsSales: builder.query<any, { period: string }>({
      query: ({ period }) => ({
        url: `/inv/purchase-vs-sales?period=${period}`,
        method: 'GET'
      })
    }),

    // 3. Alertas de Stock Bajo (Para la tabla de alertas críticas)
    getLowStockAlerts: builder.query<any, void>({
      query: () => ({
        url: '/inv/productos-low-stock',
        method: 'GET'
      }),
      providesTags: ['Inventory']
    }),

    // 4. Últimos movimientos (Para el Timeline del dashboard)
    getRecentMovements: builder.query<any, { limit: number }>({
      query: ({ limit = 5 }) => ({
        url: `/inv/movimientos/recientes?limit=${limit}`,
        method: 'GET'
      }),
      providesTags: ['Inventory']
    })
  }),
  overrideExisting: false
});

export const {
  useGetInventoryStatsQuery,
  useGetPurchaseVsSalesQuery,
  useGetLowStockAlertsQuery,
  useGetRecentMovementsQuery
} = inventoryDashboardApi;
