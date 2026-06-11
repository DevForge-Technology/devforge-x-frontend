"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, Input } from "@/shared/ui";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table } from "@/shared/ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { Plus, Search, Trash2, Pencil, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import NiceModal from "@ebay/nice-modal-react";
import {
  useReferralsQuery,
  useDeleteReferralMutation,
} from "@/lib/api/hooks/useReferrals";
import { useCompaniesQuery } from "@/lib/api/hooks/useCompanies";
import { useUsersQuery } from "@/lib/api/hooks/useUsers";
import type { ColumnDef } from "@/shared/ui/Table/type";
import { ReferralModal } from "../components/referral-modal";
import { toReferral, toCompany, toProfile } from "@/lib/types";
import type { Referral, Company, Profile } from "@/lib/types";
import { ConfirmationDeleteModal } from "@/components/shared/confirmation-delete-modal";

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

  // Search filter states
  const [companySearch, setCompanySearch] = useState("");
  const [companyOpen, setCompanyOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorOpen, setVendorOpen] = useState(false);

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
  if (profile?.last_used_company_id) {
    params.workspace_id = profile.last_used_company_id;
  }
  if (debouncedSearch) params.search = debouncedSearch;
  if (filterCompany && filterCompany !== "all")
    params.company_id = filterCompany;
  if (filterVendor && filterVendor !== "all") params.vendor_id = filterVendor;

  const { data, isLoading, isFetching } = useReferralsQuery(params);

  const deleteMutation = useDeleteReferralMutation();

  // Query filters if admin
  const { data: companiesData } = useCompaniesQuery(
    isAdmin
      ? { search: companySearch || undefined, page: 1, page_size: 25 }
      : undefined,
    { enabled: isAdmin },
  );
  const { data: usersData } = useUsersQuery(
    isAdmin
      ? { search: vendorSearch || undefined, page: 1, page_size: 25 }
      : undefined,
    { enabled: isAdmin },
  );

  const referrals = (data?.referrals || []).map(toReferral);
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rawCompanies = (companiesData?.companies || []).map(toCompany);
  const rawVendors = (usersData?.users || []).map(toProfile);

  // Make sure currently selected item is in the dropdown list even if it is not in the first page of search results
  const companies: Company[] = [...rawCompanies];
  if (selectedCompany && !companies.some((c) => c.id === selectedCompany.id)) {
    companies.push(selectedCompany);
  }

  const vendors = [...rawVendors];
  if (selectedVendor && !vendors.some((v) => v.id === selectedVendor.id)) {
    vendors.push(selectedVendor);
  }

  function openCreate() {
    NiceModal.show(ReferralModal);
  }

  function openEdit(referral: Referral) {
    NiceModal.show(ReferralModal, { editingReferral: referral });
  }

  async function handleDelete(id: string) {
    NiceModal.show(ConfirmationDeleteModal, {
      title: "Confirm Delete ?",
      description: "Are you sure want to delete this referral?",
      mutation: deleteMutation,
      payload: id,
      successMessage: "Referral deleted",
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(id);
          toast.success("Referral deleted");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to delete");
        }
      },
    });
  }

  const loading = isLoading || isFetching;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "All referrals across the platform"
              : "Your referrals for the active workspace"}
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
                {/* Company Search Filter */}
                <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-44 justify-between font-normal text-sm border-slate-200"
                    >
                      <span className="truncate">
                        {filterCompany !== "all" && selectedCompany
                          ? selectedCompany.name
                          : "All Companies"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search company..."
                        value={companySearch}
                        onValueChange={setCompanySearch}
                      />
                      <CommandList>
                        <CommandEmpty>No companies found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setFilterCompany("all");
                              setSelectedCompany(null);
                              setCompanyOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${filterCompany === "all" ? "opacity-100" : "opacity-0"}`}
                            />
                            All Companies
                          </CommandItem>
                          {companies.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.id}
                              onSelect={() => {
                                setFilterCompany(c.id);
                                setSelectedCompany(c);
                                setCompanyOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${filterCompany === c.id ? "opacity-100" : "opacity-0"}`}
                              />
                              <span className="truncate">{c.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Vendor Search Filter */}
                <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-44 justify-between font-normal text-sm border-slate-200"
                    >
                      <span className="truncate">
                        {filterVendor !== "all" && selectedVendor
                          ? selectedVendor.name
                          : "All Vendors"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search vendor..."
                        value={vendorSearch}
                        onValueChange={setVendorSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No vendors found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setFilterVendor("all");
                              setSelectedVendor(null);
                              setVendorOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${filterVendor === "all" ? "opacity-100" : "opacity-0"}`}
                            />
                            All Vendors
                          </CommandItem>
                          {vendors.map((v) => (
                            <CommandItem
                              key={v.id}
                              value={v.id}
                              onSelect={() => {
                                setFilterVendor(v.id);
                                setSelectedVendor(v);
                                setVendorOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${filterVendor === v.id ? "opacity-100" : "opacity-0"}`}
                              />
                              <span className="truncate">{v.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const referralColumns: ColumnDef<Referral>[] = [
              {
                key: "name",
                header: "Name",
                render: (ref) => (
                  <span className="font-medium">{ref.name}</span>
                ),
              },
              {
                key: "email",
                header: "Email",
                render: (ref) => (
                  <span className="text-muted-foreground">{ref.email}</span>
                ),
              },
              {
                key: "product_info",
                header: "Product Info",
                render: (ref) => (
                  <span className="max-w-[200px] truncate block">
                    {ref.product_info}
                  </span>
                ),
              },
              {
                key: "reference_links",
                header: "Reference Links",
                render: (ref) => (
                  <div className="flex flex-wrap gap-1">
                    {ref.reference_links
                      .slice(0, 2)
                      .map((link: string, i: number) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="text-xs gap-1 max-w-[120px]"
                        >
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
                ),
              },
              {
                key: "host_name",
                header: "Host",
                render: (ref) => (
                  <span className="text-muted-foreground text-sm">
                    {ref.host_name || "-"}
                  </span>
                ),
              },
              ...(isAdmin
                ? ([
                    {
                      key: "vendor_name",
                      header: "Vendor",
                      render: (ref: Referral) => ref.vendor_name,
                    },
                    {
                      key: "company_name",
                      header: "Company",
                      render: (ref: Referral) => ref.company_name,
                    },
                  ] as ColumnDef<Referral>[])
                : []),
              {
                key: "created_at",
                header: "Created",
                render: (ref) =>
                  format(new Date(ref.created_at), "MMM d, yyyy"),
              },
              {
                key: "actions",
                header: "Actions",
                align: "right",
                render: (ref) => (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(ref)}
                    >
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
                ),
              },
            ];

            return (
              <Table<Referral>
                columns={referralColumns}
                data={referrals}
                keyExtractor={(ref) => ref.id}
                page={page}
                totalPages={totalPages}
                totalItems={total}
                onPageChange={setPage}
                itemName="referrals"
                loading={loading}
                emptyMessage={
                  search
                    ? "No referrals match your search"
                    : "No referrals yet. Create one to get started."
                }
              />
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
