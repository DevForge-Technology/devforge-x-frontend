"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { AppShell } from "@/components/shared/app-shell";
import { getReferrals, createReferral, updateReferral, deleteReferral, getCompanies, getVendors } from "@/lib/api/client";
import type { Referral, Company, Profile } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Search, Trash2, Pencil, Link as LinkIcon, X, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ReferralsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [vendors, setVendors] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>("");
  const [filterVendor, setFilterVendor] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formProductInfo, setFormProductInfo] = useState("");
  const [formReferenceLinks, setFormReferenceLinks] = useState<string[]>([]);
  const [formHostName, setFormHostName] = useState("");
  const [formHostEmail, setFormHostEmail] = useState("");
  const [formCompanyId, setFormCompanyId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReferrals = useCallback(async () => {
    try {
      const params: Record<string, string> = { page: "1", page_size: "100" };
      if (search) params.search = search;
      if (filterCompany) params.company_id = filterCompany;
      if (filterVendor) params.vendor_id = filterVendor;
      const data = await getReferrals(params);
      setReferrals(data.referrals || []);
    } catch {
      toast.error("Failed to load referrals");
    }
    setLoading(false);
  }, [search, filterCompany, filterVendor]);

  async function loadFilters() {
    if (isAdmin) {
      try {
        const [comps, vends] = await Promise.all([getCompanies(), getVendors()]);
        setCompanies(comps);
        setVendors(vends);
      } catch {
        // silent
      }
    }
  }

  useEffect(() => {
    loadReferrals();
    loadFilters();
  }, [loadReferrals]);

  function openCreate() {
    setEditingReferral(null);
    setFormName("");
    setFormEmail("");
    setFormProductInfo("");
    setFormReferenceLinks([]);
    setFormHostName("");
    setFormHostEmail("");
    setFormCompanyId("");
    setDialogOpen(true);
  }

  function openEdit(referral: Referral) {
    setEditingReferral(referral);
    setFormName(referral.name);
    setFormEmail(referral.email);
    setFormProductInfo(referral.product_info);
    setFormReferenceLinks([...referral.reference_links]);
    setFormHostName(referral.host_name || "");
    setFormHostEmail(referral.host_email || "");
    setFormCompanyId(referral.company_id);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formName || !formEmail || !formProductInfo) {
      toast.error("Name, email, and product info are required");
      return;
    }
    setSubmitting(true);
    try {
      if (editingReferral) {
        await updateReferral(editingReferral.id, {
          name: formName,
          email: formEmail,
          product_info: formProductInfo,
          reference_links: formReferenceLinks,
          host_name: formHostName,
          host_email: formHostEmail,
        });
        toast.success("Referral updated");
      } else {
        await createReferral({
          name: formName,
          email: formEmail,
          product_info: formProductInfo,
          reference_links: formReferenceLinks,
          host_name: formHostName,
          host_email: formHostEmail,
          company_id: formCompanyId || undefined,
        });
        toast.success("Referral created");
      }
      setDialogOpen(false);
      await loadReferrals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this referral?")) return;
    try {
      await deleteReferral(id);
      toast.success("Referral deleted");
      await loadReferrals();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  function addLink() {
    setFormReferenceLinks([...formReferenceLinks, ""]);
  }

  function removeLink(index: number) {
    setFormReferenceLinks(formReferenceLinks.filter((_, i) => i !== index));
  }

  function updateLink(index: number, value: string) {
    const updated = [...formReferenceLinks];
    updated[index] = value;
    setFormReferenceLinks(updated);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded-xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
            <p className="text-muted-foreground">
              {isAdmin ? "All referrals across the platform" : "Your referrals for the active workspace"}
            </p>
          </div>
          {!isAdmin && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Referral
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Referral
            </Button>
          )}
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
                      {companies.map((c) => (
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
                      {vendors.map((v) => (
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
            {referrals.length === 0 ? (
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
                    {referrals.map((ref) => (
                      <TableRow key={ref.id}>
                        <TableCell className="font-medium">{ref.name}</TableCell>
                        <TableCell className="text-muted-foreground">{ref.email}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{ref.product_info}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {ref.reference_links.slice(0, 2).map((link, i) => (
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
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingReferral ? "Edit Referral" : "New Referral"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Referral name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email" type="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Product Info</Label>
                <Textarea value={formProductInfo} onChange={(e) => setFormProductInfo(e.target.value)} placeholder="Product details" />
              </div>
              <div className="space-y-2">
                <Label>Reference Links</Label>
                <div className="space-y-2">
                  {formReferenceLinks.map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={link}
                        onChange={(e) => updateLink(i, e.target.value)}
                        placeholder="https://..."
                      />
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeLink(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addLink} className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Add Link
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Host Name</Label>
                  <Input value={formHostName} onChange={(e) => setFormHostName(e.target.value)} placeholder="Host name" />
                </div>
                <div className="space-y-2">
                  <Label>Host Email</Label>
                  <Input value={formHostEmail} onChange={(e) => setFormHostEmail(e.target.value)} placeholder="Host email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Select value={formCompanyId} onValueChange={setFormCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
                {submitting ? "Saving..." : editingReferral ? "Update Referral" : "Create Referral"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
