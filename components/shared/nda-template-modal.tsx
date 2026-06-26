"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button, Input } from "@/shared/ui";
import dynamic from "next/dynamic";
import { Mail } from "lucide-react";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
});

interface NdaTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail: string;
  companyName: string;
  vendorName: string;
  onConfirm: (payload: {
    email: string;
    message: string;
  }) => void;
  isPending: boolean;
}

export function NdaTemplateModal({
  isOpen,
  onClose,
  initialEmail,
  onConfirm,
  isPending
}: NdaTemplateModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onConfirm({
      email,
      message,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" /> Dispatch NDA Agreement
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recipient Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={message}
              onChange={setMessage}
              placeholder="Type your NDA email..."
              style={{
                height: "280px",
                marginBottom: "60px",
              }}
            />
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 text-white hover:bg-blue-700">
              {isPending ? "Generating & Sending..." : "Confirm & Send Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}