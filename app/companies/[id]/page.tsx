"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/ui"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Building2, ShieldCheck } from "lucide-react";
import { useCompaniesQuery, useGenerateNdaMutation } from "@/lib/api/hooks/useCompanies";
import { NdaTemplateModal } from "@/components/shared/nda-template-modal";
import { toast } from "sonner";

export default function CompanyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const generateNdaMutation = useGenerateNdaMutation();
  const [isModalOpen, setIsModalOpen] = useState(false); 

  const { data, isLoading } = useCompaniesQuery({ page: 1, page_size: 100 });
  const company = data?.companies?.find((c: any) => c.id === id) as (any & {
  vendor?: { name?: string; email?: string }
});

  if (isLoading) {
    return <div className="p-8 max-w-5xl mx-auto text-center text-slate-500 animate-pulse">Loading...</div>;
  }

  if (!company) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center space-y-4">
        <p className="text-red-600 font-medium">Company profile data could not be located.</p>
        <Button onClick={() => router.push("/companies")}>Return to Companies List</Button>
      </div>
    );
  }

  const processNdaSubmission = ({ email, templateId }: { email: string; templateId: string }) => {
    setIsModalOpen(false);
    const toastId = toast.loading(`Generating and dispatching email to ${email}...`);

    generateNdaMutation.mutate({ companyId: company.id, customEmail: email, templateId }, {
      onSuccess: (fileBlob) => {
        const downloadUrl = window.URL.createObjectURL(fileBlob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", `NDA_${company.name.replace(/\s+/g, "_")}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        toast.success("NDA downloaded and customized email sent successfully!", { id: toastId });
      },
      onError: (err) => {
        console.error("Pipeline Failure:", err);
        toast.error("Could not process agreement delivery.", { id: toastId });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/companies")} className="gap-2 text-slate-600">
          <ArrowLeft className="h-4 w-4" /> Back to Companies
        </Button>
  
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-blue-600 text-white shadow-sm">
          <FileText className="h-4 w-4" /> Generate NDA
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Building2 className="h-6 w-6" /></div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">{company.name}</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">Company Profile Dashboard</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company ID Reference</h4>
              <p className="text-sm font-mono text-slate-700 bg-slate-50 border rounded-md px-3 py-2 mt-1 truncate">{company.id}</p>
            </div>
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <div>
                <span className="block font-medium text-emerald-800">Operational Verification Status</span>
                <span className="text-xs text-emerald-600">Active Pipeline Layer</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Status</h4>
            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 mt-1.5 capitalize">
              {company.status || "Active"}
            </span>
          </div>
        </CardContent>
      </Card>

      <NdaTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialEmail={company.vendor?.email || ""}
        companyName={company.name}
        vendorName={company.vendor?.name || ""}
        onConfirm={processNdaSubmission}
        isPending={generateNdaMutation.isPending}
      />
    </div>
  );
}