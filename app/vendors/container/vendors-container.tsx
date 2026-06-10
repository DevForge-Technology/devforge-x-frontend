"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, KeyRound, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import NiceModal from "@ebay/nice-modal-react";
import { useUsersQuery, useDeleteUserMutation } from "@/lib/api/hooks/useUsers";
import { VendorModal } from "../components/vendor-modal";
import { ResetPasswordModal } from "../components/reset-password-modal";
import { CommonPagination } from "@/components/shared/common-pagination";
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

  const rawUsers = data?.users || [];
  const vendors = rawUsers.map((u: any) => {
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
    try {
      await deleteMutation.mutateAsync(vendorId);
      toast.success("Vendor deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete vendor");
    }
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
          {loading && vendors.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading vendors...</p>
          ) : vendors.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {search ? "No vendors match your search" : "No vendors yet. Create one to get started."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Companies</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor: any) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell className="text-muted-foreground">{vendor.email}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(vendor.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <CommonPagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            loading={loading}
            onPageChange={setPage}
            itemName="vendors"
          />
        </CardContent>
      </Card>
    </div>
  );
}
