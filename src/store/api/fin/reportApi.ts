import { apiSlice } from '../apiSlice';

export interface SeriesResp {
  labels: string[];
  sales: number[];
  purchases: number[];
}

export const finReportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseVsSalesReport: builder.query<
      SeriesResp,
      { months?: number; end_date?: string } | void
    >({
      query: (q) => {
        const params = new URLSearchParams();
        if (q?.months !== undefined && q?.months !== null) params.set('months', String(q.months));
        if (q?.end_date !== undefined && q?.end_date !== null && String(q.end_date).trim() !== '')
          params.set('end_date', q.end_date);
        const qs = params.toString();
        return `/fin/report/purchasevssales${qs ? `?${qs}` : ''}`;
      },
      providesTags: (res) => [{ type: 'Report' as const, id: 'PURCHASE_VS_SALES' }],
      transformResponse: (res: any) => {
        return {
          labels: Array.isArray(res?.labels) ? res.labels : [],
          sales: Array.isArray(res?.sales) ? res.sales.map((v: any) => Number(v || 0)) : [],
          purchases: Array.isArray(res?.purchases)
            ? res.purchases.map((v: any) => Number(v || 0))
            : []
        } as SeriesResp;
      },
      keepUnusedDataFor: 300
    }),

    getFinSummary: builder.query<any, { limit?: number; page?: number } | void>({
      query: (q) => {
        const params = new URLSearchParams();
        if (q?.limit !== undefined && q?.limit !== null) params.set('limit', String(q.limit));
        if (q?.page !== undefined && q?.page !== null) params.set('page', String(q.page));
        const qs = params.toString();
        return `/fin/report/summary${qs ? `?${qs}` : ''}`;
      },
      providesTags: (res) => [{ type: 'Report' as const, id: 'SUMMARY' }],
      transformResponse: (res: any) => res || {},
      keepUnusedDataFor: 300
    })
  }),
  overrideExisting: false
});

export const { useGetPurchaseVsSalesReportQuery, useGetFinSummaryQuery } = finReportApi;
