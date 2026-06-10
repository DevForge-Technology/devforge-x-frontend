"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { useEffect } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
    if (!loading && user && profile?.must_change_password && pathname !== "/auth/set-password") {
      router.push("/auth/set-password");
    }
  }, [user, profile?.must_change_password, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-slate-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200/70 bg-white/90 p-8 shadow-2xl shadow-slate-200/30">
          <div className="h-8 w-8 rounded-lg bg-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-slate-50 to-white">
      <Sidebar />
      <main className="pl-60 min-h-screen">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-200/40 backdrop-blur-xl">
            <div className="p-6 lg:p-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
