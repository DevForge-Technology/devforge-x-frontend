import type { ReactNode } from "react";

export interface AccordionItem {
  id: string;
  trigger: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string;
  type?: "single" | "multiple";
  className?: string;
}
