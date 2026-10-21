"use client";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LogIn, UserPlus, X, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const configured = isSupabaseConfigured();

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      setMessage({
        type: "error",
        text: "Supabase belum terkonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setMessage({ type: "error", text: error.message });
          return;
        }

        if (data.user) {
          const loggedInUser = data.user;
          setMessage({ type: "success", text: "Berhasil masuk." });
          setTimeout(() => {
            onSuccess?.(loggedInUser);
            onClose();
          }, 600);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });

        if (error) {
          setMessage({ type: "error", text: error.message });
          return;
        }

        if (data.user && data.session) {
          // Konfirmasi email nonaktif: pengguna langsung masuk
          const newUser = data.user;
          setMessage({ type: "success", text: "Akun dibuat dan Anda sudah masuk." });
          setTimeout(() => {
            onSuccess?.(newUser);
            onClose();
          }, 800);
        } else {
          // Konfirmasi email aktif: belum ada sesi, pengguna harus verifikasi dulu
          setIsLogin(true);
          setPassword("");
          setMessage({
            type: "success",
            text: `Akun dibuat. Buka tautan verifikasi yang dikirim ke ${email}, lalu masuk di sini.`,
          });
        }
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setMessage({ type: "error", text: errText });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div
        className="animate-rise relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted transition hover:bg-surface-2 hover:text-ink"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        <h2 id="auth-title" className="font-display text-xl font-semibold tracking-tight">
          {isLogin ? "Masuk ke akun mahasiswa" : "Buat akun mahasiswa"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {isLogin
            ? "Masuk untuk menyimpan dan membuka kembali hasil rekomendasi."
            : "Akun dipakai untuk menyimpan riwayat rekomendasi magang Anda."}
        </p>

        {!configured && (
          <div className="mt-4 rounded-lg border border-warn/30 bg-warn-soft p-3 text-xs text-warn">
            Variabel lingkungan Supabase belum lengkap di .env.local.
          </div>
        )}

        {message && (
          <div
            role="status"
            className={`mt-4 rounded-lg border p-3 text-xs ${
              message.type === "success" ? "border-ok/30 bg-ok-soft text-ok" : "border-brand/30 bg-brand-soft text-brand"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="mt-5 space-y-3.5">
          {!isLogin && (
            <div className="space-y-1.5">
              <Label htmlFor="auth-name">Nama lengkap</Label>
              <Input
                id="auth-name"
                type="text"
                required
                autoComplete="name"
                placeholder="Nama sesuai KTM"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              placeholder="nama@student.telkomuniversity.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading} className="mt-1 w-full">
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Memproses…
              </>
            ) : isLogin ? (
              <>
                <LogIn size={16} /> Masuk
              </>
            ) : (
              <>
                <UserPlus size={16} /> Buat akun
              </>
            )}
          </Button>
        </form>

        <div className="mt-5 border-t border-line pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage(null);
            }}
            className="text-xs font-semibold text-muted hover:text-ink"
          >
            {isLogin ? "Belum punya akun? Buat akun" : "Sudah punya akun? Masuk"}
          </button>
        </div>
      </div>
    </div>
  );
}
