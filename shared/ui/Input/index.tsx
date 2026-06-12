"use client";

import * as React from "react";
import { Input as ShadInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { InputProps } from "./type";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", startIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground">
            {startIcon}
          </div>
        )}
        <ShadInput
          ref={ref}
          type={type}
          className={cn(className, startIcon && "pl-10")}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";