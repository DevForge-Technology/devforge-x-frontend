"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  UserCircle,
  LogOut,
  Shield,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { Button } from "@/shared/ui";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Array<"admin" | "vendor">;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "vendor"] },
  { label: "Vendors", href: "/vendors", icon: Users, roles: ["admin"] },
  { label: "Companies", href: "/companies", icon: Building2, roles: ["admin"] },
  { label: "Referrals", href: "/referrals", icon: FileText, roles: ["admin", "vendor"] },
  { label: "Profile", href: "/profile", icon: UserCircle, roles: ["admin", "vendor"] },
];

export function Sidebar() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const role = profile?.role ?? "vendor";
  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200/80 text-slate-900 transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex items-center gap-3 px-4 h-16 shrink-0 border-b border-slate-100">
          {!collapsed && (
            <span className="font-bold text-sm tracking-tight text-slate-900 truncate">DevForge[x]</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-slate-400 hover:text-slate-800 hover:bg-slate-100 h-7 w-7"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {role === "vendor" && (
          <>
            {!collapsed ? (
              <>
                <div className="px-3 py-3">
                  <WorkspaceSwitcher />
                </div>
                <Separator className="bg-slate-100" />
              </>
            ) : (
              <div className="py-3 flex justify-center border-b border-slate-100">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-10 h-10 flex items-center justify-center rounded-md bg-slate-100">
                      <Building2 className="h-4 w-4 text-slate-600" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-normal">
                    {profile?.assignedCompanies && profile.assignedCompanies.length > 0
                      ? profile.assignedCompanies[0].name
                      : "No workspace assigned"}
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </>
        )}

        <ScrollArea className="flex-1 py-2">
          <nav className="flex flex-col gap-1 px-2">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              const button = (
                <Button
                  key={item.href}
                  variant="ghost"
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full justify-start gap-3 h-9 text-sm font-normal transition-colors duration-200",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "bg-primary text-white hover:bg-primary hover:text-white font-medium shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && item.label}
                </Button>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right" className="font-normal">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return button;
            })}
          </nav>
        </ScrollArea>

        <div className="mt-auto p-3 border-t border-slate-100">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{profile?.name}</p>
                <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 shrink-0 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
