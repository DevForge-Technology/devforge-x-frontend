import { apiService } from '../../services/apiService';
import { DashboardStats, Referral } from '../types';

export const referralsBuilder = {
  list: async (params?: Record<string, string | number>) => {
    const { data } = await apiService.get<{
      referrals: Referral[];
      total: number;
      page: number;
      pageSize: number;
    }>('/referrals', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiService.get<Referral>(`/referrals/${id}`);
    return data;
  },

  create: async (payload: Partial<Referral>) => {
    const { data } = await apiService.post<{ referral: Referral }>('/referrals', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Referral>) => {
    const { data } = await apiService.put<{ referral: Referral }>(`/referrals/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiService.delete<{ success: boolean }>(`/referrals/${id}`);
    return data;
  },

  getStats: async () => {
    const { data } = await apiService.get<DashboardStats>('/referrals/stats');
    return data;
  },
};
