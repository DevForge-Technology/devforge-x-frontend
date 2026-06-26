"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button, Input } from "@/shared/ui";
import { Mail, CheckCircle2, Eye } from "lucide-react";

interface NdaTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail: string;
  companyName: string;
  vendorName: string;
  onConfirm: (payload: { email: string; templateId: string }) => void;
  isPending: boolean;
}

const TEMPLATES = [
  {
    id: "standard_formal",
    name: "Corporate Formal",
    description: "Standard clean legal wrapper for corporate entities.",
    previewHtml: `
      <div style="font-family: sans-serif; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; color: #334155;">
        <p>Dear {{vendorName}},</p>
        <p>Please find attached the Mutual Non-Disclosure Agreement (NDA) for <strong>{{companyName}}</strong> for your professional review and electronic signature.</p>
        <p>Kind Regards,<br/><strong>DevForge Administration</strong></p>
      </div>
    `
  },
  {
    id: "friendly_casual",
    name: "Modern Partnership",
    description: "A welcoming, collaborative tone tailored for agile teams.",
    previewHtml: `
      <div style="font-family: sans-serif; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; color: #334155; background-color: #f8fafc;">
        <p>Hi {{vendorName}}! </p>
        <p>Excited to kick things off together. We've compiled the NDA for <strong>{{companyName}}</strong>—please check out the attached PDF copies below.</p>
        <p>Best,<br/><strong>The DevForge Onboarding Team</strong></p>
      </div>
    `
  }
];

export function NdaTemplateModal({
  isOpen,
  onClose,
  initialEmail,
  companyName,
  vendorName,
  onConfirm,
  isPending
}: NdaTemplateModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [selectedTemplate, setSelectedTemplate] = useState("standard_formal");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onConfirm({ email, templateId: selectedTemplate });
  };

  const renderPreview = (html: string) => {
    return html
      .replace(/{{vendorName}}/g, vendorName || "Vendor Team")
      .replace(/{{companyName}}/g, companyName);
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
          {/* Target Email input field */}
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

          {/* Template Choices Selector Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Select Outbound Email Layout</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/20 ring-1 ring-blue-600"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-blue-600" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{tpl.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{tpl.description}</p>
                      
                      <div className="mt-3 bg-white rounded-lg p-2 border border-slate-100 text-left">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight flex items-center gap-1 mb-1">
                          <Eye className="h-3 w-3" /> Live Format Preview:
                        </span>
                        <div 
                          className="scale-[0.95] origin-top-left overflow-hidden max-h-24"
                          dangerouslySetInnerHTML={{ __html: renderPreview(tpl.previewHtml) }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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