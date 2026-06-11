"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, Input, Table } from "@/shared/ui";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import NiceModal from "@ebay/nice-modal-react";
import {
  useCompaniesQuery,
  useDeleteCompanyMutation,
} from "@/lib/api/hooks/useCompanies";
import { CompanyModal } from "../components/company-modal";
import { toCompany } from "@/lib/types";
import type { Company } from "@/lib/types";
import type { ColumnDef } from "@/shared/ui/Table/type";
import { ConfirmationDeleteModal } from "@/components/shared/confirmation-delete-modal";

type CompanyRow = Company & { vendor_count: number };

const PAGE_SIZE = 10;

export function CompaniesContainer() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  // React Query hook
  const { data, isLoading, isFetching } = useCompaniesQuery({
    search: debouncedSearch || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const deleteMutation = useDeleteCompanyMutation();

  const companies: CompanyRow[] = (data?.companies || []).map((c: any) => ({
    ...toCompany(c),
    vendor_count: c.vendorCount || 0,
  }));
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function openCreate() {
    NiceModal.show(CompanyModal);
  }

  function openEdit(company: Company) {
    NiceModal.show(CompanyModal, { editingCompany: company });
  }

  async function handleDelete(id: string) {
    NiceModal.show(ConfirmationDeleteModal, {
      title: "Confirm Delete ?",
      description:
        "Are you sure want to delete this company? All vendor assigned will be removed.",
      mutation: deleteMutation,
      payload: id,
      successMessage: "Company deleted",
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(id);
          toast.success("Company deleted");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to delete");
        }
      },
    });
  }
  const loading = isLoading || isFetching;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">Companies</h1>
          <p className="text-muted-foreground">
            Manage companies and vendor assignments
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="bg-primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table<CompanyRow>
            columns={[
              {
                key: "name",
                header: "Name",
                render: (company) => (
                  <div className="flex items-center gap-2">
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt=""
                        className="h-6 w-6 rounded"
                      />
                    ) : (
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded text-xs font-medium text-white"
                        style={{
                          backgroundColor: company.accent_color || "#0B5DF4",
                        }}
                      >
                        {company.name.charAt(0)}
                      </div>
                    )}
                    {company.name}
                  </div>
                ),
                className: "font-medium",
              },
              {
                key: "status",
                header: "Status",
                render: (company) => (
                  <Badge
                    variant={
                      company.status === "active" ? "default" : "secondary"
                    }
                  >
                    {company.status}
                  </Badge>
                ),
              },
              {
                key: "vendor_count",
                header: "Vendors",
                render: (company) => (
                  <span className="flex items-center gap-1 text-sm">
                    <Users className="h-3 w-3" />
                    {company.vendor_count}
                  </span>
                ),
              },
              {
                key: "created_at",
                header: "Created",
                render: (company) =>
                  format(new Date(company.created_at), "MMM d, yyyy"),
                className: "text-muted-foreground",
              },
              {
                key: "actions",
                header: "Actions",
                align: "right",
                render: (company) => (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(company)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(company.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={companies}
            keyExtractor={(company) => company.id}
            page={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={setPage}
            itemName="companies"
            loading={loading}
            emptyMessage={
              search
                ? "No companies match your search"
                : "No companies yet. Create one to get started."
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
