"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { authBuilder } from "@/lib/api/builders/auth";
import { usersBuilder } from "@/lib/api/builders/users";
import { setTokenProvider, setUnauthorizedHandler } from "@/lib/services/apiService";
import { toProfile, type Profile } from "@/lib/types";
import type { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; mustChangePassword?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();
  const router = useRouter();

  const loadProfile = useCallback(async (accessToken: string) => {
    try {
      await authBuilder.verifyToken(accessToken);
      const me = await usersBuilder.getMe();
      setProfile(toProfile(me));
    } catch {
      setProfile(null);
    } 
  }, []);

  useEffect(() => {
    setTokenProvider(async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      return s?.access_token ?? null;
    });

    setUnauthorizedHandler(() => {
      supabase.auth.signOut();
      router.push("/auth/login");
    });
  }, [supabase, router]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, sess) => {
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.access_token) {
          await loadProfile(sess.access_token);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.access_token) {
        await loadProfile(sess.access_token);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // Wait for auth state to be updated by onAuthStateChange
    await new Promise<void>((resolve) => {
      const checkUser = setInterval(() => {
        if (data.session?.user && profile) {
          clearInterval(checkUser);
          resolve();
        }
      }, 50);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkUser);
        resolve();
      }, 5000);
    });

    return {
      error: null,
      mustChangePassword: data.session?.user.user_metadata?.must_change_password === true,
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = useCallback(async () => {
    const { data: { session: newSession } } = await supabase.auth.refreshSession();
    if (newSession) {
      setSession(newSession);
      setUser(newSession.user);
      await loadProfile(newSession.access_token);
    } else if (session?.access_token) {
      await loadProfile(session.access_token);
    }
  }, [supabase, session, loadProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
