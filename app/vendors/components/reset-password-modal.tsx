"use client";

import React from "react";
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
import { useResetPasswordMutation } from "@/lib/api/hooks/useUsers";
import type { Profile } from "@/lib/types";

const resetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("New password is required"),
});

interface ResetPasswordModalProps {
  selectedVendor: Profile;
}

export const ResetPasswordModal = NiceModal.create(({ selectedVendor }: ResetPasswordModalProps) => {
  const modal = useModal();
  const resetMutation = useResetPasswordMutation();

  const formik = useFormik({
    initialValues: {
      newPassword: "",
    },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values) => {
      try {
        await resetMutation.mutateAsync({
          id: selectedVendor.id,
          new_password: values.newPassword,
        });
        toast.success("Password reset and emailed");
        modal.resolve(true);
        modal.hide();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to reset password");
      }
    },
  });

  const isSubmitting = resetMutation.isPending;

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password for {selectedVendor.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter new password"
              type="password"
            />
            {formik.touched.newPassword && formik.errors.newPassword ? (
              <div className="text-xs text-destructive">{formik.errors.newPassword}</div>
            ) : null}
          </div>
          <Button type="submit" className="w-full bg-primary" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
});
ResetPasswordModal.displayName = "ResetPasswordModal";
