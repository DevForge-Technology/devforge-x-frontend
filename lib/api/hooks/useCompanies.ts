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
