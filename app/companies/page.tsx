"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import {
  createCompany,
  deleteCompany,
  getCompaniesPage,
  getCompanyVendors,
  getVendorsPage,
  updateCompany,
} from "@/lib/api/client";
import type { Company, Profile } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  ChevronsUpDown,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<(Company & { vendor_count: number })[]>([]);
  const [vendorOptions, setVendorOptions] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vendorPickerOpen, setVendorPickerOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLogo, setFormLogo] = useState("");
  const [formAccentColor, setFormAccentColor] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");
  const [formVendorIds, setFormVendorIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectedVendors = useMemo(
    () => vendorOptions.filter((vendor) => formVendorIds.includes(vendor.id)),
    [vendorOptions, formVendorIds],
  );

  async function loadData(nextPage = page, nextSearch = search) {
    setLoading(true);
    try {
      const data = await getCompaniesPage({
        search: nextSearch || undefined,
        page: nextPage,
        page_size: PAGE_SIZE,
      });
      setCompanies(data.companies);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load companies");
    }
    setLoading(false);
  }

  async function loadVendorOptions(nextSearch = vendorSearch) {
    try {
      const data = await getVendorsPage({
        search: nextSearch || undefined,
        page: 1,
        page_size: 25,
      });
      setVendorOptions((prev) => {
        const merged = [...prev, ...data.vendors];
        return merged.filter((vendor, index, arr) => arr.findIndex((v) => v.id === vendor.id) === index);
      });
    } catch {
      toast.error("Failed to load vendors");
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      loadData(1, search);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    loadData(page, search);
  }, [page]);

  useEffect(() => {
    if (!dialogOpen) return;
    const timeout = window.setTimeout(() => loadVendorOptions(vendorSearch), 200);
    return () => window.clearTimeout(timeout);
  }, [vendorSearch, dialogOpen]);

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormLogo("");
    setFormAccentColor("");
    setFormStatus("active");
    setFormVendorIds([]);
    setVendorSearch("");
  }

  function openCreate() {
    setEditingCompany(null);
    resetForm();
    setDialogOpen(true);
    loadVendorOptions("");
  }

  async function openEdit(company: Company) {
    setEditingCompany(company);
    setFormName(company.name);
    setFormDescription(company.description || "");
    setFormLogo(company.logo || "");
    setFormAccentColor(company.accent_color || "");
    setFormStatus(company.status);
    setDialogOpen(true);
    try {
      const assignedVendors = await getCompanyVendors(company.id);
      setVendorOptions((prev) => {
        const merged = [...prev, ...assignedVendors];
        return merged.filter((vendor, index, arr) => arr.findIndex((v) => v.id === vendor.id) === index);
      });
      setFormVendorIds(assignedVendors.map((vendor) => vendor.id));
    } catch {
      setFormVendorIds([]);
      toast.error("Failed to load assigned vendors");
    }
    loadVendorOptions("");
  }

  function toggleVendor(vendor: Profile) {
    setVendorOptions((prev) =>
      prev.some((item) => item.id === vendor.id) ? prev : [...prev, vendor],
    );
    setFormVendorIds((prev) =>
      prev.includes(vendor.id) ? prev.filter((id) => id !== vendor.id) : [...prev, vendor.id],
    );
  }

  async function handleSubmit() {
    if (!formName) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, {
          name: formName,
          description: formDescription,
          logo: formLogo,
          accent_color: formAccentColor,
          status: formStatus,
          vendor_ids: formVendorIds,
        });
        toast.success("Company updated");
      } else {
        await createCompany({
          name: formName,
          description: formDescription,
          logo: formLogo,
          accent_color: formAccentColor,
          status: formStatus,
          vendor_ids: formVendorIds,
        });
        toast.success("Company created");
      }
      setDialogOpen(false);
      await loadData(page, search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this company? All vendor assignments will be removed.")) return;
    try {
      await deleteCompany(id);
      toast.success("Company deleted");
      await loadData(page, search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-normal">Companies</h1>
            <p className="text-muted-foreground">Manage companies and vendor assignments</p>
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
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading companies...</p>
            ) : companies.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {search ? "No companies match your search" : "No companies yet. Create one to get started."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vendors</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {company.logo ? (
                            <img src={company.logo} alt="" className="h-6 w-6 rounded" />
                          ) : (
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded text-xs font-medium text-white"
                              style={{ backgroundColor: company.accent_color || "#0B5DF4" }}
                            >
                              {company.name.charAt(0)}
                            </div>
                          )}
                          {company.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.status === "active" ? "default" : "secondary"}>
                          {company.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3" />
                          {company.vendor_count}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(company.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(company)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(company.id)}
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
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {total} companies
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCompany ? "Edit Company" : "Create Company"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Company name" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input value={formLogo} onChange={(e) => setFormLogo(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <Input value={formAccentColor} onChange={(e) => setFormAccentColor(e.target.value)} placeholder="#0B5DF4" />
                    {formAccentColor && (
                      <div className="h-9 w-9 shrink-0 rounded-md border" style={{ backgroundColor: formAccentColor }} />
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formStatus === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormStatus("active")}
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    variant={formStatus === "inactive" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormStatus("inactive")}
                  >
                    Inactive
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign Vendors</Label>
                <Popover open={vendorPickerOpen} onOpenChange={setVendorPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      Search and select vendors
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search vendors..."
                        value={vendorSearch}
                        onValueChange={setVendorSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No vendors found.</CommandEmpty>
                        <CommandGroup>
                          {vendorOptions.map((vendor) => {
                            const selected = formVendorIds.includes(vendor.id);
                            return (
                              <CommandItem
                                key={vendor.id}
                                value={vendor.id}
                                onSelect={() => toggleVendor(vendor)}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                                <span className="truncate">{vendor.name}</span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedVendors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedVendors.map((vendor) => (
                      <Badge key={vendor.id} variant="secondary" className="gap-1">
                        {vendor.name}
                        <button type="button" onClick={() => toggleVendor(vendor)} aria-label={`Remove ${vendor.name}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={handleSubmit} className="w-full bg-primary" disabled={submitting}>
                {submitting ? "Saving..." : editingCompany ? "Update Company" : "Create Company"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
