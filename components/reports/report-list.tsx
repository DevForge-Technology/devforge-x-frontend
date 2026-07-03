'use client';
import React, { useState } from "react";
import { useCompanyReportsQuery, useDeleteReportMutation } from '@/lib/api/hooks/useReports';
import { Button } from '@/components/ui/button';
import { Report } from '@/lib/api/builders/reports';
import { useAuth } from '@/lib/auth/auth-context';
import NiceModal from "@ebay/nice-modal-react";
import { ConfirmationDeleteModal } from "@/components/shared/confirmation-delete-modal";

interface ReportListProps {
  companyId: string;
  isAdmin?: boolean;
}

export function ReportList({ companyId, isAdmin = false }: ReportListProps) {
  const { data, isLoading, error } = useCompanyReportsQuery(companyId);
  const deleteMutation = useDeleteReportMutation();
  const { profile } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (reportId: string) => {
    try {
      await NiceModal.show(ConfirmationDeleteModal, {
        title: "Confirm Delete ?",
        description: "Are you sure want to delete this report?",
        payload: reportId,
        mutation: deleteMutation,
        successMessage: "Report deleted successfully!",
      });
      
      setDeletingId(reportId);
      await deleteMutation.mutateAsync(reportId);
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const response = await fetch(report.fileUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Error downloading report: ${error}`);
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
        <table className="w-full border-collapse border border-primary/20">
          <thead className="bg-primary/10">
            <tr>
              <th className="border border-primary/10 p-2 text-left">File Name</th>
              <th className="border border-primary/10 p-2 text-left">Size (KB)</th>
              <th className="border border-primary/10 p-2 text-left">Uploaded Date</th>
              {profile?.role === "vendor" && (
                <th className="border border-primary/10 p-2 text-left">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.data.map((report: Report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="border border-primary/10 p-2">
                  <button
                    onClick={() => handleDownload(report)}
                    className="text-slate-900 hover:text-primary hover:underline text-left"
                  >
                    {report.fileName}
                  </button>
                </td>
                <td className="border border-primary/10 p-2 text-sm">
                  {(report.fileSize / 1024).toFixed(2)}
                </td>
                <td className="border border-primary/10 p-2 text-sm">
                  {new Date(report.createdAt).toLocaleDateString()}
                </td>
                {profile?.role === "vendor" && (
                  <td className="border border-primary/10 p-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      loading={deletingId === report.id}
                      disabled={deletingId !== null && deletingId !== report.id}
                      onClick={() => handleDelete(report.id)}
                    >
                      Delete
                    </Button>
                  </td>
                )}
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