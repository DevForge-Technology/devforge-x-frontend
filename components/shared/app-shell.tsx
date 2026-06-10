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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
