import { createApi, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import apiClient from 'api/client';
import { AxiosRequestConfig, AxiosError } from 'axios';

const axiosBaseQuery = (): BaseQueryFn<
  {
    url: string;
    method?: AxiosRequestConfig['method'];
    data?: any;
    params?: AxiosRequestConfig['params'];
    headers?: AxiosRequestConfig['headers'];
  },
  unknown,
  unknown
> =>
  async ({ url, method = 'GET', data, params, headers }) => {
    try {
      const result = await apiClient({
        url,
        method,
        data,
        params,
        headers
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message
        }
      };
    }
  };

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Masters', 'Users', 'UrbanElection', 'RuralElection'],
  endpoints: (builder) => ({
    // Masters endpoints
    getOptions: builder.query<any, void>({
      query: () => ({ url: '/masters/options' }),
      providesTags: ['Masters']
    }),
    getMasters: builder.query<any, { type: string; params: any }>({
      query: ({ type, params }) => ({
        url: `/masters/${type}`,
        params
      }),
      providesTags: (result, error, arg) => [{ type: 'Masters', id: arg.type }]
    }),
    createMaster: builder.mutation<any, { type: string; data: any }>({
      query: ({ type, data }) => ({
        url: `/masters/${type}`,
        method: 'POST',
        data,
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      }),
      invalidatesTags: (result, error, arg) => ['Masters', { type: 'Masters', id: arg.type }]
    }),
    updateMaster: builder.mutation<any, { type: string; id: any; data: any }>({
      query: ({ type, id, data }) => ({
        url: `/masters/${type}/${id}`,
        method: 'POST',
        data,
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      }),
      invalidatesTags: (result, error, arg) => ['Masters', { type: 'Masters', id: arg.type }]
    }),
    deleteMaster: builder.mutation<any, { type: string; id: any }>({
      query: ({ type, id }) => ({
        url: `/masters/${type}/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, arg) => ['Masters', { type: 'Masters', id: arg.type }]
    }),
    importMaster: builder.mutation<any, { type: string; data: FormData }>({
      query: ({ type, data }) => ({
        url: `/masters/${type}/import`,
        method: 'POST',
        data,
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
      invalidatesTags: (result, error, arg) => ['Masters', { type: 'Masters', id: arg.type }]
    }),
    searchEmployees: builder.query<any, { q: string; post_name?: string }>({
      query: ({ q, post_name }) => ({
        url: '/masters/employees/search',
        params: { q, post_name }
      })
    }),
    getElectionSalaryRules: builder.query<any, void>({
      query: () => ({
        url: '/masters/election-salary-rules'
      }),
      providesTags: ['Masters']
    }),
    saveElectionSalaryRules: builder.mutation<any, any>({
      query: (data) => ({
        url: '/masters/election-salary-rules',
        method: 'POST',
        data
      }),
      invalidatesTags: ['Masters']
    }),
    getDistrictConfigs: builder.query<any, void>({
      query: () => ({ url: '/district-config' }),
      providesTags: ['Masters']
    }),
    saveDistrictConfig: builder.mutation<any, any>({
      query: (data) => ({
        url: '/district-config',
        method: 'POST',
        data
      }),
      invalidatesTags: ['Masters', 'UrbanElection', 'RuralElection']
    }),

    // Users endpoints
    getAccessOptions: builder.query<any, void>({
      query: () => ({ url: '/users/access-options' }),
      providesTags: ['Users']
    }),
    getUsers: builder.query<any, any>({
      query: (params) => ({
        url: '/users',
        params
      }),
      providesTags: ['Users']
    }),
    createUser: builder.mutation<any, any>({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        data
      }),
      invalidatesTags: ['Users']
    }),
    updateUser: builder.mutation<any, { id: any; data: any }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        data
      }),
      invalidatesTags: ['Users']
    }),
    updateAccess: builder.mutation<any, { id: any; data: any }>({
      query: ({ id, data }) => ({
        url: `/users/${id}/access`,
        method: 'PUT',
        data
      }),
      invalidatesTags: ['Users']
    }),
    resetPassword: builder.mutation<any, { id: any }>({
      query: ({ id }) => ({
        url: `/users/reset/${id}`,
        method: 'POST'
      }),
      invalidatesTags: ['Users']
    }),
    deleteUser: builder.mutation<any, { id: any }>({
      query: ({ id }) => ({
        url: `/users/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Users']
    }),
    getAuthSettings: builder.query<any, void>({
      query: () => ({ url: '/auth/auth-settings' }),
      providesTags: ['Users']
    }),
    updateAuthSettings: builder.mutation<any, any>({
      query: (data) => ({
        url: '/auth/auth-settings',
        method: 'POST',
        data
      }),
      invalidatesTags: ['Users']
    }),

    // Urban Election endpoints
    getUrbanDashboard: builder.query<any, any>({
      query: (params) => ({
        url: '/urban-election/dashboard-data',
        params
      }),
      providesTags: ['UrbanElection']
    }),
    createUrbanTeams: builder.mutation<any, any>({
      query: (data) => ({
        url: '/urban-election/create-teams-scheduled',
        method: 'POST',
        data
      }),
      invalidatesTags: ['UrbanElection']
    }),
    saveUrbanAssignments: builder.mutation<any, any>({
      query: (data) => ({
        url: '/urban-election/save-assignments',
        method: 'POST',
        data
      }),
      invalidatesTags: ['UrbanElection']
    }),
    exemptUrbanEmployee: builder.mutation<any, any>({
      query: (data) => ({
        url: '/urban-election/exempt-employee',
        method: 'POST',
        data
      }),
      invalidatesTags: ['UrbanElection']
    }),
    applyUrbanDuty: builder.mutation<any, any>({
      query: (data) => ({
        url: '/urban-election/apply-duty',
        method: 'POST',
        data
      }),
      invalidatesTags: ['UrbanElection']
    }),
    applyUrbanTargetedDuty: builder.mutation<any, any>({
      query: (data) => ({
        url: '/urban-election/apply-targeted-duty',
        method: 'POST',
        data
      }),
      invalidatesTags: ['UrbanElection']
    }),

    // Rural Election endpoints
    getRuralDashboard: builder.query<any, any>({
      query: (params) => ({
        url: '/rural-election/dashboard-data',
        params
      }),
      providesTags: ['RuralElection']
    }),
    createRuralTeams: builder.mutation<any, any>({
      query: (data) => ({
        url: '/rural-election/create-teams-scheduled',
        method: 'POST',
        data
      }),
      invalidatesTags: ['RuralElection']
    }),
    saveRuralAssignments: builder.mutation<any, any>({
      query: (data) => ({
        url: '/rural-election/save-assignments',
        method: 'POST',
        data
      }),
      invalidatesTags: ['RuralElection']
    }),
    exemptRuralEmployee: builder.mutation<any, any>({
      query: (data) => ({
        url: '/rural-election/exempt-employee',
        method: 'POST',
        data
      }),
      invalidatesTags: ['RuralElection']
    }),
    applyRuralDuty: builder.mutation<any, any>({
      query: (data) => ({
        url: '/rural-election/apply-duty',
        method: 'POST',
        data
      }),
      invalidatesTags: ['RuralElection']
    }),
    applyRuralTargetedDuty: builder.mutation<any, any>({
      query: (data) => ({
        url: '/rural-election/apply-targeted-duty',
        method: 'POST',
        data
      }),
      invalidatesTags: ['RuralElection']
    })
  })
});

export const {
  useGetOptionsQuery,
  useGetMastersQuery,
  useLazyGetMastersQuery,
  useCreateMasterMutation,
  useUpdateMasterMutation,
  useDeleteMasterMutation,
  useImportMasterMutation,
  useLazySearchEmployeesQuery,
  useGetElectionSalaryRulesQuery,
  useSaveElectionSalaryRulesMutation,
  useGetDistrictConfigsQuery,
  useSaveDistrictConfigMutation,

  useGetAccessOptionsQuery,
  useGetUsersQuery,
  useLazyGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateAccessMutation,
  useResetPasswordMutation,
  useDeleteUserMutation,
  useGetAuthSettingsQuery,
  useUpdateAuthSettingsMutation,

  useGetUrbanDashboardQuery,
  useCreateUrbanTeamsMutation,
  useSaveUrbanAssignmentsMutation,
  useExemptUrbanEmployeeMutation,
  useApplyUrbanDutyMutation,
  useApplyUrbanTargetedDutyMutation,

  useGetRuralDashboardQuery,
  useCreateRuralTeamsMutation,
  useSaveRuralAssignmentsMutation,
  useExemptRuralEmployeeMutation,
  useApplyRuralDutyMutation,
  useApplyRuralTargetedDutyMutation
} = apiSlice;
