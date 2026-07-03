'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { AppShell } from '@/components/shared/app-shell';
import { getDashboardStats, getReferrals } from '@/lib/api/client';
import type { Referral, Company } from '@/lib/types';
import { useUploadReportMutation } from '@/lib/api/hooks/useReports';
import { ReportList } from '@/components/reports';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/shared/ui';
import {
  Users,
  Building2,
  FileText,
  ArrowRight,
  Upload,
  AlertTriangle,
  Loader2,
  Share2,
  Download,
  X,
  CloudUpload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DashboardContainer() {
  const router = useRouter();
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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

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
        
      }
      setLoading(false);
    }
    load();
  }, [isAdmin, profile?.assignedCompanies, profile?.last_used_company_id]);

  const activeWorkspace =
    vendorCompanies.find((c) => c.id === profile?.last_used_company_id) ??
    vendorCompanies[0];

  const triggerFileInput = (companyId: string) => {
    setSelectedCompanyId(companyId);
    fileInputRef.current?.click();
  };

  const handleGlobalUploadClick = () => {
    if (activeWorkspace) {
      setSelectedCompanyId(activeWorkspace.id);
    }
    setIsUploadModalOpen(true);
  };
  const handleRemoveStagedFile = (indexToRemove: number) => {
    setStagedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFilePreview = (file: File) => {
    const isPdf = file.type === 'application/pdf';
    return (
      <div className={`w-12 h-14 rounded-lg flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-wider shadow-2xs shrink-0 ${
        isPdf ? 'bg-rose-50 border border-rose-100 text-rose-500' : 'bg-blue-50 border border-blue-100 text-blue-500'
      }`}>
        <FileText className="h-5 w-5 opacity-80 mb-0.5" />
        {isPdf ? 'PDF' : 'DOC'}
      </div>
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const hasInvalidFile = files.some((f) => !allowedTypes.includes(f.type));
    if (hasInvalidFile) {
      alert('Only PDF, DOC, and DOCX files are allowed');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setStagedFiles((prev) => [...prev, ...files]);
  };

  const handleProcessUpload = async () => {
    if (stagedFiles.length === 0 || !selectedCompanyId) return;

    try {
      for (const file of stagedFiles) {
        await uploadMutation.mutateAsync({
          companyId: selectedCompanyId,
          file,
          dto: {},
        });
      }
      alert('Signed report submitted successfully for review!');
      setIsUploadModalOpen(false);
      setStagedFiles([]);
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
        <div className="space-y-6 animate-pulse">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  const pendingNdas = vendorCompanies.filter((company: any) => {
    const status = company.ndaStatus?.toLowerCase();
    const isSelectedCompany = activeWorkspace ? company.id === activeWorkspace.id : true;
    return isSelectedCompany && !company.ndaUrl && (status === 'sent' || status === 'pending' || !company.ndaStatus);
  });

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto px-1 py-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
          multiple
          className="hidden"
        />

        {!isAdmin && activeWorkspace && (
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-primary uppercase">
            <span>Active Workspace</span>
            <span className="h-1 w-1 rounded-full bg-primary" />
            <span>{activeWorkspace.name}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
              {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </h1>
            {isAdmin && (
              <p className="text-sm font-semibold text-slate-400 mt-1">
                Overview of your platform
              </p>
            )}
          </div>
          {!isAdmin && (
            <Button 
              size="sm" 
              onClick={handleGlobalUploadClick}
              className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg gap-2 shadow-sm transition-colors"
            >
              <Upload className="h-4 w-4" /> New NDA Upload
            </Button>
          )}
        </div>

        {isAdmin && (
          <>
            <div className="grid gap-5 md:grid-cols-3">
              <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl p-6 flex flex-col justify-between group hover:shadow-sm hover:border-slate-200 transition-all duration-200">
                <CardContent className="p-0 flex flex-col justify-between h-full space-y-6">
                  <div className="flex justify-between items-start w-full">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">Total Vendors</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tight text-slate-950">{stats.total_vendors}</span>
                      </div>
                    </div>
                    <div className="p-2 bg-[#e6fcf5] text-[#0ca678] rounded-xl">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/vendors')}
                    className="w-full text-xs font-bold border-slate-100 text-slate-800 bg-slate-50/50 hover:bg-slate-50 rounded-xl py-5 gap-1 shadow-xs"
                  >
                    Manage Vendors <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl p-6 flex flex-col justify-between group hover:shadow-sm hover:border-slate-200 transition-all duration-200">
                <CardContent className="p-0 flex flex-col justify-between h-full space-y-6">
                  <div className="flex justify-between items-start w-full">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">Total Companies</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tight text-slate-950">{stats.total_companies}</span>
                      </div>
                    </div>
                    <div className="p-2 bg-[#e7f5ff] text-[#1c7ed6] rounded-xl">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/companies')}
                    className="w-full text-xs font-bold border-slate-100 text-slate-800 bg-slate-50/50 hover:bg-slate-50 rounded-xl py-5 gap-1 shadow-xs"
                  >
                    Manage Companies <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl p-6 flex flex-col justify-between group hover:shadow-sm hover:border-slate-200 transition-all duration-200">
                <CardContent className="p-0 flex flex-col justify-between h-full space-y-6">
                  <div className="flex justify-between items-start w-full">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">Total Referrals</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tight text-slate-950">{stats.total_referrals}</span>
                      </div>
                    </div>
                    <div className="p-2 bg-[#e6fcf5] text-[#0ca678] rounded-xl">
                      <FileText className="h-5 w-5" />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/referrals')}
                    className="w-full text-xs font-bold border-slate-100 text-slate-800 bg-slate-50/50 hover:bg-slate-50 rounded-xl py-5 gap-1 shadow-xs"
                  >
                    View Referrals <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl mt-4">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Recent Referrals</h3>
                <Button variant="ghost" size="sm" onClick={() => router.push('/referrals')} className="gap-1 text-primary hover:bg-primary/10 font-bold rounded-lg">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-6">
                {recentReferrals.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {recentReferrals.map((ref) => (
                      <div key={ref.id} className="py-3 flex justify-between items-center text-sm">
                        <span className="font-semibold text-slate-700">{ref.name || 'Unnamed Referral'}</span>
                        <span className="text-slate-400 font-mono text-xs">{ref.id}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-slate-400 font-medium">
                    No referrals yet
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!isAdmin && (
          <>
            {pendingNdas.length > 0 && (
              <div className="border border-amber-200 bg-amber-50/60 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                <div className="flex gap-4">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl h-fit">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Action Required: Sign NDA Agreements</h3>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        High Priority
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                      Please complete and upload your mutual nondisclosure agreement to activate full service integrations for the workspace.
                    </p>

                    {pendingNdas.map((company: any) => (
                      <div key={company.id} className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm mt-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">Mutual NDA - {company.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-400">Sent Oct 24, 2026</span>
                              <span className="text-rose-500 font-bold text-[11px] flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" /> Awaiting Signature
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs font-semibold rounded-lg shadow-sm">
                            <Download className="h-3.5 w-3.5" /> Download
                          </Button>
                          <Button
                            size="sm"
                            disabled={uploadMutation.isPending}
                            onClick={() => {
                              setSelectedCompanyId(company.id);
                              setIsUploadModalOpen(true);
                            }}
                            className="bg-primary hover:bg-primary/90 text-white gap-1.5 text-xs font-semibold rounded-lg shadow-sm"
                          >
                            {uploadMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                            Upload signed copy
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          

            {activeWorkspace && (
              <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl mt-4">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Uploaded Reports</h3>
                    <p className="text-xs text-slate-400">Reports uploaded for {activeWorkspace.name}</p>
                  </div>
                </div>
                <CardContent className="p-6">
                  <ReportList companyId={activeWorkspace.id} isAdmin={false} />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Upload NDA - {vendorCompanies.find(c => c.id === selectedCompanyId)?.name || activeWorkspace?.name || 'Workspace'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Provide signed PDF legal copies only.</p>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div 
                onClick={() => triggerFileInput(selectedCompanyId || '')}
                className="border-2 border-dashed border-slate-200 hover:border-primary bg-slate-50/50 hover:bg-primary/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
              >
                <div className="p-3 bg-primary/10 text-primary rounded-full group-hover:scale-110 transition-transform">
                  <CloudUpload className="h-6 w-6" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-slate-800">Drag and drop signed NDA copy here</p>
                  <p className="text-xs text-slate-400">Supported formats: PDF (max 10MB)</p>
                </div>
              </div>
           
              {stagedFiles.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Documents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                    {stagedFiles.map((file, idx) => (
                      <div key={idx} className="relative flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-xs group hover:border-slate-200 transition-all">
                        {getFilePreview(file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedFile(idx)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setStagedFiles([]);
                  }}
                  className="rounded-xl font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 text-xs py-5 px-4"
                >
                  Cancel
                </Button>
                <Button 
                  disabled={uploadMutation.isPending || stagedFiles.length === 0}
                  onClick={handleProcessUpload}
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-xs py-5 px-4 gap-1.5"
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CloudUpload className="h-4 w-4" />
                  )}
                  Process NDA Copy
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}