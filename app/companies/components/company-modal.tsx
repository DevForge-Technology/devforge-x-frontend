"use client";

import React, { useEffect, useState, useMemo } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateCompanyMutation, useUpdateCompanyMutation } from "@/lib/api/hooks/useCompanies";
import { useUsersQuery } from "@/lib/api/hooks/useUsers";
import { getCompanyVendors } from "@/lib/api/client";
import type { Company, Profile } from "@/lib/types";

const companySchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  description: Yup.string(),
  logo: Yup.string().test("is-url", "Must be a valid URL", (value) => !value || /^https?:\/\/.+/.test(value)),
  accentColor: Yup.string().test("is-hex", "Must be a valid hex color code (e.g. #0B5DF4)", (value) => !value || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)),
  vendorId: Yup.string().nullable(),
});

interface CompanyModalProps {
  editingCompany?: Company;
}

export const CompanyModal = NiceModal.create(({ editingCompany }: CompanyModalProps) => {
  const modal = useModal();
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorPickerOpen, setVendorPickerOpen] = useState(false);
  const [assignedVendors, setAssignedVendors] = useState<Profile[]>([]);

  const createMutation = useCreateCompanyMutation();
  const updateMutation = useUpdateCompanyMutation();

  const { data: usersData } = useUsersQuery({
    search: vendorSearch || undefined,
    page: 1,
    page_size: 25,
  });

  const vendorOptions = useMemo(() => {
    const fetched = (usersData?.users || []) as Profile[];
    const merged = [...assignedVendors, ...fetched];
    return merged.filter((vendor, index, arr) => arr.findIndex((v) => v.id === vendor.id) === index);
  }, [usersData, assignedVendors]);

  const formik = useFormik({
    initialValues: {
      name: editingCompany?.name || "",
      description: editingCompany?.description || "",
      logo: editingCompany?.logo || "",
      accentColor: editingCompany?.accent_color || "",
      status: (editingCompany?.status || "active") as "active" | "inactive",
      vendorId: "",
    },
    validationSchema: companySchema,
    onSubmit: async (values) => {
      try {
        if (editingCompany) {
          await updateMutation.mutateAsync({
            id: editingCompany.id,
            name: values.name,
            description: values.description,
            logo: values.logo,
            accentColor: values.accentColor,
            status: "active",
            vendorId: values.vendorId || undefined,
          });
          toast.success("Company updated");
        } else {
          await createMutation.mutateAsync({
            name: values.name,
            description: values.description,
            logo: values.logo,
            accentColor: values.accentColor,
            status: values.status,
            vendorId: values.vendorId || undefined,
          });
          toast.success("Company created");
        }
        modal.resolve(true);
        modal.hide();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Operation failed");
      }
    },
  });

  useEffect(() => {
    if (editingCompany) {
      getCompanyVendors(editingCompany.id)
        .then((vendors) => {
          setAssignedVendors(vendors);
          if (vendors.length > 0) {
            formik.setFieldValue("vendorId", vendors[0].id);
          }
        })
        .catch(() => {
          toast.error("Failed to load assigned vendors");
        });
    }
  }, [editingCompany]);

  const selectedVendors = useMemo(() => {
    return vendorOptions.filter((vendor) => vendor.id === formik.values.vendorId);
  }, [vendorOptions, formik.values.vendorId]);

  function toggleVendor(vendor: Profile) {
    const prevId = formik.values.vendorId;
    const nextId = prevId === vendor.id ? "" : vendor.id;
    formik.setFieldValue("vendorId", nextId);
    setVendorPickerOpen(false);
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingCompany ? "Edit Company" : "Create Company"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Company name"
            />
            {formik.touched.name && formik.errors.name ? (
              <div className="text-xs text-destructive">{formik.errors.name}</div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Brief description"
            />
            {formik.touched.description && formik.errors.description ? (
              <div className="text-xs text-destructive">{formik.errors.description}</div>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                name="logo"
                value={formik.values.logo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="https://..."
              />
              {formik.touched.logo && formik.errors.logo ? (
                <div className="text-xs text-destructive">{formik.errors.logo}</div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  name="accentColor"
                  value={formik.values.accentColor}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="#0B5DF4"
                />
                {formik.values.accentColor && !formik.errors.accentColor && (
                  <div className="h-9 w-9 shrink-0 rounded-md border" style={{ backgroundColor: formik.values.accentColor }} />
                )}
              </div>
              {formik.touched.accentColor && formik.errors.accentColor ? (
                <div className="text-xs text-destructive">{formik.errors.accentColor}</div>
              ) : null}
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
                        const selected = formik.values.vendorId === vendor.id;
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
          <Button type="submit" className="w-full bg-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingCompany ? "Update Company" : "Create Company"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
});
CompanyModal.displayName = "CompanyModal";
