"use client";

import * as React from "react";
import { Button as ShadButton } from "@/components/ui/button";
import type { ButtonProps, ButtonVariant, ButtonSize } from "./type";

const variantMap: Record<ButtonVariant, "default" | "outline" | "destructive" | "ghost"> = {
  primary: "default",
  secondary: "outline",
  destructive: "destructive",
  ghost: "ghost",
  outline: "outline",
};

const sizeMap: Record<ButtonSize, "default" | "sm" | "lg" | "icon"> = {
  sm: "sm",
  md: "default",
  lg: "lg",
  icon: "icon",
};

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      label,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const gapClass = className?.split(/\s+/).find((c) => c.startsWith("gap-")) || "gap-2";

    return (
      <ShadButton
        ref={ref}
        variant={variantMap[variant]}
        size={sizeMap[size]}
        disabled={disabled || loading}
        className={cn("relative", className)}
        {...props}
      >
        <span className={cn("inline-flex items-center justify-[inherit] h-full", gapClass, loading && "opacity-0")}>
          {label ?? children}
        </span>
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        )}
      </ShadButton>
    );
  }
);
Button.displayName = "Button";
