import { apiSlice } from '../apiSlice';
import { NotaCredito, CreateNotaCreditoRequest } from '@/types/accounting'; // Asegúrate de tener los tipos definidos

export const creditNotesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Obtener listado de Notas de Crédito
    getNotasCredito: builder.query<NotaCredito[], void>({
      query: () => ({
        url: '/cont/notas-credito', // Coincide con tu backend FastAPI prefix '/cont'
        method: 'GET'
      }),
      providesTags: ['NotasCredito']
    }),

    // 2. Crear una nueva Nota de Crédito
    createNotaCredito: builder.mutation<void, CreateNotaCreditoRequest>({
      query: (nota) => ({
        url: '/cont/notas-credito',
        method: 'POST',
        body: nota
      }),
      // Invalida 'NotasCredito' para refrescar la lista
      // Invalida 'Ventas' y 'Productos' porque el stock y estados de venta cambian
      invalidatesTags: ['NotasCredito', 'Ventas', 'Productos']
    }),

    // 3. Buscar venta para cargar detalles (Reutiliza lógica de ventas pero aislada aquí si prefieres)
    getVentaParaNota: builder.query<any, number>({
      query: (id) => ({
        url: `/inv/ventas/${id}`, // Asumiendo que este endpoint ya existe en tu módulo de ventas
        method: 'GET'
      })
    })
  }),
  overrideExisting: false
});

export const {
  useGetNotasCreditoQuery,
  useCreateNotaCreditoMutation,
  useLazyGetVentaParaNotaQuery
} = creditNotesApi;
