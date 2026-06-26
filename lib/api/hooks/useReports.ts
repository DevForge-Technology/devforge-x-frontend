import { useMutation, useQuery, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { reportsBuilder, Report } from '../builders/reports';

export function useCompanyReportsQuery(
  companyId: string,
  params?: { page?: number; page_size?: number },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['reports', companyId, params],
    queryFn: () => reportsBuilder.getCompanyReports(companyId, params),
    enabled: !!companyId && options?.enabled !== false,
    ...options,
  });
}

export function useUploadReportMutation(
  options?: UseMutationOptions<
    Report,
    Error,
    { companyId: string; file: File; dto: Record<string, never> }
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, file }) => reportsBuilder.upload(companyId, file),
    onSuccess: (data: Report) => {
      qc.invalidateQueries({ queryKey: ['reports', data.companyId] });
    },
    ...options,
  });
}

export function useDeleteReportMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reportsBuilder.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
    ...options,
  });
}

export function useSendReportEmailMutation(
  options?: UseMutationOptions<Report, Error, { reportId: string; vendorEmail: string; emailContent?: string }>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, vendorEmail, emailContent }) => reportsBuilder.sendEmail(reportId, vendorEmail, emailContent),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
    ...options,
  });
}
