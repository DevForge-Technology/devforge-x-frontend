import { useMutation, useQuery, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { reportsBuilder, Report } from '../builders/reports';

export function useCompanyReportsQuery(
  companyId: string,
  params?: { page?: number; page_size?: number; type?: 'GENERAL' | 'NDA' },
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
    { companyId: string; file: File; dto?: { type?: 'GENERAL' | 'NDA'; reportId?: string } }
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, file, dto }) => reportsBuilder.upload(companyId, file, dto?.type ?? 'GENERAL', dto?.reportId),
    onSuccess: (data: Report, variables) => {
      const targetCompanyId = variables.companyId || data?.companyId;
      if (targetCompanyId) {
        qc.invalidateQueries({ 
          queryKey: ['reports', targetCompanyId],
          exact: false,
        });
      } else {
        qc.invalidateQueries({ queryKey: ['reports'] });
      }
    },
    ...options,
  });
}

export function useDeleteReportMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string | { reportId: string; action?: 'reset' | 'delete' }>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables) => {
      if (typeof variables === 'string') {
        return reportsBuilder.delete(variables);
      } else {
        return reportsBuilder.delete(variables.reportId, variables.action);
      }
    },
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
