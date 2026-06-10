"use client";

import { AppShell } from "@/components/shared/app-shell";
import { CompaniesContainer } from "./container/companies-container";

export default function CompaniesPage() {
  return (
    <AppShell>
      <CompaniesContainer />
    </AppShell>
  );
}
