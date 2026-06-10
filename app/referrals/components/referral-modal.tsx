"use client";

import React, { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, X } from "lucide-react";
import { useCreateReferralMutation, useUpdateReferralMutation } from "@/lib/api/hooks/useReferrals";
import { useCompaniesQuery } from "@/lib/api/hooks/useCompanies";
import type { Referral, Company } from "@/lib/types";

const referralSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  productInfo: Yup.string().required("Product info is required"),
  referenceLinks: Yup.array().of(
    Yup.string().test("is-url", "Must be a valid URL", (val) => !val || /^https?:\/\/.+/.test(val))
  ),
  hostName: Yup.string(),
  hostEmail: Yup.string().email("Invalid host email address").nullable(),
  companyId: Yup.string(),
});

interface ReferralModalProps {
  editingReferral?: Referral;
}

export const ReferralModal = NiceModal.create(({ editingReferral }: ReferralModalProps) => {
  const modal = useModal();

  const createMutation = useCreateReferralMutation();
  const updateMutation = useUpdateReferralMutation();

  const { data: companiesData } = useCompaniesQuery({
    page: 1,
    page_size: 100,
  });
  const companies = (companiesData?.companies || []);

  const formik = useFormik({
    initialValues: {
      name: editingReferral?.name || "",
      email: editingReferral?.email || "",
      productInfo: editingReferral?.product_info || "",
      referenceLinks: editingReferral?.reference_links ? [...editingReferral.reference_links] : ([] as string[]),
      hostName: editingReferral?.host_name || "",
      hostEmail: editingReferral?.host_email || "",
      companyId: editingReferral?.company_id || "",
    },
    validationSchema: referralSchema,
    onSubmit: async (values) => {
      try {
        if (editingReferral) {
          await updateMutation.mutateAsync({
            id: editingReferral.id,
            name: values.name,
            email: values.email,
            productInfo: values.productInfo,
            referenceLinks: values.referenceLinks,
            hostName: values.hostName,
            hostEmail: values.hostEmail,
          });
          toast.success("Referral updated");
        } else {
          await createMutation.mutateAsync({
            name: values.name,
            email: values.email,
            productInfo: values.productInfo,
            referenceLinks: values.referenceLinks,
            hostName: values.hostName,
            hostEmail: values.hostEmail,
            companyId: values.companyId || undefined,
          });
          toast.success("Referral created");
        }
        modal.resolve(true);
        modal.hide();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Operation failed");
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
      <DialogContent className="sm:max-w-lg">
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
          {!editingReferral && (
            <div className="space-y-2">
              <Label htmlFor="companyId">Company</Label>
              <Select
                value={formik.values.companyId}
                onValueChange={(val) => formik.setFieldValue("companyId", val)}
              >
                <SelectTrigger id="companyId">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formik.touched.companyId && formik.errors.companyId ? (
                <div className="text-xs text-destructive">{formik.errors.companyId}</div>
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
