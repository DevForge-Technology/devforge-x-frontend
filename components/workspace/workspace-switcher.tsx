"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useUpdateWorkspaceMutation } from "@/lib/api/hooks/useCompanies";
import { useQueryClient } from "@tanstack/react-query";
import type { Company } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";

export function WorkspaceSwitcher() {
  const { profile, refreshProfile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const updateWorkspaceMutation = useUpdateWorkspaceMutation();

  useEffect(() => {
    setCompanies(profile?.assignedCompanies ?? []);
  }, [profile?.assignedCompanies]);

  const activeCompany = companies.find((c) => c.id === profile?.last_used_company_id) ?? companies[0];
  const hasMultiple = companies.length > 1;

  if (companies.length === 0) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200/40 p-3 text-xs font-medium text-slate-400">
        No workspace assigned. Contact your admin.
      </div>
    );
  }

  const handleSwitch = async (companyId: string) => {
    try {
      await updateWorkspaceMutation.mutateAsync(companyId);
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['companies', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setOpen(false);
    } catch {
      // error handled silently
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {hasMultiple ? (
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl px-4 h-11 transition-colors group text-left shadow-none"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              <span className="truncate text-sm font-bold text-slate-800">
                {activeCompany?.name || "Select workspace"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
          </Button>
        </DropdownMenuTrigger>
      ) : (
        <div
          className="w-full flex items-center justify-between bg-slate-50 border border-slate-200/60 text-slate-800 h-11 px-4 rounded-xl text-sm"
          aria-hidden
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            <span className="truncate text-sm font-bold text-slate-800">
              {activeCompany?.name || "Select workspace"}
            </span>
          </div>
        </div>
      )}

      <DropdownMenuContent 
        className="w-[calc(256px-32px)] ml-4 bg-white border border-slate-200/80 rounded-xl p-1.5 shadow-lg shadow-slate-100/50 animate-in fade-in-50 zoom-in-95 duration-100"
        align="start"
        sideOffset={6}
      >
        <DropdownMenuLabel className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 pt-2 pb-1.5 selection:bg-transparent">
          Switch Workspace
        </DropdownMenuLabel>
        
        <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
          {companies.map((company) => {
            const isSelected = company.id === profile?.last_used_company_id;
            return (
              <DropdownMenuItem
                key={company.id}
                disabled={updateWorkspaceMutation.isPending}
                onClick={() => handleSwitch(company.id)}
                className={`w-full flex items-center justify-between px-3 h-10 rounded-lg text-sm font-semibold transition-colors cursor-pointer outline-none ${
                  isSelected 
                    ? "bg-slate-50 text-slate-900" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80"
                }`}
              >
                <span className="truncate text-left">{company.name}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary shrink-0 stroke-[2.5]" />
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}