"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, Input, Table } from "@/shared/ui";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Search, Trash2, Users, FileText, MoreVertical } from "lucide-react"; // <-- Changed to MoreVertical
import { toast } from "sonner";
import { format } from "date-fns";
import { useGenerateNdaMutation, useSendNdaMutation } from "@/lib/api/hooks/useCompanies";
import { extractError } from "@/lib/services/apiService";
import NiceModal from "@ebay/nice-modal-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const router = useRouter();

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

  const generateNdaMutation = useGenerateNdaMutation();
  const sendNdaMutation = useSendNdaMutation();


    async function handleGenerateNDA(company: Company) {
    const toastId = toast.loading(`Generating and emailing NDA for ${company.name}...`);

    generateNdaMutation.mutate({
      companyId: company.id,
      customEmail: (company as any).vendor?.email || "", 
      templateId: "standard_formal"                     
    }, {
      onSuccess: (fileBlob) => {
        const downloadUrl = window.URL.createObjectURL(fileBlob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", `NDA_${company.name.replace(/\s+/g, "_")}.pdf`);

        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        toast.success("NDA downloaded and vendor copy emailed!", { id: toastId });
      },
      onError: (err) => {
        console.error("NDA Generation Error:", err);
        toast.error("Could not generate NDA. Please check developer server logs.", { id: toastId });
      },
    });
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
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm pl-4"
              startIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            />
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
                    <button
        type="button"
        onClick={() => router.push(`/companies/${company.id}`)}
        className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-all text-left focus:outline-none"
      >
                    {company.name}
                    </button>
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
                key: "vendor_name",
                header: "Vendor",
                render: (company) => (
                  company.vendor?.name ?
                  <span className="flex items-center gap-1 text-sm">
                    <Users className="h-3 w-3" />
                    {company.vendor?.name }
                  </span> :
                  <span>N/A</span>
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
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEdit(company)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Edit Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(company.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete Company</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
