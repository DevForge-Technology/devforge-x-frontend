"use client";

import React, { useEffect, useState } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { extractError } from "@/lib/services/apiService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/shared/ui";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/shared/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { PlusCircle, X, Check, ChevronsUpDown } from "lucide-react";
import { useCreateReferralMutation, useUpdateReferralMutation } from "@/lib/api/hooks/useReferrals";
import { useCompaniesQuery } from "@/lib/api/hooks/useCompanies";
import { useAuth } from "@/lib/auth/auth-context";
import { toCompany } from "@/lib/types";
import type { Referral, Company } from "@/lib/types";

const referralSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  productInfo: Yup.string().required("Product info is required"),
  referenceLinks: Yup.array().of(
    Yup.string().test("is-url", "Must be a valid URL", (val) => !val || /^https?:\/\/.+/.test(val))
  ),
  hostName: Yup.string().nullable(),
  hostEmail: Yup.string()
    .nullable()
    .test(
      "is-valid-email",
      "Invalid host email address",
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ),
  companyId: Yup.string(),
});

interface ReferralModalProps {
  editingReferral?: Referral;
}

export const ReferralModal = NiceModal.create(({ editingReferral }: ReferralModalProps) => {
  const modal = useModal();
  const { profile } = useAuth();
  const isVendor = profile?.role === "vendor";

  const createMutation = useCreateReferralMutation();
  const updateMutation = useUpdateReferralMutation();

  const [companySearch, setCompanySearch] = useState("");
  const [companyOpen, setCompanyOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(
    editingReferral?.company_id
      ? {
          id: editingReferral.company_id,
          name: editingReferral.company_name || "",
          description: null,
          logo: null,
          accent_color: null,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      : null
  );

  const { data: companiesData } = useCompaniesQuery(
    !isVendor ? { search: companySearch || undefined, page: 1, page_size: 25 } : undefined,
    { enabled: !isVendor }
  );
  const rawCompanies = (companiesData?.companies || []).map(toCompany);
  const companies:Company[] = [...rawCompanies];
  if (selectedCompany && !companies.some((c) => c.id === selectedCompany.id)) {
    companies.push(selectedCompany);
  }

  const formik = useFormik({
    initialValues: {
      name: editingReferral?.name || "",
      email: editingReferral?.email || "",
      productInfo: editingReferral?.product_info || "",
      referenceLinks: editingReferral?.reference_links ? [...editingReferral.reference_links] : ([] as string[]),
      hostName: editingReferral?.host_name || "",
      hostEmail: editingReferral?.host_email || "",
      companyId: editingReferral?.company_id || (isVendor ? (profile?.last_used_company_id || profile?.assignedCompanies?.[0]?.id || "") : ""),
    },
    validationSchema: referralSchema,
    onSubmit: async (values) => {
      if (editingReferral) {
        await updateMutation.mutateAsync(
          {
            id: editingReferral.id,
            name: values.name,
            email: values.email,
            productInfo: values.productInfo,
            referenceLinks: values.referenceLinks,
            hostName: values.hostName || undefined,
            hostEmail: values.hostEmail || undefined,
          },
          {
            onSuccess: () => {
              toast.success("Referral updated");
              modal.resolve(true);
              modal.hide();
            },
            onError: (err) => {
              toast.error(extractError(err));
            },
          }
        ).catch(() => {});
      } else {
        await createMutation.mutateAsync(
          {
            name: values.name,
            email: values.email,
            productInfo: values.productInfo,
            referenceLinks: values.referenceLinks,
            hostName: values.hostName || undefined,
            hostEmail: values.hostEmail || undefined,
            companyId: values.companyId || undefined,
          },
          {
            onSuccess: () => {
              toast.success("Referral created");
              modal.resolve(true);
              modal.hide();
            },
            onError: (err) => {
              toast.error(extractError(err));
            },
          }
        ).catch(() => {});
      }
    },
  });

  function addLink() {
    formik.setFieldValue("referenceLinks", [...formik.values.referenceLinks, ""]);
  }

  function removeLink(index: number) {
    formik.setFieldValue(
      "referenceLinks",
      formik.values.referenceLinks.filter((_, i) => i !== index)
    );
  }

  function updateLink(index: number, value: string) {
    const updated = [...formik.values.referenceLinks];
    updated[index] = value;
    formik.setFieldValue("referenceLinks", updated);
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <DialogContent className="sm:max-w-lg" onCloseAutoFocus={() => modal.remove()}>
        <DialogHeader>
          <DialogTitle>{editingReferral ? "Edit Referral" : "New Referral"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Referral name"
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
                placeholder="Email"
                type="email"
              />
              {formik.touched.email && formik.errors.email ? (
                <div className="text-xs text-destructive">{formik.errors.email}</div>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="productInfo">Product Info</Label>
            <Textarea
              id="productInfo"
              name="productInfo"
              value={formik.values.productInfo}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Product details"
            />
            {formik.touched.productInfo && formik.errors.productInfo ? (
              <div className="text-xs text-destructive">{formik.errors.productInfo}</div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Reference Links</Label>
            <div className="space-y-2">
              {formik.values.referenceLinks.map((link, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex gap-2">
                    <Input
                      value={link}
                      onChange={(e) => updateLink(i, e.target.value)}
                      placeholder="https://..."
                    />
                    <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeLink(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {formik.errors.referenceLinks && formik.errors.referenceLinks[i] ? (
                    <div className="text-xs text-destructive">
                      {Array.isArray(formik.errors.referenceLinks) ? formik.errors.referenceLinks[i] : formik.errors.referenceLinks}
                    </div>
                  ) : null}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addLink} className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Add Link
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hostName">Host Name</Label>
              <Input
                id="hostName"
                name="hostName"
                value={formik.values.hostName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Host name"
              />
              {formik.touched.hostName && formik.errors.hostName ? (
                <div className="text-xs text-destructive">{formik.errors.hostName}</div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostEmail">Host Email</Label>
              <Input
                id="hostEmail"
                name="hostEmail"
                value={formik.values.hostEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Host email"
              />
              {formik.touched.hostEmail && formik.errors.hostEmail ? (
                <div className="text-xs text-destructive">{formik.errors.hostEmail}</div>
              ) : null}
            </div>
          </div>
          {!editingReferral && !isVendor && (
            <div className="space-y-2 flex flex-col">
              <Label htmlFor="companyId">Company</Label>
              <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal text-sm border-slate-200">
                    <span className="truncate">
                      {formik.values.companyId && selectedCompany
                        ? selectedCompany.name
                        : "Select company"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search company..."
                      value={companySearch}
                      onValueChange={setCompanySearch}
                    />
                    <CommandList>
                      <CommandEmpty>No companies found.</CommandEmpty>
                      <CommandGroup>
                        {companies.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.id}
                            onSelect={() => {
                              formik.setFieldValue("companyId", c.id);
                              setSelectedCompany(c);
                              setCompanyOpen(false);
                            }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${formik.values.companyId === c.id ? "opacity-100" : "opacity-0"}`} />
                            <span className="truncate">{c.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {formik.touched.companyId && formik.errors.companyId ? (
                <div className="text-xs text-destructive mt-1">{formik.errors.companyId}</div>
              ) : null}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingReferral ? "Update Referral" : "Create Referral"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
});
ReferralModal.displayName = "ReferralModal";
