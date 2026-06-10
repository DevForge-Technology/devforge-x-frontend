"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { updateWorkspace } from "@/lib/api/client";
import type { Company } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export function WorkspaceSwitcher() {
  const { profile, refreshProfile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCompanies(profile?.assignedCompanies ?? []);
  }, [profile?.assignedCompanies]);

  const activeCompany = companies.find((c) => c.id === profile?.last_used_company_id) ?? companies[0];
  const hasMultiple = companies.length > 1;

  if (companies.length === 0) {
    return (
      <div className="rounded-lg bg-slate-100 p-3 text-xs text-slate-500">
        No workspace assigned. Contact your admin.
      </div>
    );
  }

  const handleSwitch = async (companyId: string) => {
    setLoading(true);
    try {
      await updateWorkspace(companyId);
      await refreshProfile();
      setOpen(false);
    } catch {
      // error handled silently
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {hasMultiple ? (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:text-slate-900 h-9 text-sm shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              {activeCompany?.logo ? (
                <img src={activeCompany.logo} alt="" className="h-4 w-4 rounded" />
              ) : (
                <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
              )}
              <span className="truncate font-medium">{activeCompany?.name || "Select workspace"}</span>
            </div>
            <ChevronsUpDown className="h-3 w-3 shrink-0 text-slate-500" />
          </Button>
        </DialogTrigger>
      ) : (
        <div
          className="w-full flex items-center justify-between bg-slate-50 border border-slate-200/80 text-slate-800 h-9 px-3 rounded text-sm"
          aria-hidden
        >
          <div className="flex items-center gap-2 min-w-0">
            {activeCompany?.logo ? (
              <img src={activeCompany.logo} alt="" className="h-4 w-4 rounded" />
            ) : (
              <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
            )}
            <span className="truncate font-medium">{activeCompany?.name || "Select workspace"}</span>
          </div>
        </div>
      )}

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Switch Workspace</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-64">
          <div className="flex flex-col gap-1">
            {companies.map((company) => (
              <Button
                key={company.id}
                variant="ghost"
                className="w-full justify-start gap-3 h-10"
                onClick={() => handleSwitch(company.id)}
                disabled={loading}
              >
                {company.logo ? (
                  <img src={company.logo} alt="" className="h-5 w-5 rounded" />
                ) : (
                  <div
                    className="h-5 w-5 rounded flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: company.accent_color || "#0B5DF4" }}
                  >
                    {company.name.charAt(0)}
                  </div>
                )}
                <span className="flex-1 text-left truncate">{company.name}</span>
                {company.id === profile?.last_used_company_id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
