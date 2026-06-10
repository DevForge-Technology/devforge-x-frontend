"use client";

import React, { useState, useMemo } from "react";
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
import { useCreateUserMutation } from "@/lib/api/hooks/useUsers";
import { useCompaniesQuery } from "@/lib/api/hooks/useCompanies";
import { toCompany } from "@/lib/types";
import type { Company } from "@/lib/types";

const createVendorSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  companyIds: Yup.array().of(Yup.string().required()),
});

export const VendorModal = NiceModal.create(() => {
  const modal = useModal();
  const [companySearch, setCompanySearch] = useState("");
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);

  const createMutation = useCreateUserMutation();

  // Query companies for assignment
  const { data: companiesData } = useCompaniesQuery({
    search: companySearch || undefined,
    page: 1,
    page_size: 25,
  });
  const companyOptions = (companiesData?.companies || []).map(toCompany);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      companyIds: [] as string[],
    },
    validationSchema: createVendorSchema,
    onSubmit: async (values) => {
      try {
        await createMutation.mutateAsync({
          name: values.name,
          email: values.email,
          companyIds: values.companyIds,
        });
        toast.success("Vendor created and credentials emailed");
        modal.resolve(true);
        modal.hide();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create vendor");
      }
    },
  });

  const selectedCompanies = useMemo(
    () => companyOptions.filter((company: Company) => formik.values.companyIds.includes(company.id)),
    [companyOptions, formik.values.companyIds],
  );

  function toggleCompany(company: Company) {
    const prevIds = formik.values.companyIds;
    const nextIds = prevIds.includes(company.id)
      ? prevIds.filter((id) => id !== company.id)
      : [...prevIds, company.id];
    formik.setFieldValue("companyIds", nextIds);
  }

  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Vendor</DialogTitle>
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
              placeholder="Full name"
            />
            {formik.touched.name && formik.errors.name ? (
              <div className="text-xs text-destructive">{formik.errors.name}</div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="vendor@company.com"
              type="email"
            />
            {formik.touched.email && formik.errors.email ? (
              <div className="text-xs text-destructive">{formik.errors.email}</div>
            ) : null}
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
                      {companyOptions.map((company: Company) => {
                        const selected = formik.values.companyIds.includes(company.id);
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
                {selectedCompanies.map((company: Company) => (
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
          <Button type="submit" className="w-full bg-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Vendor"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
});
VendorModal.displayName = "VendorModal";
