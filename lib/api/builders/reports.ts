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
}

export const reportsBuilder = {
  upload: async (companyId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiService.post<Report>(`/reports/upload/${companyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getCompanyReports: async (
    companyId: string,
    params?: { page?: number; page_size?: number },
  ) => {
    const { data } = await apiService.get<{
      data: Report[];
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/reports/company/${companyId}`, { params });
    return data;
  },

  delete: async (reportId: string) => {
    const { data } = await apiService.delete<{ success: boolean }>(`/reports/${reportId}`);
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

