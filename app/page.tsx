"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth/login");
    } else if (profile?.must_change_password) {
      router.push("/auth/set-password");
    } else if (profile?.role === "admin") {
      router.push("/dashboard");
    } else if (profile?.last_used_company_id) {
      router.push("/dashboard");
    } else {
      router.push("/profile");
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-lg bg-primary animate-pulse" />
    </div>
  );
}
