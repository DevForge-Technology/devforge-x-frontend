import { apiService } from '../../services/apiService';
import { User } from '../types';

export const usersBuilder = {
  list: async (params?: { search?: string; page?: number; page_size?: number }) => {
    const { data } = await apiService.get<{ users: User[]; total: number; page: number; pageSize: number }>(
      '/users',
      { params },
    );
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiService.get<User>(`/users/${id}`);
    return data;
  },

  create: async (payload: { name: string; email: string; companyIds?: string[] }) => {
    const { data } = await apiService.post<{ user: User }>('/users', payload);
    return data;
  },

  update: async (id: string, payload: { name?: string; email?: string }) => {
    const { data } = await apiService.put<{ user: User }>(`/users/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiService.delete<{ success: boolean }>(`/users/${id}`);
    return data;
  },

  resetPassword: async (id: string, new_password: string) => {
    const { data } = await apiService.post<{ success: boolean }>(`/users/${id}/reset-password`, {
      new_password,
    });
    return data;
  },

  getMe: async () => {
    const { data } = await apiService.get<User>('/users/me');
    return data;
  },

  updateMe: async (payload: { name: string; email: string }) => {
    const { data } = await apiService.put<{ user: User }>('/users/me', payload);
    return data;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
    const { data } = await apiService.put<{ success: boolean }>('/users/me/password', payload);
    return data;
  },
};
