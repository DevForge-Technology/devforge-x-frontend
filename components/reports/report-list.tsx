'use client';

import React, { useState, useRef } from "react";
import { useCompanyReportsQuery, useDeleteReportMutation, useUploadReportMutation } from '@/lib/api/hooks/useReports';
import { useApproveNdaMutation } from "@/lib/api/hooks/useCompanies";
import { Button } from '@/components/ui/button';
import { Report } from '@/lib/api/builders/reports';
import { companiesBuilder } from "@/lib/api/builders/companies";
import { useAuth } from '@/lib/auth/auth-context';
import NiceModal from "@ebay/nice-modal-react";
import { ConfirmationDeleteModal } from "@/components/shared/confirmation-delete-modal";
import { 
  FileText, 
  Download, 
  Upload, 
  X, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileCheck2 
} from "lucide-react";
import { toast } from "sonner";
import { extractError } from "@/lib/services/apiService";

interface ReportListProps {
  companyId: string;
  isAdmin?: boolean;
}

export function ReportList({ companyId, isAdmin = false }: ReportListProps) {
  const { data, isLoading, error } = useCompanyReportsQuery(companyId, { type: 'NDA', page: 1, page_size: 50 });
  const deleteMutation = useDeleteReportMutation();
  const uploadMutation = useUploadReportMutation();
  const approveNdaMutation = useApproveNdaMutation();
  const { profile } = useAuth();
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  const handleDownload = async (report: Report) => {
    const toastId = toast.loading("Downloading report...");
    try {
      let downloadUrl = report.fileUrl;
      let downloadFileName = report.fileName || 'NDA.pdf';

      if (report.type === 'NDA' && (!report.fileUrl || report.status === 'pending')) {
        // Fetch dynamically generated template PDF from backend
        const fileBlob = await companiesBuilder.downloadNda(report.companyId);
        downloadUrl = URL.createObjectURL(fileBlob);
        downloadFileName = `NDA_${report.companyId}.pdf`;
      }

      if (!downloadUrl) {
        toast.error("No file URL found for this report");
        return;
      }

      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Downloaded successfully", { id: toastId });
    } catch (error) {
      toast.error(`Error downloading report: ${extractError(error)}`, { id: toastId });
    }
  };

  const handleUploadClick = (reportId: string) => {
    setActiveReportId(reportId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeReportId) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, DOC, and DOCX files are allowed');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const toastId = toast.loading('Uploading file...');
    try {
      await uploadMutation.mutateAsync({
        companyId,
        file,
        dto: { type: 'NDA', reportId: activeReportId }
      });
      toast.success('NDA copy uploaded successfully!', { id: toastId });
    } catch (err) {
      toast.error(`Upload failed: ${extractError(err)}`, { id: toastId });
    } finally {
      setActiveReportId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveUpload = async (reportId: string) => {
    try {
      await NiceModal.show(ConfirmationDeleteModal, {
        title: "Remove NDA Upload?",
        description: "Are you sure you want to remove this uploaded copy? The document status will reset back to pending.",
        payload: { reportId, action: 'reset' },
        mutation: deleteMutation,
        successMessage: "NDA upload removed successfully!",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await NiceModal.show(ConfirmationDeleteModal, {
        title: "Delete NDA Record?",
        description: "Are you sure you want to completely delete this NDA record?",
        payload: { reportId, action: 'delete' },
        mutation: deleteMutation,
        successMessage: "NDA record deleted successfully!",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleApproveNda = (reportCompanyId: string) => {
    const toastId = toast.loading("Approving NDA...");
    approveNdaMutation.mutate(reportCompanyId, {
      onSuccess: () => {
        toast.success("NDA approved successfully", { id: toastId });
      },
      onError: (err) => {
        toast.error(`Failed to approve NDA: ${extractError(err)}`, { id: toastId });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading NDA reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3 text-sm">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span>Error loading reports: {error.message}</span>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
        <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-400">No reports generated or uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx"
        className="hidden"
      />

      <div className="space-y-3">
        {data.data.map((report: Report) => {
          const isPending = report.status === 'pending' || !report.status;
          const isUploaded = report.status === 'uploaded';
          const isSigned = report.status === 'signed';
          const isRejected = report.status === 'rejected';

          return (
            <div 
              key={report.id} 
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-2xs hover:border-slate-200 transition-all duration-200"
            >
              {/* File details & icon */}
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                  isSigned ? 'bg-teal-50 text-teal-600' :
                  isUploaded ? 'bg-blue-50 text-blue-600' :
                  isRejected ? 'bg-rose-50 text-rose-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {isSigned ? (
                    <FileCheck2 className="h-6 w-6" />
                  ) : (
                    <FileText className="h-6 w-6" />
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 truncate max-w-md" title={report.fileName}>
                    {report.fileName || 'NDA Document'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    {report.fileSize > 0 && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span>{(report.fileSize / 1024).toFixed(2)} KB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge & Actions */}
              <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end">
                {/* Badge */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isSigned ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                  isUploaded ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                  isRejected ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                  'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  {!isSigned && !isUploaded && !isRejected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                  {isSigned ? 'Signed & Approved' :
                   isUploaded ? 'Awaiting Review' :
                   isRejected ? 'Rejected' :
                   'Pending Upload'}
                </span>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Download: template or uploaded file */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(report)}
                    className="gap-1.5 text-xs font-semibold rounded-lg text-slate-700 border-slate-200 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {isPending ? 'Download Template' : 'Download'}
                  </Button>

                  {/* Vendor actions */}
                  {!isAdmin && profile?.role === 'vendor' && (
                    <>
                      {isPending && (
                        <Button
                          size="sm"
                          disabled={uploadMutation.isPending}
                          onClick={() => handleUploadClick(report.id)}
                          className="bg-primary hover:bg-primary/90 text-white gap-1.5 text-xs font-semibold rounded-lg"
                        >
                          {uploadMutation.isPending && activeReportId === report.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          Upload signed copy
                        </Button>
                      )}

                      {isUploaded && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploadMutation.isPending}
                            onClick={() => handleUploadClick(report.id)}
                            className="gap-1.5 text-xs font-semibold rounded-lg text-slate-700 border-slate-200 hover:bg-slate-50"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Exchange
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveUpload(report.id)}
                            className="gap-1.5 text-xs font-semibold rounded-lg text-rose-600 border-rose-100 hover:bg-rose-50/50 hover:border-rose-200"
                          >
                            <X className="h-3.5 w-3.5" />
                            Remove
                          </Button>
                        </>
                      )}

                      {isRejected && (
                        <Button
                          size="sm"
                          disabled={uploadMutation.isPending}
                          onClick={() => handleUploadClick(report.id)}
                          className="bg-primary hover:bg-primary/90 text-white gap-1.5 text-xs font-semibold rounded-lg"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Re-upload signed copy
                        </Button>
                      )}
                    </>
                  )}

                  {/* Admin actions */}
                  {isAdmin && isUploaded && (
                    <Button
                      size="sm"
                      onClick={() => handleApproveNda(report.companyId)}
                      disabled={approveNdaMutation.isPending}
                      className="bg-primary hover:bg-primary/90 text-white gap-1.5 text-xs font-semibold rounded-lg"
                    >
                      {approveNdaMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      Approve NDA
                    </Button>
                  )}

                  {/* Complete delete of record if custom upload */}
                  {!isSigned && profile?.role === 'vendor' && !isPending && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReport(report.id)}
                      className="text-slate-400 hover:text-rose-600 p-2"
                      title="Delete Report Record"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}