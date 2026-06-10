"use client";

import * as React from "react";
import { Input as ShadInput } from "@/components/ui/input";
import type { InputProps } from "./type";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <ShadInput ref={ref} type={type} className={className} {...props} />
  )
);
Input.displayName = "Input";
