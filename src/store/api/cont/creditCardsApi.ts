import { apiSlice } from '../apiSlice';

export const creditCardsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Obtener tarjetas
    getTarjetas: builder.query<any[], void>({
      query: () => ({ url: '/cont/tarjetas-credito', method: 'GET' }),
      providesTags: ['Generic']
    }),

    // Crear tarjeta
    createTarjeta: builder.mutation<any, Partial<any>>({
      query: (payload) => ({ url: '/cont/tarjetas-credito', method: 'POST', body: payload }),
      invalidatesTags: ['Generic']
    }),

    // Obtener movimientos
    getMovimientosTC: builder.query<any[], void>({
      query: () => ({ url: '/cont/tarjetas-credito/movimientos', method: 'GET' }),
      providesTags: ['Generic']
    }),

    // Registrar compra
    createCompraTC: builder.mutation<any, Partial<any>>({
      query: (payload) => ({ url: '/cont/tarjetas-credito/compra', method: 'POST', body: payload }),
      invalidatesTags: ['Generic']
    }),

    // Registrar pago
    createPagoTC: builder.mutation<any, Partial<any>>({
      query: (payload) => ({ url: '/cont/tarjetas-credito/pago', method: 'POST', body: payload }),
      invalidatesTags: ['Generic']
    })
  }),
  overrideExisting: false
});

export const {
  useGetTarjetasQuery,
  useCreateTarjetaMutation,
  useGetMovimientosTCQuery,
  useCreateCompraTCMutation,
  useCreatePagoTCMutation
} = creditCardsApi;
