"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button, Input } from "@/shared/ui";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { Plus, Search, Trash2, Pencil, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import NiceModal from "@ebay/nice-modal-react";
import { useReferralsQuery, useDeleteReferralMutation } from "@/lib/api/hooks/useReferrals";
import { useCompaniesQuery } from "@/lib/api/hooks/useCompanies";
import { useUsersQuery } from "@/lib/api/hooks/useUsers";
import type { ColumnDef } from "@/shared/ui/Table/type";
import { ReferralModal } from "../components/referral-modal";
import { toReferral, toCompany, toProfile } from "@/lib/types";
import type { Referral, Company, Profile } from "@/lib/types";
import { ConfirmationDeleteModal } from "@/components/shared/confirmation-delete-modal";
import { Table } from "@/shared/ui";

const PAGE_SIZE = 10;

export function ReferralsContainer() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>("all");
  const [filterVendor, setFilterVendor] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Profile | null>(null);
  const [page, setPage] = useState(1);
  const [companySearch, setCompanySearch] = useState("");
  const [companyOpen, setCompanyOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorOpen, setVendorOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [filterCompany, filterVendor]);

  const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
  if (profile?.last_used_company_id) params.workspace_id = profile.last_used_company_id;
  if (debouncedSearch) params.search = debouncedSearch;
  if (filterCompany !== "all") params.company_id = filterCompany;
  if (filterVendor !== "all") params.vendor_id = filterVendor;

  const { data, isLoading, isFetching } = useReferralsQuery(params);
  const deleteMutation = useDeleteReferralMutation();
  const { data: companiesData } = useCompaniesQuery(isAdmin ? { search: companySearch || undefined, page: 1, page_size: 25 } : undefined, { enabled: isAdmin });
  const { data: usersData } = useUsersQuery(isAdmin ? { search: vendorSearch || undefined, page: 1, page_size: 25 } : undefined, { enabled: isAdmin });

  const referrals = (data?.referrals || []).map(toReferral);
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const companies = [...(companiesData?.companies || []).map(toCompany)];
  const vendors = [...(usersData?.users || []).map(toProfile)];

  function openCreate() { NiceModal.show(ReferralModal); }
  function openEdit(referral: Referral) { NiceModal.show(ReferralModal, { editingReferral: referral }); }

  async function handleDelete(id: string) {
    NiceModal.show(ConfirmationDeleteModal, {
      title: "Confirm Delete ?",
      description: "Are you sure want to delete this referral?",
      mutation: deleteMutation,
      payload: id,
      successMessage: "Referral deleted",
      onConfirm: async () => {
        try { await deleteMutation.mutateAsync(id); toast.success("Referral deleted"); } 
        catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete"); }
      },
    });
  }

  const referralColumns: ColumnDef<Referral>[] = [
    { key: "name", header: "Name", render: (ref) => <span className="font-medium">{ref.name}</span> },
    { key: "email", header: "Email", render: (ref) => <span className="text-muted-foreground">{ref.email}</span> },
    { key: "product_info", header: "Product Info", render: (ref) => <span className="max-w-[200px] truncate block">{ref.product_info}</span> },
    { key: "reference_links", header: "Reference Links", render: (ref) => (
        <div className="flex flex-wrap gap-1">
          {ref.reference_links.slice(0, 2).map((link, i) => (
            <Badge key={i} variant="secondary" className="text-xs"><LinkIcon className="h-3 w-3 mr-1" />{link}</Badge>
          ))}
        </div>
      ) 
    },
    { key: "host_name", header: "Host", render: (ref) => ref.host_name || "-" },
    ...(isAdmin ? [{ key: "vendor_name", header: "Vendor", render: (ref: Referral) => ref.vendor_name }, { key: "company_name", header: "Company", render: (ref: Referral) => ref.company_name }] as ColumnDef<Referral>[] : []),
    { key: "created_at", header: "Created", render: (ref) => format(new Date(ref.created_at), "MMM d, yyyy") },
    { key: "actions", header: "Actions", align: "right", render: (ref) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(ref)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(ref.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ) 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
          <p className="text-muted-foreground">{isAdmin ? "All referrals across the platform" : "Your referrals for the active workspace"}</p>
        </div>
        {!isAdmin && <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> New Referral</Button>}
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Input placeholder="Search referrals by name, email, or product..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" startIcon={<Search className="h-4 w-4 text-muted-foreground" />} />
          {isAdmin && (
            <div className="flex gap-3">
              <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                <PopoverTrigger asChild><Button variant="outline" className="w-40 justify-between">{selectedCompany?.name || "All Companies"}<ChevronsUpDown className="h-4 w-4 opacity-50" /></Button></PopoverTrigger>
                <PopoverContent className="w-48 p-0"><Command><CommandInput placeholder="Search company..." value={companySearch} onValueChange={setCompanySearch} /><CommandList><CommandGroup>{companies.map((c) => <CommandItem key={c.id} onSelect={() => { setFilterCompany(c.id); setSelectedCompany(c); setCompanyOpen(false); }}>{c.name}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
              </Popover>
              <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                <PopoverTrigger asChild><Button variant="outline" className="w-40 justify-between">{selectedVendor?.name || "All Vendors"}<ChevronsUpDown className="h-4 w-4 opacity-50" /></Button></PopoverTrigger>
                <PopoverContent className="w-48 p-0"><Command><CommandInput placeholder="Search vendor..." value={vendorSearch} onValueChange={setVendorSearch} /><CommandList><CommandGroup>{vendors.map((v) => <CommandItem key={v.id} onSelect={() => { setFilterVendor(v.id); setSelectedVendor(v); setVendorOpen(false); }}>{v.name}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
              </Popover>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table<Referral> columns={referralColumns} data={referrals} keyExtractor={(r) => r.id} page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} loading={isLoading || isFetching} />
        </CardContent>
      </Card>
    </div>
  );
}