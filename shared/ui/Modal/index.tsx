"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ModalProps, ModalSize } from "./type";

const sizeMap: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

export const Modal = ({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
  actions,
  size = "md",
  className,
  contentClassName,
}: ModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent className={cn(sizeMap[size], className, contentClassName)}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      {children}
      {actions ? <DialogFooter>{actions}</DialogFooter> : null}
    </DialogContent>
  </Dialog>
);
