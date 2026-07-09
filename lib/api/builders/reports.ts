import { apiService } from '../../services/apiService';

export interface Report {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  vendorId: string;
  companyId: string;
  sentToEmail?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  status?: 'pending' | 'uploaded' | 'signed' | 'rejected' | string;
  type?: 'GENERAL' | 'NDA' | string;
}

export const reportsBuilder = {
  upload: async (companyId: string, file: File, type: 'GENERAL' | 'NDA' = 'GENERAL', reportId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (reportId) {
      formData.append('reportId', reportId);
    }

    const { data } = await apiService.post<Report>(`/reports/upload/${companyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getCompanyReports: async (
    companyId: string,
    params?: { page?: number; page_size?: number; type?: 'GENERAL' | 'NDA' },
  ) => {
    const { data } = await apiService.get<{
      data: Report[];
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/reports/company/${companyId}`, { params });
    return data;
  },

  delete: async (reportId: string, action?: 'reset' | 'delete') => {
    const { data } = await apiService.delete<{ success: boolean }>(`/reports/${reportId}`, {
      params: { action },
    });
    return data;
  },

  sendEmail: async (reportId: string, vendorEmail: string, emailContent?: string) => {
    const { data } = await apiService.post<Report>(`/reports/${reportId}/send`, {
      reportId,
      vendorEmail,
      emailContent,
    });
    return data;
  },
};

