'use client';

import { useCompanyReportsQuery, useDeleteReportMutation } from '@/lib/api/hooks/useReports';
import { Button } from '@/components/ui/button';
import { Report } from '@/lib/api/builders/reports';
import { useAuth } from '@/lib/auth/auth-context';

interface ReportListProps {
  companyId: string;
  isAdmin?: boolean;
}

export function ReportList({ companyId, isAdmin = false }: ReportListProps) {
  const { data, isLoading, error } = useCompanyReportsQuery(companyId);
  const deleteMutation = useDeleteReportMutation();
  const { profile } = useAuth()

  const handleDelete = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(reportId);
      alert('Report deleted successfully!');
    } catch (error) {
      alert(`Error deleting report: ${error}`);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading reports...</div>;
  }

  if (error) {
    return (
      <div className="p-3 bg-red-100 text-red-700 rounded">
        Error loading reports: {error.message}
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No reports uploaded yet</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Uploaded Reports</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2 text-left">File Name</th>
              <th className="border border-gray-300 p-2 text-left">Size (KB)</th>
              <th className="border border-gray-300 p-2 text-left">Uploaded Date</th>
              {
                profile?.role === "vendor" &&
                <th className="border border-gray-300 p-2 text-left">
                  Action
                </th>
              }
            </tr>
          </thead>
          <tbody>
            {data.data.map((report: Report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2">
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {report.fileName}
                  </a>
                </td>
                <td className="border border-gray-300 p-2 text-sm">{(report.fileSize / 1024).toFixed(2)}</td>
                <td className="border border-gray-300 p-2 text-sm">
                  {new Date(report.createdAt).toLocaleDateString()}
                </td>
                {profile?.role === "vendor" && <td className="border border-gray-300 p-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(report.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.pagination && (
        <div className="flex justify-center gap-4 mt-4 text-sm">
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <span>Total: {data.pagination.total} reports</span>
        </div>
      )}
    </div>
  );
}

