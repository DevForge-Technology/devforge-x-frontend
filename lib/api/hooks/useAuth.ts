import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { authBuilder } from '../builders/auth';
import { VerifyTokenResponse } from '../types';

export function useVerifyTokenMutation(
  options?: UseMutationOptions<VerifyTokenResponse, Error, { token: string }>,
) {
  return useMutation<VerifyTokenResponse, Error, { token: string }>({
    mutationFn: ({ token }) => authBuilder.verifyToken(token),
    ...options,
  });
}

export function useSyncRoleMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { supabaseId: string }>,
) {
  return useMutation<{ success: boolean }, Error, { supabaseId: string }>({
    mutationFn: ({ supabaseId }) => authBuilder.syncRole(supabaseId),
    ...options,
  });
}
