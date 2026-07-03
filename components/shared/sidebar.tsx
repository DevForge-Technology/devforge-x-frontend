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
  ChevronLeft,
  Menu,
} from "lucide-react";
import { Button } from "@/shared/ui";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { getDashboardStats, getReferrals } from "@/lib/api/client";
import Image from "next/image";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Array<"admin" | "vendor">;
  badgeKey?: "vendors" | "companies" | "referrals";
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "vendor"] },
  { label: "Vendors", href: "/vendors", icon: Users, roles: ["admin"], badgeKey: "vendors" },
  { label: "Companies", href: "/companies", icon: Building2, roles: ["admin"], badgeKey: "companies" },
  { label: "Referrals", href: "/referrals", icon: FileText, roles: ["admin", "vendor"], badgeKey: "referrals" },
  { label: "Profile", href: "/profile", icon: UserCircle, roles: ["admin", "vendor"] },
];

export function Sidebar() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const [counts, setCounts] = useState({
    vendors: 0,
    companies: 0,
    referrals: 0,
  });

  const role = profile?.role ?? "vendor";
  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  useEffect(() => {
    async function fetchLiveCounts() {
      try {
        if (role === "admin") {
          const stats = await getDashboardStats();
          setCounts({
            vendors: stats.total_vendors || 0,
            companies: stats.total_companies || 0,
            referrals: stats.total_referrals || 0,
          });
        } else {
          const referralData = await getReferrals({ page: "1", page_size: "10" });
          setCounts((prev) => ({
            ...prev,
            referrals: referralData.referrals?.length || 0,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch sidebar live badge counts:", error);
      }
    }

    fetchLiveCounts();
  }, [role, profile?.last_used_company_id]);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-150 text-slate-900 transition-all duration-300 flex flex-col font-sans selection:bg-transparent",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center gap-2 px-4 h-16 shrink-0">
          <div className="flex-1 flex items-center justify-start overflow-hidden pl-1">
            {collapsed ? (
              <Image 
                src="/Devforge Deliverables-12.png" 
                alt="Devforge Mini Logo" 
                width={28} 
                height={28} 
                className="object-contain min-w-[28px]"
                priority
              />
            ) : (
              <Image 
                src="/logo.png" 
                alt="Devforge Logo" 
                width={130} 
                height={32} 
                className="object-contain"
                priority
              />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-slate-800 hover:bg-slate-50 h-7 w-7 shrink-0 rounded-lg"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {role === "vendor" && (
          <div className={cn("px-4 mb-4", collapsed && "px-2 flex justify-center")}>
            {!collapsed ? (
              <WorkspaceSwitcher />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200/60 shadow-sm cursor-pointer">
                    <Building2 className="h-4 w-4 text-slate-600" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-normal">
                  {profile?.assignedCompanies && profile.assignedCompanies.length > 0
                    ? profile.assignedCompanies[0].name
                    : "No workspace assigned"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        <ScrollArea className="flex-1 py-1">
          <nav className="flex flex-col gap-1 px-3">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              
              const dynamicBadgeCount = item.badgeKey ? counts[item.badgeKey] : 0;
              const hasBadge = dynamicBadgeCount > 0;

              const button = (
                <Button
                  key={item.href}
                  variant="ghost"
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full justify-between h-11 px-4 text-sm font-semibold rounded-xl transition-all duration-200",
                    collapsed && "justify-center px-0 h-10 w-10 mx-auto",
                    isActive
                      ? "bg-primary text-white hover:bg-primary hover:text-white shadow-sm shadow-primary/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <div className={cn("flex items-center gap-3", collapsed && "gap-0")}>
                    <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-500")} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  
                  {!collapsed && hasBadge && (
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-bold transition-colors",
                        isActive
                          ? "bg-white text-primary"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {dynamicBadgeCount}
                    </span>
                  )}
                </Button>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right" className="font-semibold flex items-center gap-2">
                      {item.label}
                      {hasBadge && (
                        <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {dynamicBadgeCount}
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return button;
            })}
          </nav>
        </ScrollArea>

        <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
          <div className={cn("flex items-center justify-between gap-2", collapsed && "flex-col justify-center gap-4")}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                {getInitials(profile?.name)}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-800 truncate">{profile?.name}</span>
                  <span className="text-xs text-slate-400 truncate">{profile?.email}</span>
                </div>
              )}
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-9 w-9 shrink-0 rounded-xl transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-semibold">Sign out</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}