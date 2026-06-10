import { apiService } from '../../services/apiService';
import { Company } from '../types';

export const companiesBuilder = {
  list: async (params?: { search?: string; page?: number; page_size?: number }) => {
    const { data } = await apiService.get<{
      companies: Company[];
      total: number;
      page: number;
      pageSize: number;
    }>('/companies', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiService.get<Company & { assignedVendors?: unknown[] }>(`/companies/${id}`);
    return data;
  },

  create: async (payload: Partial<Company> & { vendorIds?: string[] }) => {
    const { data } = await apiService.post<{ company: Company }>('/companies', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Company> & { vendorIds?: string[] }) => {
    const { data } = await apiService.put<{ company: Company }>(`/companies/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiService.delete<{ success: boolean }>(`/companies/${id}`);
    return data;
  },

  assign: async (companyId: string, vendorId: string) => {
    const { data } = await apiService.post<{ success: boolean }>(`/companies/${companyId}/assign`, {
      vendorId,
    });
    return data;
  },

  unassign: async (companyId: string, vendorId: string) => {
    const { data } = await apiService.delete<{ success: boolean }>(
      `/companies/${companyId}/unassign/${vendorId}`,
    );
    return data;
  },

  getMine: async () => {
    const { data } = await apiService.get<{ companies: Company[] }>('/companies/mine');
    return data;
  },

  updateWorkspace: async (companyId: string) => {
    const { data } = await apiService.patch<{ user: unknown }>('/companies/workspace', { companyId });
    return data;
  },
};
