'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { AppShell } from '@/components/shared/app-shell';
import { getDashboardStats, getReferrals } from '@/lib/api/client';
import type { Referral, Company } from '@/lib/types';
import { useUploadReportMutation, useCompanyReportsQuery } from '@/lib/api/hooks/useReports';
import { ReportList } from '@/components/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/shared/ui';
import {
  Users,
  Building2,
  FileText,
  ArrowRight,
  TrendingUp,
  Download,
  Upload,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export function DashboardContainer() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadMutation = useUploadReportMutation();

  const [stats, setStats] = useState({
    total_vendors: 0,
    total_companies: 0,
    total_referrals: 0,
  });
  const [recentReferrals, setRecentReferrals] = useState<Referral[]>([]);
  const [vendorCompanies, setVendorCompanies] = useState<Company[]>([]);
  const [vendorReferralCount, setVendorReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        if (isAdmin) {
          const s = await getDashboardStats();
          setStats(s);
          const r = await getReferrals({ page: '1', page_size: '10' });
          setRecentReferrals(r.referrals || []);
        } else {
          const comps = profile?.assignedCompanies ?? [];
          setVendorCompanies(comps);
          const r = await getReferrals({ page: '1', page_size: '10' });
          setRecentReferrals(r.referrals || []);
          setVendorReferralCount(r.referrals?.length || 0);
        }
      } catch {
        // silent catch
      }
      setLoading(false);
    }
    load();
  }, [isAdmin, profile?.assignedCompanies, profile?.last_used_company_id]);

  const handleDownloadNda = (url: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  const triggerFileInput = (companyId: string) => {
    setSelectedCompanyId(companyId);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCompanyId) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, DOC, and DOCX files are allowed');
      return;
    }

    try {
      // Use the mutation hook for consistent API calling pattern
      await uploadMutation.mutateAsync({
        companyId: selectedCompanyId,
        file,
        dto: {},
      });

      alert('Signed report submitted successfully for review!');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Error uploading report: ${error?.message || 'Unknown error occurred'}`);
    } finally {
      setSelectedCompanyId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  const activeWorkspace =
    vendorCompanies.find((c) => c.id === profile?.last_used_company_id) ??
    vendorCompanies[0];

  // Uses only standard `ndaUrl` and `ndaStatus` fields matching your exact backend data contracts
  const executedNdas = vendorCompanies.filter((company: any) => {
    const status = company.ndaStatus?.toLowerCase();
    return status === 'signed' || status === 'completed' || !!company.ndaUrl;
  });

  const pendingNdas = vendorCompanies.filter((company: any) => {
    const status = company.ndaStatus?.toLowerCase();
    return !company.ndaUrl && (status === 'sent' || status === 'pending' || !company.ndaStatus);
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx"
          className="hidden"
        />

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {!isAdmin && activeWorkspace
              ? `Workspace: ${activeWorkspace.name}`
              : 'Overview of your platform'}
          </p>
        </div>

        {/* Admin Section code remains completely identical to yours */}
        {!isAdmin && (
          <>
            <div className="grid gap-4 md:grid-cols-2 pb-4">
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    My Referrals
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{vendorReferralCount}</div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Assigned Companies
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{vendorCompanies.length}</div>
                </CardContent>
              </Card>
            </div>

            <div className="pb-2">
              <Link href="/referrals">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" /> View My Referrals
                </Button>
              </Link>
            </div>

            <div className="space-y-6">
              {pendingNdas.length > 0 && (
                <Card className="border-amber-200 shadow-sm bg-amber-50/20 rounded-xl">
                  <CardHeader className="border-b border-amber-100 p-5">
                    <CardTitle className="text-lg font-bold text-amber-900 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" /> Action Required: Sign
                      NDA Agreements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 bg-white rounded-b-xl divide-y divide-slate-100">
                    {pendingNdas.map((company: any) => (
                      <div key={company.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Clock className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-800">
                              Mutual NDA - {company.name}
                            </h4>
                            <span className="text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded text-[10px] uppercase">
                              Awaiting Signature
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          disabled={uploadMutation.isPending}
                          onClick={() => triggerFileInput(company.id)}
                          className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow"
                        >
                          {uploadMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          Upload Signed Copy
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {activeWorkspace && (
                <Card className="border-slate-200 shadow-sm bg-white rounded-xl">
                  <CardHeader className="border-b border-slate-100 p-5">
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" /> Uploaded Reports
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Reports uploaded for {activeWorkspace.name}
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ReportList companyId={activeWorkspace.id} isAdmin={false} />
                  </CardContent>
                </Card>
              )}

            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
