"use client";

import * as React from "react";
import {
  Accordion as ShadAccordion,
  AccordionItem as ShadAccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { AccordionProps } from "./type";

export const Accordion = ({
  items,
  defaultOpen,
  type = "single",
  className,
}: AccordionProps) => {
  if (type === "multiple") {
    return (
      <ShadAccordion type="multiple" defaultValue={defaultOpen ? [defaultOpen] : undefined} className={className}>
        {items.map(({ id, trigger, content }) => (
          <ShadAccordionItem value={id} key={id}>
            <AccordionTrigger>{trigger}</AccordionTrigger>
            <AccordionContent>{content}</AccordionContent>
          </ShadAccordionItem>
        ))}
      </ShadAccordion>
    );
  }

  return (
    <ShadAccordion type="single" defaultValue={defaultOpen} className={className}>
      {items.map(({ id, trigger, content }) => (
        <ShadAccordionItem value={id} key={id}>
          <AccordionTrigger>{trigger}</AccordionTrigger>
          <AccordionContent>{content}</AccordionContent>
        </ShadAccordionItem>
      ))}
    </ShadAccordion>
  );
};
