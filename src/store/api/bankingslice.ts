import { apiSlice } from './apiSlice';

export const bankingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBankAccounts: builder.query<any, void>({
      query: () => `fin/bank/accounts`,
      providesTags: (result) => [{ type: 'Generic' as const, id: 'BANK_ACCOUNTS' }]
    }),

    createBankAccount: builder.mutation<any, { data: any }>({
      query: ({ data }) => ({ url: 'fin/bank/accounts', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Generic' as const, id: 'BANK_ACCOUNTS' }]
    }),

    getBankMovimientos: builder.query<any, { cuentaId?: number; page?: number; limit?: number }>({
      query: ({ cuentaId, page = 1, limit = 100 } = {}) => {
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('limit', String(limit));
        if (cuentaId) params.append('cuenta_id', String(cuentaId));
        return `fin/bank/movimientos?${params.toString()}`;
      },
      providesTags: (result) => [{ type: 'Generic' as const, id: 'BANK_MOVS' }]
    }),

    createBankMovimiento: builder.mutation<any, { data: any }>({
      query: ({ data }) => ({ url: 'fin/bank/movimientos', method: 'POST', body: data }),
      invalidatesTags: [
        { type: 'Generic' as const, id: 'BANK_MOVS' },
        { type: 'Generic' as const, id: 'BANK_ACCOUNTS' }
      ]
    }),

    getCheques: builder.query<any, { estado?: string; page?: number; limit?: number }>({
      query: ({ estado, page = 1, limit = 100 } = {}) => {
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('limit', String(limit));
        if (estado) params.append('estado', estado);
        return `fin/bank/cheques?${params.toString()}`;
      },
      providesTags: (result) => [{ type: 'Generic' as const, id: 'BANK_CHEQUES' }]
    }),

    getFinConfigValidate: builder.query<any, void>({
      query: () => `fin/config/validate`
    }),

    cobrarCheque: builder.mutation<any, { id: number }>({
      query: ({ id }) => ({ url: `fin/bank/cheques/${id}/cobrar`, method: 'POST' }),
      invalidatesTags: [
        { type: 'Generic' as const, id: 'BANK_CHEQUES' },
        { type: 'Generic' as const, id: 'BANK_MOVS' }
      ]
    }),
    createCheque: builder.mutation<any, { data: any }>({
      query: ({ data }) => ({ url: 'fin/bank/cheques', method: 'POST', body: data }),
      invalidatesTags: [
        { type: 'Generic' as const, id: 'BANK_CHEQUES' },
        { type: 'Generic' as const, id: 'BANK_MOVS' }
      ]
    })
  })
});

export const {
  useGetBankAccountsQuery,
  useCreateBankAccountMutation,
  useGetBankMovimientosQuery,
  useCreateBankMovimientoMutation,
  useGetChequesQuery,
  useCobrarChequeMutation,
  useGetFinConfigValidateQuery,
  useCreateChequeMutation
} = bankingApi;

export default bankingApi;
