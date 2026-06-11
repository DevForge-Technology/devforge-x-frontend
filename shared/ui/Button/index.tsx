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
    return (
      <ShadButton
        ref={ref}
        variant={variantMap[variant]}
        size={sizeMap[size]}
        disabled={disabled || loading}
        className={className}
        {...props}
      >
        {loading ? "Loading..." : label ?? children}
      </ShadButton>
    );
  }
);
Button.displayName = "Button";
