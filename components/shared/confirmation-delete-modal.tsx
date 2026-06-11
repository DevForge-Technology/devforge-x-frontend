"use client";

import * as React from "react";
import { Button, Modal } from "@/shared/ui";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import type { UseMutationResult } from "@tanstack/react-query";
import { extractError } from "@/lib/services/apiService";
import { toast } from "sonner";

export interface ConfirmationDeleteModalProps<TData = any, TError = any, TPayload = any, TContext = any> {
    title?: string;
    description?: string;
    mutation: UseMutationResult<TData, TError, TPayload, TContext>;
    payload: TPayload;
    successMessage?: string;
    onSuccess?: (data: TData) => void;
}

export const ConfirmationDeleteModal = NiceModal.create(
  ({
    title,
    mutation,
    payload,
    successMessage = "Item deleted successfully",
    onSuccess,
    description
  }: ConfirmationDeleteModalProps) => {
    const { hide, visible } = useModal();
    const [localLoading, setLocalLoading] = React.useState(false);

    const handleConfirm = async () => {
        setLocalLoading(true);
        await mutation.mutateAsync(payload, {
            onSuccess: (data) => {
                toast.success(successMessage);
                hide();
                onSuccess?.(data);
            },
            onError: (err) => {
                toast.error(extractError(err));
            },
        }).catch(() => {});
        setLocalLoading(false);
    };

    return (
        <Modal open={visible} onOpenChange={hide} title={title || ""}>
           <div className="flex flex-col gap-2">
            <p className="text-gray-700">{description}</p>
             <div className="flex justify-end gap-2 pt-6">
                <Button variant="outline" onClick={hide} disabled={localLoading}>
                    Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirm} loading={localLoading}>
                    Confirm
                </Button>
            </div>
            </div>
        </Modal>
    );
});
ConfirmationDeleteModal.displayName = "ConfirmationDeleteModal";