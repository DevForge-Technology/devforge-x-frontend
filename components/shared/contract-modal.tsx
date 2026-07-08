"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button, Input } from "@/shared/ui";
import { FilePlus, Loader2, Plus, Trash2 } from "lucide-react";
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import { toast } from "sonner";
import { useContracts } from "@/lib/api/hooks/useContracts";
import { Label } from "../ui/label";

interface CreateContractModalProps {
  companyId: string;
  vendorId: string;
}

export const CreateContractModal = NiceModal.create<CreateContractModalProps>(({
  companyId,
  vendorId,
}) => {
  const modal = useModal();
  const { createContract, isCreating } = useContracts({ companyId });

  const formik = useFormik({
    initialValues: {
      projectName: "",
      totalProjectValue: 0,
      phases: [{ name: "", dueDate: "", commissionType: "fixed" as 'fixed' | 'percentage', commissionValue: 0 }],
    },
    onSubmit: async (values) => {
      const toastId = toast.loading("Creating contract...");

      try {
        await new Promise<void>((resolve, reject) => {
          createContract(
            { ...values, companyId, vendorId },
            {
              onSuccess: () => resolve(),
              onError: (err) => reject(err),
            }
          );
        });

        toast.loading("Generating PDF...", { id: toastId });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/contracts/${companyId}/pdf`, 
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate PDF");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `contract-${values.projectName || "document"}.pdf`;
        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(url);

        toast.success("Contract created & downloaded!", { id: toastId });

        modal.hide();
      } catch (err) {
        console.error(err);
        toast.error("Failed to create contract.", { id: toastId });
      }
    }
  });

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.remove()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FilePlus className="h-5 w-5 text-primary" /> Create New Contract
          </DialogTitle>
        </DialogHeader>

        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit} className="space-y-6 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project Name</Label>
                <Input name="projectName" value={formik.values.projectName} onChange={formik.handleChange} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Value</Label>
                <Input type="number" name="totalProjectValue" value={formik.values.totalProjectValue} onChange={formik.handleChange} required />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project Phases</Label>
              <FieldArray name="phases">
                {({ push, remove }) => (
                  <div className="space-y-3">
                    {formik.values.phases.map((_, index) => (
                      <div key={index} className="flex items-end gap-2 p-3 border rounded-lg bg-slate-50">
                        <div className="flex-2 space-y-1">
                          <Input placeholder="Phase Name" name={`phases[${index}].name`} value={formik.values.phases[index].name} onChange={formik.handleChange} />
                        </div>
                        <div className="w-40 space-y-1">
                          <Input type={"date" as any} name={`phases[${index}].dueDate`} value={formik.values.phases[index].dueDate} onChange={formik.handleChange} />
                        </div>
                        <div className="w-32 space-y-1">
                          <select name={`phases[${index}].commissionType`} value={formik.values.phases[index].commissionType} onChange={formik.handleChange} className="w-full h-9 border rounded-md text-sm px-2">
                            <option value="fixed">Fixed</option>
                            <option value="percentage">Percentage</option>
                          </select>
                        </div>
                        <div className="w-24 space-y-1">
                          <Input type="number" placeholder="Amt" name={`phases[${index}].commissionValue`} value={formik.values.phases[index].commissionValue} onChange={formik.handleChange} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => push({ name: "", dueDate: "", commissionType: "fixed", commissionValue: 0 })} className="w-full gap-2">
                      <Plus className="h-4 w-4" /> Add Phase
                    </Button>
                  </div>
                )}
              </FieldArray>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => modal.hide()} disabled={isCreating}>Cancel</Button>
              <Button type="submit" disabled={isCreating} className="bg-primary text-white font-medium min-w-[145px]">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Contract"}
              </Button>
            </DialogFooter>
          </form>
        </FormikProvider>
      </DialogContent>
    </Dialog>
  );
});