"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import {
  createVendor,
  deleteVendor,
  getCompaniesPage,
  getVendorsPage,
  resetVendorPassword,
} from "@/lib/api/client";
import type { Company, Profile } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
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
  Building2,
  Check,
  ChevronsUpDown,
  KeyRound,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface VendorWithCompanies extends Profile {
  companies: Company[];
}

const PAGE_SIZE = 10;

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorWithCompanies[]>([]);
  const [companyOptions, setCompanyOptions] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Profile | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCompanyIds, setFormCompanyIds] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectedCompanies = useMemo(
    () => companyOptions.filter((company) => formCompanyIds.includes(company.id)),
    [companyOptions, formCompanyIds],
  );

  async function loadData(nextPage = page, nextSearch = search) {
    setLoading(true);
    try {
      const data = await getVendorsPage({
        search: nextSearch || undefined,
        page: nextPage,
        page_size: PAGE_SIZE,
      });
      setVendors(data.vendors);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load vendors");
    }
    setLoading(false);
  }

  async function loadCompanyOptions(nextSearch = companySearch) {
    try {
      const data = await getCompaniesPage({
        search: nextSearch || undefined,
        page: 1,
        page_size: 25,
      });
      setCompanyOptions((prev) => {
        const merged = [...prev, ...data.companies];
        return merged.filter((company, index, arr) => arr.findIndex((c) => c.id === company.id) === index);
      });
    } catch {
      toast.error("Failed to load companies");
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
    if (!createOpen) return;
    const timeout = window.setTimeout(() => loadCompanyOptions(companySearch), 200);
    return () => window.clearTimeout(timeout);
  }, [companySearch, createOpen]);

  function resetCreateForm() {
    setFormName("");
    setFormEmail("");
    setFormCompanyIds([]);
    setCompanySearch("");
  }

  function toggleCompany(company: Company) {
    setCompanyOptions((prev) =>
      prev.some((item) => item.id === company.id) ? prev : [...prev, company],
    );
    setFormCompanyIds((prev) =>
      prev.includes(company.id) ? prev.filter((id) => id !== company.id) : [...prev, company.id],
    );
  }

  async function handleCreate() {
    if (!formName || !formEmail) {
      toast.error("Name and email are required");
      return;
    }
    setSubmitting(true);
    try {
      await createVendor(formName, formEmail, formCompanyIds);
      toast.success("Vendor created and credentials emailed");
      setCreateOpen(false);
      resetCreateForm();
      await loadData(page, search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create vendor");
    }
    setSubmitting(false);
  }

  async function handleDelete(vendorId: string) {
    if (!confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) return;
    try {
      await deleteVendor(vendorId);
      toast.success("Vendor deleted");
      await loadData(page, search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete vendor");
    }
  }

  async function handleResetPassword() {
    if (!selectedVendor || !newPassword) {
      toast.error("New password is required");
      return;
    }
    setSubmitting(true);
    try {
      await resetVendorPassword(selectedVendor.id, newPassword);
      toast.success("Password reset and emailed");
      setResetOpen(false);
      setNewPassword("");
      setSelectedVendor(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    }
    setSubmitting(false);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-normal">Vendors</h1>
            <p className="text-muted-foreground">Manage vendor accounts and company access</p>
          </div>
          <Dialog open={createOpen} onOpenChange={(open) => {
            setCreateOpen(open);
            if (open) loadCompanyOptions("");
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary">
                <Plus className="mr-2 h-4 w-4" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Vendor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="vendor@company.com" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Assigned Companies</Label>
                  <Popover open={companyPickerOpen} onOpenChange={setCompanyPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        Search and select companies
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search companies..."
                          value={companySearch}
                          onValueChange={setCompanySearch}
                        />
                        <CommandList>
                          <CommandEmpty>No companies found.</CommandEmpty>
                          <CommandGroup>
                            {companyOptions.map((company) => {
                              const selected = formCompanyIds.includes(company.id);
                              return (
                                <CommandItem
                                  key={company.id}
                                  value={company.id}
                                  onSelect={() => toggleCompany(company)}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                                  <span className="truncate">{company.name}</span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedCompanies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedCompanies.map((company) => (
                        <Badge key={company.id} variant="secondary" className="gap-1">
                          {company.name}
                          <button type="button" onClick={() => toggleCompany(company)} aria-label={`Remove ${company.name}`}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Credentials will be emailed automatically to the vendor after creation.
                </p>
                <Button onClick={handleCreate} className="w-full bg-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Vendor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
            {loading ? (
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
                  {vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell className="text-muted-foreground">{vendor.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {vendor.companies.length === 0 ? (
                            <span className="text-xs text-muted-foreground">None</span>
                          ) : (
                            vendor.companies.map((company) => (
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
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setResetOpen(true);
                            }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(vendor.id)}
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
                Page {page} of {totalPages} · {total} vendors
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

        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password for {selectedVendor?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  type="password"
                />
              </div>
              <Button onClick={handleResetPassword} className="w-full bg-primary" disabled={submitting}>
                {submitting ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
