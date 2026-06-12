"use client";

import React, { useState, useMemo } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { extractError } from "@/lib/services/apiService";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import type { Profile } from "@/lib/types";
import { useCreateUserMutation, useUpdateUserMutation } from "@/lib/api/hooks/useUsers";
import { useCompaniesQuery } from "@/lib/api/hooks/useCompanies";
import { toCompany } from "@/lib/types";
import type { Company } from "@/lib/types";

interface VendorModalProps{
  editingVendor?: Profile;
}

 type VendorFormValues={
  name: string;
  email: string;
  companyIds: string[];
 }
 
 const createVendorSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  companyIds: Yup.array().of(Yup.string().required()).min(1, "At least one company must be selected"),
});

export const VendorModal = NiceModal.create(({ editingVendor }: VendorModalProps) => {
  const modal = useModal();
  const [companySearch, setCompanySearch] = useState("");
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);

  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();

  // Query companies for assignment
  const { data: companiesData } = useCompaniesQuery({
    search: companySearch || undefined,
    page: 1,
    page_size: 25,
  });
  const companyOptions = (companiesData?.companies || []).map(toCompany);

  const formik = useFormik<VendorFormValues>({
      enableReinitialize: true,
      initialValues: {
        name: editingVendor?.name || "",
        email: editingVendor?.email || "",
        companyIds: editingVendor?.assignedCompanies?.map(el => el.id) || [],
      },
      validationSchema: createVendorSchema,
      onSubmit: async (values) => {
        if (editingVendor) {
          await updateMutation.mutateAsync(
              {
                id: editingVendor.id,
                name: values.name,
              },
              {
                onSuccess: () => {
                  toast.success("Vendor updated");
                  modal.resolve(true);
                  modal.hide();
                },
                onError: (err) => {
                  toast.error(extractError(err));
                },
              }
            )
            .catch(() => {});
        } else {
      await createMutation.mutateAsync(
        {
          name: values.name,
          email: values.email,
          companyIds: values.companyIds,
        },
        {
          onSuccess: () => {
            toast.success("Vendor created and credentials emailed");
            modal.resolve(true);
            modal.hide();
          },
          onError: (err) => {
            toast.error(extractError(err));
          },
        }
      )
      .catch(() => {});
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
      <Dialog open={modal.visible} onOpenChange={() => modal.hide()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? "Edit Vendor" : "Create Vendor"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input {...formik.getFieldProps("name")} />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                {...formik.getFieldProps("email")}
                disabled={!!editingVendor}
              />
            </div>

            <div>
              <Label>Companies</Label>
              <Popover open={companyPickerOpen} onOpenChange={setCompanyPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Select companies
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      value={companySearch}
                      onValueChange={setCompanySearch}
                      placeholder="Search..."
                    />
                    <CommandList>
                      <CommandEmpty>No companies found</CommandEmpty>
                      <CommandGroup>
                        {companyOptions.map((company) => (
                          <CommandItem
                            key={company.id}
                            onSelect={() => toggleCompany(company)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formik.values.companyIds.includes(company.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {company.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCompanies.map((company) => (
                  <Badge key={company.id}>
                    {company.name}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => toggleCompany(company)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full bg-primary" disabled={isSubmitting}>
                {editingVendor ? "Update Vendor" : "Create Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);

VendorModal.displayName = "VendorModal";
