import { useMutation, useQuery, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { companiesBuilder } from '../builders/companies';
import { Company } from '../types';

export function useCompaniesQuery(
  params?: { search?: string; page?: number; page_size?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => companiesBuilder.list(params),
    ...options,
  });
}

export function useMyCompaniesQuery() {
  return useQuery({
    queryKey: ['companies', 'mine'],
    queryFn: () => companiesBuilder.getMine(),
  });
}

export function useCreateCompanyMutation(
  options?: UseMutationOptions<{ company: Company }, Error, Partial<Company> & { vendorId?: string }>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: companiesBuilder.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
    ...options,
  });
}

export function useUpdateCompanyMutation(
  options?: UseMutationOptions<
    { company: Company },
    Error,
    { id: string } & Partial<Company> & { vendorId?: string }
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => companiesBuilder.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
    ...options,
  });
}

export function useDeleteCompanyMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: companiesBuilder.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
    ...options,
  });
}

export function useUpdateWorkspaceMutation(
  options?: UseMutationOptions<{ user: unknown }, Error, string>,
) {
  return useMutation({
    mutationFn: companiesBuilder.updateWorkspace,
    ...options,
  });
}

export function useCompanyVendors(companyId : string){
  return useQuery({
    queryKey: ['companies', 'mine'],
    queryFn: async() => await companiesBuilder.getById(companyId),
  });
}
export function useGenerateNdaMutation() {
  return useMutation({
    mutationFn: (payload: {
      companyId: string;
      email: string;
      message: string;
    }) => companiesBuilder.generateNda(payload),
  });
}

export function useSendNdaMutation() {
  return useMutation({
    mutationFn: (companyId: string) => companiesBuilder.sendNda(companyId),
  });
}
export function useApproveNdaMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      companyId: string;
      email: string;
      message: string;
    }) => companiesBuilder.generateNda(payload),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies', 'mine'] });
    },
  });
}
export function useGenerateAgreementMutation() {
  return useMutation({
    mutationFn: (payload: {
      companyId: string;
      email: string;
      message: string;
      scheduleNo?: string;
      scheduleDate?: string;
      referredClient?: string;
      engagementName?: string;
      scopeSummary?: string;
      totalClientContractValue?: number;
      numberOfProgressPayments?: number;
      expectedEngagementStart?: string;
      totalReferralFee?: number;
      numberOfInstalments?: number;
      instalmentAmount?: number;
      accountName?: string;
      bsbAccount?: string;
    }) => companiesBuilder.generateAgreement(payload),
  });
}