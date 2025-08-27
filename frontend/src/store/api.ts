import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';
import { logout } from './authSlice';
import { toast } from 'sonner';

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };
export const getAccessToken = () => accessToken;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api/v1/',
  credentials: 'include',
  prepareHeaders: (headers) => {
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    return headers;
  }
});

const baseQueryWithRefresh: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const exec = () => rawBaseQuery(args, api, extraOptions) as Promise<any>;
  let result: any = await exec();
  if (result.error && result.error.status === 401) {
    const refreshResult: any = await rawBaseQuery({ url: 'auth/refresh', method: 'POST' }, api, extraOptions);
    const newToken = refreshResult?.data?.token || refreshResult?.data?.accessToken;
    if (newToken) {
      setAccessToken(newToken);
      result = await exec();
    } else {
      await api.dispatch(logout() as any);
      toast.error('Session expired. Please log in again.');
    }
  }
  if (result.error) {
    const status: any = result.error.status;
    const msg = (result.error.data as any)?.error || (result.error.data as any)?.message;
    if (status === 429) toast.error('Rate limit reached. Try again shortly.');
    else if (status === 400 && msg) toast.error(msg);
    else if (status >= 500) toast.error('Server error. Please try later.');
  }
  return result;
};

// Base API slice. Each feature can inject endpoints.
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Accounts','Transactions','Budget','Alerts','AlertEvents','AI','Export','Goals','Sessions','Vacation','Categories','AIUsage','Preferences'],
  endpoints: (builder) => ({
    // Accounts
    getAccounts: builder.query<{ accounts: any[] }, void>({
      query: () => 'accounts',
      providesTags: ['Accounts']
    }),
    updateAccount: builder.mutation<any, { id: string; name?: string; balance?: number }>({
      query: ({ id, ...patch }) => ({ url: `accounts/${id}`, method: 'PUT', body: patch }),
      invalidatesTags: ['Accounts']
    }),

    // Transactions
    getTransactions: builder.query<any, { page?: number; limit?: number; category?: string; account_id?: string; start_date?: string; end_date?: string }>({
      query: (params) => ({ url: 'transactions', params }),
      providesTags: (res) => ['Transactions']
    }),
    updateTransactionCategory: builder.mutation<any, { id: string; category: string; subcategory?: string }>({
      query: ({ id, ...body }) => ({ url: `transactions/${id}/category`, method: 'PUT', body }),
      invalidatesTags: ['Transactions','Budget','Alerts']
    }),
    spendingByCategory: builder.query<any[], { start_date?: string; end_date?: string }>({
      query: (params) => ({ url: 'transactions/spending-by-category', params }),
      providesTags: ['Budget']
    }),

    // Budget
    getBudgetStatus: builder.query<any, void>({
      query: () => 'budget/status',
      providesTags: ['Budget']
    }),
    simulateSpend: builder.mutation<any, { amount: number; category?: string }>({
      query: (body) => ({ url: 'budget/simulate', method: 'POST', body })
    }),
    canAfford: builder.mutation<any, { amount: number }>({
      query: (body) => ({ url: 'budget/can-afford', method: 'POST', body })
    }),
    getBudgetCategories: builder.query<any[], void>({
      query: () => 'budget/categories',
      providesTags: ['Categories']
    }),
    saveBudgetCategories: builder.mutation<any, { categories: any[] }>({
      query: (body) => ({ url: 'budget/categories', method: 'POST', body }),
      invalidatesTags: ['Categories','Budget']
    }),
    deleteBudgetCategory: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({ url: `budget/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories','Budget']
    }),
    getCategorySpending: builder.query<any[], void>({
      query: () => 'budget/categories/spending',
      providesTags: ['Budget','Categories']
    }),
    closeMonth: builder.mutation<any, void>({
      query: () => ({ url: 'budget/close-month', method: 'POST' }),
      invalidatesTags: ['Budget','Categories','Transactions']
    }),

    // Alerts
    getAlerts: builder.query<{ alerts: any[] }, void>({
      query: () => 'alerts',
      providesTags: ['Alerts']
    }),
    createAlert: builder.mutation<any, { type: string; category_id?: string; threshold?: number; comparison?: string }>({
      query: (body) => ({ url: 'alerts', method: 'POST', body }),
      invalidatesTags: ['Alerts']
    }),
    updateAlert: builder.mutation<any, { id: string; threshold?: number; comparison?: string; status?: string }>({
      query: ({ id, ...body }) => ({ url: `alerts/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Alerts']
    }),
    deleteAlert: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({ url: `alerts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Alerts']
    }),
    getAlertEvents: builder.query<{ events: any[] }, { id: string }>({
      query: ({ id }) => `alerts/${id}/events`
    }),

    // AI usage & chat (non-stream)
    getAIUsage: builder.query<any, void>({
      query: () => 'ai/usage',
      providesTags: ['AIUsage']
    }),
    aiChat: builder.mutation<any, { query: string }>({
      query: (body) => ({ url: 'ai/chat', method: 'POST', body }),
      invalidatesTags: ['AIUsage']
    }),

    // Export
    enqueueExport: builder.mutation<{ jobId: string; status: string }, void>({
      query: () => ({ url: 'export', method: 'POST' }),
      invalidatesTags: ['Export']
    }),
    listExports: builder.query<{ jobs: any[] }, void>({
      query: () => 'export',
      providesTags: ['Export']
    }),
    exportStatus: builder.query<any, { id: string }>({
      query: ({ id }) => `export/${id}/status`,
      providesTags: (res, err, arg) => [{ type: 'Export', id: arg.id }]
    }),
    downloadExport: builder.query<Blob, { id: string }>({
      query: ({ id }) => ({ url: `export/${id}/download`, responseHandler: async (response) => response.blob() as any }),
      providesTags: (res, err, arg) => [{ type: 'Export', id: arg.id }]
    }),

    // Goals
    getGoals: builder.query<{ goals: any[] }, void>({
      query: () => 'goals',
      providesTags: ['Goals']
    }),
    createGoal: builder.mutation<any, { name: string; target_amount: number; current_amount?: number; monthly_target?: number; target_date?: string; priority?: string }>({
      query: (body) => ({ url: 'goals', method: 'POST', body }),
      invalidatesTags: ['Goals']
    }),
    updateGoal: builder.mutation<any, { id: string; name?: string; target_amount?: number; current_amount?: number; monthly_target?: number; target_date?: string; is_active?: boolean; priority?: string }>({
      query: ({ id, ...body }) => ({ url: `goals/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Goals']
    }),
    contributeGoal: builder.mutation<any, { id: string; amount: number }>({
      query: ({ id, amount }) => ({ url: `goals/${id}/contribute`, method: 'POST', body: { amount } }),
      invalidatesTags: ['Goals']
    }),
    deleteGoal: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({ url: `goals/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Goals']
    }),

    // Sessions
    getSessions: builder.query<{ sessions: any[] }, void>({
      query: () => 'auth/sessions',
      providesTags: ['Sessions']
    }),
    revokeSession: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({ url: `auth/sessions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Sessions']
    }),

    // Vacation
    getVacationPeriods: builder.query<{ periods: any[] }, void>({
      query: () => 'vacation',
      providesTags: ['Vacation']
    }),
    createVacationPeriod: builder.mutation<any, { start_date: string; end_date: string; include_in_travel?: boolean; paused_categories?: string[] }>({
      query: (body) => ({ url: 'vacation', method: 'POST', body }),
      invalidatesTags: ['Vacation','Budget']
    }),
    deleteVacationPeriod: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({ url: `vacation/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Vacation','Budget']
    }),

    // Preferences
    getPreferences: builder.query<{ preferences: any }, void>({
      query: () => 'preferences',
      providesTags: ['Preferences']
    }),
    updatePreferences: builder.mutation<{ preferences: any }, Partial<{ theme: string; default_currency: string; ai_opt_in: boolean; redaction_level: string; notifications_email: boolean; notifications_push: boolean }>>({
      query: (body) => ({ url: 'preferences', method: 'PUT', body }),
      invalidatesTags: ['Preferences'],
      async onQueryStarted(_, { queryFulfilled }) {
        try { await queryFulfilled; toast.success('Preferences saved'); } catch {}
      }
    }),

    // Ops
    getHealth: builder.query<any, void>({
      query: () => 'ops/health'
    }),
    getQueueStats: builder.query<any, void>({
      query: () => 'ops/queues'
    }),
  })
});

export const {
  useGetAccountsQuery,
  useUpdateAccountMutation,
  useGetTransactionsQuery,
  useUpdateTransactionCategoryMutation,
  useSpendingByCategoryQuery,
  useGetBudgetStatusQuery,
  useSimulateSpendMutation,
  useCanAffordMutation,
  useGetBudgetCategoriesQuery,
  useSaveBudgetCategoriesMutation,
  useDeleteBudgetCategoryMutation,
  useGetCategorySpendingQuery,
  useCloseMonthMutation,
  useGetAlertsQuery,
  useCreateAlertMutation,
  useUpdateAlertMutation,
  useDeleteAlertMutation,
  useGetAlertEventsQuery,
  useGetAIUsageQuery,
  useAiChatMutation,
  useEnqueueExportMutation,
  useListExportsQuery,
  useExportStatusQuery,
  useDownloadExportQuery,
  useGetGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useContributeGoalMutation,
  useDeleteGoalMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useGetVacationPeriodsQuery,
  useCreateVacationPeriodMutation,
  useDeleteVacationPeriodMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useGetHealthQuery,
  useGetQueueStatsQuery
} = api;
