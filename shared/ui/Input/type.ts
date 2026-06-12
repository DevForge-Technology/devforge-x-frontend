import type { ChangeEvent, FocusEvent } from "react";

export type InputType =
  | "text"
  | "email"
  | "password"
  | "search"
  | "tel"
  | "url"
  | "number";

export interface InputProps {
  id?: string;
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  type?: InputType;
  placeholder?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  autoComplete?: string;
}
