"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { checkIsAdmin } from "@/lib/admin";

/** Status login + peran admin. `ready` false selama sesi belum terbaca. */
export function useAuth() {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(!configured);

  useEffect(() => {
    if (!configured) return;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      setUser(next);
      if (!next) {
        setIsAdmin(false);
        setReady(true);
        return;
      }
      // Ditunda agar tidak memanggil Supabase di dalam callback auth (menghindari deadlock)
      setTimeout(() => {
        checkIsAdmin().then((admin) => {
          setIsAdmin(admin);
          setReady(true);
        });
      }, 0);
    });
    return () => listener.subscription.unsubscribe();
  }, [configured]);

  return { user, isAdmin, ready, configured };
}
