"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, Input, Table } from "@/shared/ui";
import { Badge } from "@/components/ui/badge";
import { Building2, KeyRound, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { extractError } from "@/lib/services/apiService";
import { format } from "date-fns";
import NiceModal from "@ebay/nice-modal-react";
import { useUsersQuery, useDeleteUserMutation } from "@/lib/api/hooks/useUsers";
import type { ColumnDef } from "@/shared/ui/Table/type";
import { VendorModal } from "../components/vendor-modal";
import { ResetPasswordModal } from "../components/reset-password-modal";
import { toProfile } from "@/lib/types";
import type { Profile } from "@/lib/types";

const PAGE_SIZE = 10;

export function VendorsContainer() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  // Query vendors using react-query hook
  const { data, isLoading, isFetching } = useUsersQuery({
    search: debouncedSearch || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const deleteMutation = useDeleteUserMutation();

  type VendorRow = Profile & { companies: Array<{ id: string; name: string }> };

  const rawUsers = data?.users || [];
  const vendors: VendorRow[] = rawUsers.map((u: any) => {
    const p = toProfile(u);
    return {
      ...p,
      companies: p.assignedCompanies || [],
    };
  });

  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function openCreate() {
    NiceModal.show(VendorModal);
  }

  function openResetPassword(vendor: Profile) {
    NiceModal.show(ResetPasswordModal, { selectedVendor: vendor });
  }

  async function handleDelete(vendorId: string) {
    if (!confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) return;
    await deleteMutation.mutateAsync(vendorId, {
      onSuccess: () => {
        toast.success("Vendor deleted");
      },
      onError: (err) => {
        toast.error(extractError(err));
      },
    }).catch(() => {});
  }

  const loading = isLoading || isFetching;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">Vendors</h1>
          <p className="text-muted-foreground">Manage vendor accounts and company access</p>
        </div>
        <Button size="sm" onClick={openCreate} className="bg-primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table<VendorRow>
            columns={[
              {
                key: "name",
                header: "Name",
                render: (vendor) => <span className="font-medium">{vendor.name}</span>,
              },
              {
                key: "email",
                header: "Email",
                render: (vendor) => <span className="text-muted-foreground">{vendor.email}</span>,
              },
              {
                key: "companies",
                header: "Assigned Companies",
                render: (vendor) => (
                  <div className="flex flex-wrap gap-1">
                    {vendor.companies.length === 0 ? (
                      <span className="text-xs text-muted-foreground">None</span>
                    ) : (
                      vendor.companies.map((company: any) => (
                        <Badge key={company.id} variant="secondary" className="gap-1 text-xs">
                          <Building2 className="h-3 w-3" />
                          {company.name}
                        </Badge>
                      ))
                    )}
                  </div>
                ),
              },
              {
                key: "created_at",
                header: "Created",
                render: (vendor) => <span className="text-muted-foreground">{format(new Date(vendor.created_at), "MMM d, yyyy")}</span>,
              },
              {
                key: "actions",
                header: "Actions",
                align: "right",
                render: (vendor) => (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(vendor.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={vendors}
            keyExtractor={(vendor) => vendor.id}
            page={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={setPage}
            itemName="vendors"
            loading={loading}
            emptyMessage={search ? "No vendors match your search" : "No vendors yet. Create one to get started."}
          />
        </CardContent>
      </Card>
    </div>
  );
}
