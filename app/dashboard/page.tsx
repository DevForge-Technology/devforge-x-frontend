"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { AppShell } from "@/components/shared/app-shell";
import { getDashboardStats, getReferrals } from "@/lib/api/client";
import type { Referral, Company } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building2,
  FileText,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [stats, setStats] = useState({ total_vendors: 0, total_companies: 0, total_referrals: 0 });
  const [recentReferrals, setRecentReferrals] = useState<Referral[]>([]);
  const [vendorCompanies, setVendorCompanies] = useState<Company[]>([]);
  const [vendorReferralCount, setVendorReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (isAdmin) {
          const s = await getDashboardStats();
          setStats(s);
          const r = await getReferrals({ page: "1", page_size: "10" });
          setRecentReferrals(r.referrals || []);
        } else {
          const comps = profile?.assignedCompanies ?? [];
          setVendorCompanies(comps);
          const r = await getReferrals({ page: "1", page_size: "10" });
          setRecentReferrals(r.referrals || []);
          setVendorReferralCount(r.referrals?.length || 0);
        }
      } catch {
        // silent
      }
      setLoading(false);
    }
    load();
  }, [isAdmin, profile?.assignedCompanies]);

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

  const activeWorkspace = vendorCompanies.find((c) => c.id === profile?.last_used_company_id) ?? vendorCompanies[0];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isAdmin ? "Admin Dashboard" : "Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Overview of your platform"
              : activeWorkspace
              ? `Workspace: ${activeWorkspace.name}`
              : "No workspace assigned"}
          </p>
        </div>

        {isAdmin ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total_vendors}</div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Companies</CardTitle>
                  <Building2 className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total_companies}</div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
                  <FileText className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total_referrals}</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Link href="/vendors">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Vendors
                </Button>
              </Link>
              <Link href="/companies">
                <Button variant="outline" size="sm">
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Companies
                </Button>
              </Link>
              <Link href="/referrals">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View Referrals
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">My Referrals</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{vendorReferralCount}</div>
                </CardContent>
              </Card>
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Companies</CardTitle>
                  <Building2 className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{vendorCompanies.length}</div>
                </CardContent>
              </Card>
            </div>

            <Link href="/referrals">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                View My Referrals
              </Button>
            </Link>
          </>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Referrals</CardTitle>
            <Link href="/referrals">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentReferrals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No referrals yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Product Info</th>
                      {isAdmin && <th className="pb-2 font-medium">Vendor</th>}
                      {isAdmin && <th className="pb-2 font-medium">Company</th>}
                      <th className="pb-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReferrals.map((ref) => (
                      <tr key={ref.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{ref.name}</td>
                        <td className="py-2 text-muted-foreground">{ref.email}</td>
                        <td className="py-2 max-w-[200px] truncate">{ref.product_info}</td>
                        {isAdmin && <td className="py-2">{ref.vendor_name}</td>}
                        {isAdmin && <td className="py-2">{ref.company_name}</td>}
                        <td className="py-2 text-muted-foreground">
                          {format(new Date(ref.created_at), "MMM d, yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
