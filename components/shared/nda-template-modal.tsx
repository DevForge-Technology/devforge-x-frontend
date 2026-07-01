"use client";

import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button, Input } from "@/shared/ui";
import dynamic from "next/dynamic";
import { Mail, Loader2 } from "lucide-react";
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useFormik } from 'formik';

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
});

interface NdaTemplateModalProps {
  initialEmail: string;
  companyName: string;
  vendorName: string;
  onConfirm: (payload: {
    email: string;
    message: string;
  }) => void;
  isPending: boolean;
}

export const NdaTemplateModal = NiceModal.create<NdaTemplateModalProps>(({
  initialEmail,
  onConfirm,
  isPending
}) => {
  const modal = useModal();

  const formik = useFormik({
    initialValues: {
      email: initialEmail || "",
      message: "",
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      if (!values.email) return;

      const cleanTextCheck = values.message.replace(/<(.|\n)*?>/g, "").trim();
      const cleanMessage = cleanTextCheck === "" ? "" : values.message;

      onConfirm({
        email: values.email,
        message: cleanMessage,
      });

      formik.resetForm();
      modal.hide();
    },
  });

  useEffect(() => {
    if (!modal.visible) {
      formik.resetForm();
    }
  }, [modal.visible]);

  return (
    <Dialog open={modal.visible} onOpenChange={() => modal.hide()}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" /> Dispatch NDA Agreement
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-5 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recipient Email Address</label>
            <Input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              placeholder="vendor@company.com"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Email Message
            </label>
            <ReactQuill
              theme="snow"
              value={formik.values.message}
              onChange={(value) => formik.setFieldValue("message", value)}
              placeholder="Type your NDA email..."
              style={{
                height: "280px",
                marginBottom: "60px",
              }}
            />
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => modal.hide()} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 text-white hover:bg-blue-700 font-medium min-w-[145px]">
              <div className="relative w-full h-full flex items-center justify-center">
                <span className="absolute flex items-center justify-center" style={{ visibility: isPending ? 'visible' : 'hidden' }}><Loader2 className="h-4 w-4 animate-spin" /></span>
                <span style={{ visibility: isPending ? 'hidden' : 'visible' }}>Confirm & Send</span>
              </div>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});