import { useMutation, useQuery, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { referralsBuilder } from '../builders/referrals';
import { DashboardStats, Referral } from '../types';

export function useReferralsQuery(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['referrals', params],
    queryFn: () => referralsBuilder.list(params),
  });
}

export function useReferralStatsQuery() {
  return useQuery({
    queryKey: ['referrals', 'stats'],
    queryFn: () => referralsBuilder.getStats(),
  });
}

export function useCreateReferralMutation(
  options?: UseMutationOptions<{ referral: Referral }, Error, Partial<Referral>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: referralsBuilder.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referrals'] });
      qc.invalidateQueries({ queryKey: ['referrals', 'stats'] });
    },
    ...options,
  });
}

export function useUpdateReferralMutation(
  options?: UseMutationOptions<{ referral: Referral }, Error, { id: string } & Partial<Referral>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => referralsBuilder.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referrals'] }),
    ...options,
  });
}

export function useDeleteReferralMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: referralsBuilder.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referrals'] });
      qc.invalidateQueries({ queryKey: ['referrals', 'stats'] });
    },
    ...options,
  });
}
