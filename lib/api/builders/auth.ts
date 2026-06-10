import { apiService } from '../../services/apiService';
import { VerifyTokenResponse } from '../types';

export const authBuilder = {
  verifyToken: async (token: string): Promise<VerifyTokenResponse> => {
    const { data } = await apiService.post<VerifyTokenResponse>('/auth/verify-token', { token });
    return data;
  },

  syncRole: async (supabaseId: string): Promise<{ success: boolean }> => {
    const { data } = await apiService.post<{ success: boolean }>('/auth/sync-role', { supabaseId });
    return data;
  },
};
