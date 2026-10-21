"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { AuthModal } from "./AuthModal";
import { LogOut, History, LogIn, ChevronDown } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

export function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [configured]);

  async function handleLogout() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    setUser(null);
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0];

  return (
    <>
      {user ? (
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 text-xs font-semibold transition hover:bg-surface-2"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] font-bold text-bg">
              {(displayName || "M").charAt(0).toUpperCase()}
            </span>
            <span className="hidden max-w-[110px] truncate sm:inline">{displayName}</span>
            <ChevronDown size={14} className="text-muted" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div
                role="menu"
                className="animate-rise absolute right-0 z-50 mt-2 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-lg"
              >
                <div className="mb-1 border-b border-line px-2 py-2">
                  <p className="text-[11px] text-muted">Masuk sebagai</p>
                  <p className="truncate text-xs font-semibold">{user.email}</p>
                </div>
                <Link
                  href="/history"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium hover:bg-surface-2"
                >
                  <History size={14} /> Riwayat rekomendasi
                </Link>
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-brand hover:bg-brand-soft"
                >
                  <LogOut size={14} /> Keluar
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsAuthOpen(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-semibold transition hover:bg-surface-2"
        >
          <LogIn size={14} />
          <span className="hidden sm:inline">Masuk</span>
        </button>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={(u) => setUser(u)} />
    </>
  );
}
