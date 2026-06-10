"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Trash2, Pencil, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import NiceModal from "@ebay/nice-modal-react";
import { useReferralsQuery, useDeleteReferralMutation } from "@/lib/api/hooks/useReferrals";
import { useCompaniesQuery } from "@/lib/api/hooks/useCompanies";
import { useUsersQuery } from "@/lib/api/hooks/useUsers";
import { ReferralModal } from "../components/referral-modal";
import { CommonPagination } from "@/components/shared/common-pagination";
import { toReferral, toCompany, toProfile } from "@/lib/types";
import type { Referral, Company, Profile } from "@/lib/types";

const PAGE_SIZE = 10;

export function ReferralsContainer() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>("all");
  const [filterVendor, setFilterVendor] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterCompany, filterVendor]);

  // Query referrals using react-query hook
  const params: Record<string, string | number> = {
    page,
    page_size: PAGE_SIZE,
  };
  if (debouncedSearch) params.search = debouncedSearch;
  if (filterCompany && filterCompany !== "all") params.company_id = filterCompany;
  if (filterVendor && filterVendor !== "all") params.vendor_id = filterVendor;

  const { data, isLoading, isFetching } = useReferralsQuery(params);

  const deleteMutation = useDeleteReferralMutation();

  // Query filters if admin
  const { data: companiesData } = useCompaniesQuery(
    isAdmin ? { page: 1, page_size: 100 } : undefined
  );
  const { data: usersData } = useUsersQuery(
    isAdmin ? { page: 1, page_size: 100 } : undefined
  );

  const referrals = (data?.referrals || []).map(toReferral);
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const companies = (companiesData?.companies || []).map(toCompany);
  const vendors = (usersData?.users || []).map(toProfile);

  function openCreate() {
    NiceModal.show(ReferralModal);
  }

  function openEdit(referral: Referral) {
    NiceModal.show(ReferralModal, { editingReferral: referral });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this referral?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Referral deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const loading = isLoading || isFetching;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "All referrals across the platform" : "Your referrals for the active workspace"}
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Referral
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search referrals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {isAdmin && (
              <>
                <Select value={filterCompany} onValueChange={setFilterCompany}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companies.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterVendor} onValueChange={setFilterVendor}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading && referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading referrals...</p>
          ) : referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {search ? "No referrals match your search" : "No referrals yet. Create one to get started."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Product Info</TableHead>
                    <TableHead>Reference Links</TableHead>
                    <TableHead>Host</TableHead>
                    {isAdmin && <TableHead>Vendor</TableHead>}
                    {isAdmin && <TableHead>Company</TableHead>}
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((ref: any) => (
                    <TableRow key={ref.id}>
                      <TableCell className="font-medium">{ref.name}</TableCell>
                      <TableCell className="text-muted-foreground">{ref.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{ref.product_info}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {ref.reference_links.slice(0, 2).map((link: any, i: any) => (
                            <Badge key={i} variant="secondary" className="text-xs gap-1 max-w-[120px]">
                              <LinkIcon className="h-3 w-3 shrink-0" />
                              <span className="truncate">{link}</span>
                            </Badge>
                          ))}
                          {ref.reference_links.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{ref.reference_links.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {ref.host_name || "-"}
                      </TableCell>
                      {isAdmin && <TableCell>{ref.vendor_name}</TableCell>}
                      {isAdmin && <TableCell>{ref.company_name}</TableCell>}
                      <TableCell className="text-muted-foreground">
                        {format(new Date(ref.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ref)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(ref.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <CommonPagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            loading={loading}
            onPageChange={setPage}
            itemName="referrals"
          />
        </CardContent>
      </Card>
    </div>
  );
}
