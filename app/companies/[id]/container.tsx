'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/shared/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileText, Building2, ShieldCheck, FileCheck } from 'lucide-react';
import { useCompaniesQuery } from '@/lib/api/hooks/useCompanies';
import { useAuth } from '@/lib/auth/auth-context';
import { NdaTemplateModal } from '@/components/shared/nda-template-modal';
import { AgreementTemplateModal } from '@/components/shared/agreement-template-modal';
import { ReportList } from '@/components/reports';
import { toast } from 'sonner';
import NiceModal from '@ebay/nice-modal-react';

export function CompanyDetailContainer() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const { data, isLoading } = useCompaniesQuery({ page: 1, page_size: 100 });
  const company = data?.companies?.find((c: any) => c.id === id) as (any & {
    vendor?: { name?: string; email?: string };
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-36" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-44" />
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm bg-white rounded-xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <Skeleton className="h-3 w-36 mb-2" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-3 w-28 mb-2" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center space-y-4">
        <p className="text-red-600 font-medium">Company profile data could not be located.</p>
        <Button onClick={() => router.push('/companies')}>Return to Companies List</Button>
      </div>
    );
  }

  const handleGenerateNdaClick = () => {
  NiceModal.show(NdaTemplateModal, {
    companyId: company.id,
    initialEmail: company.vendor?.email || '',
    companyName: company.name,
    vendorName: company.vendor?.name || '',
  });
};

  const handleGenerateAgreementClick = () => {
    NiceModal.show(AgreementTemplateModal, {
      companyId: company.id,
      initialEmail: company.vendor?.email || '',
      companyName: company.name,
      vendorName: company.vendor?.name || '',
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/companies')}
          className="gap-2 text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Companies
        </Button>

        <div className="flex items-center gap-3">
          <Button onClick={handleGenerateNdaClick} className="gap-2 bg-primary text-white shadow-sm">
  <FileText className="h-4 w-4" /> Generate NDA
</Button>
          <Button 
            onClick={handleGenerateAgreementClick} 
            className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-sm"
          >
            <FileCheck className="h-4 w-4" /> Generate Agreement
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">{company.name}</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">Company Profile Dashboard</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Company ID Reference
              </h4>
              <p className="text-sm font-mono text-slate-700 bg-slate-50 border rounded-md px-3 py-2 mt-1 truncate">
                {company.id}
              </p>
            </div>
           <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-lg p-3">
  <ShieldCheck className="h-5 w-5 text-primary" />
  <div>
    <span className="block font-medium text-slate-800">Operational Verification Status</span>
    <span className="text-xs text-primary font-medium">Active Pipeline Layer</span>
  </div>
</div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Status</h4>
            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mt-1.5 capitalize">
              {company.status || 'Active'}
            </span>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="border-slate-200 shadow-sm bg-white rounded-xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <CardTitle className="text-lg font-bold text-slate-900">
              <FileText className="h-5 w-5 inline mr-2" /> Company Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ReportList companyId={company.id} isAdmin={true} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}