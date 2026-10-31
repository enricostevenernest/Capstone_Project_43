"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, LogIn, LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/useAuth";
import { authErrorText } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { NetworkBackground } from "@/components/NetworkBackground";
import { FloatingPaths } from "@/components/ui/floating-paths";
import { AdminShell } from "./AdminShell";

/** Halaman admin hanya terbuka untuk akun yang terdaftar di tabel admin_users */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, ready, configured } = useAuth();

  if (!configured) {
    return (
      <AdminLoginLayout>
        <div className="space-y-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-warn/25 bg-warn-soft text-warn">
            <ShieldAlert size={22} />
          </div>
          <h2 className="font-display text-lg font-bold text-ink">Database Belum Tersambung</h2>
          <p className="text-xs text-muted leading-relaxed text-justify">
            Database belum tersambung. Harap isi variabel Supabase di{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-ink">.env.local</code> terlebih dahulu.
          </p>
        </div>
      </AdminLoginLayout>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg text-muted">
        <Loader2 size={26} className="animate-spin text-brand" />
        <p className="text-xs font-medium">Mengecek akses admin…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AdminLoginLayout>
        <AdminLoginForm />
      </AdminLoginLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLoginLayout>
        <div className="space-y-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-warn/25 bg-warn-soft text-warn shadow-inner">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-ink sm:text-xl">
              Akun ini bukan akun admin
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted text-justify">
              Kamu sedang masuk sebagai <b className="text-ink">{user.email}</b> (terdaftar sebagai mahasiswa). Silakan keluar dulu, lalu masuk dengan akun admin program studi.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" onClick={() => supabase.auth.signOut()} className="text-xs">
              <LogOut size={14} /> Keluar
            </Button>
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 text-xs font-semibold text-muted transition hover:bg-surface hover:text-ink"
            >
              Ke tampilan mahasiswa
            </Link>
          </div>
        </div>
      </AdminLoginLayout>
    );
  }

  return <AdminShell email={user.email}>{children}</AdminShell>;
}

/** Halaman masuk khusus admin, dibedakan dari login mahasiswa (tanpa opsi daftar) */
function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-bg">
      {/* Background interaktif konstelasi */}
      <NetworkBackground />

      {/* Top Navbar */}
      <header className="relative z-10 w-full border-b border-line/60 bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl xl:max-w-[1380px] items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-display text-xs font-bold text-on-brand shadow-sm">
              43
            </span>
            <div className="leading-tight">
              <span className="font-display text-sm font-semibold text-ink group-hover:text-brand transition">
                SPK Magang
              </span>
              <span className="hidden text-xs text-muted sm:inline"> · Telkom University Jakarta</span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/70 px-3 py-1.5 text-xs font-semibold text-muted backdrop-blur transition hover:border-line-strong hover:bg-surface hover:text-ink"
          >
            <ArrowLeft size={14} /> Kembali ke tampilan mahasiswa
          </Link>
        </div>
      </header>

      {/* Center Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="animate-rise w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-surface/90 shadow-2xl backdrop-blur-xl grid md:grid-cols-5">
          {/* Sisi Kiri: Visual & Branding */}
          <div className="relative flex flex-col justify-between overflow-hidden border-b border-line bg-surface-2/40 p-6 sm:p-8 md:col-span-2 md:border-b-0 md:border-r">
            <FloatingPaths position={-1} />

            <div className="relative z-10">
              <h1 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Admin Program Studi
              </h1>
              <p className="mt-3 text-xs leading-relaxed text-muted text-justify">
                Tempat memeriksa hasil rekomendasi mahasiswa, memvalidasi atau mengoreksi penilaian AI, serta mengelola data lowongan beserta nilai targetnya.
              </p>
            </div>

            <div className="relative z-10 mt-6 rounded-lg border border-line/60 bg-surface/50 p-2.5 text-[11px] leading-relaxed text-muted text-justify">
              <span className="font-medium text-ink">Akses Terbatas:</span> Hanya akun yang terdaftar di sistem yang dapat mengakses panel ini.
            </div>
          </div>

          {/* Sisi Kanan: Form Login atau Pesan Status */}
          <div className="relative z-10 flex flex-col justify-center p-6 sm:p-8 md:col-span-3">
            {children}
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 py-3 text-center text-xs text-muted/60">
        Sistem Pendukung Keputusan Magang · Telkom University Jakarta
      </footer>
    </div>
  );
}

function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(authErrorText(err.message));
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">Otentikasi Pengelola</p>
        <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">Masuk sebagai admin</h2>
        <p className="mt-1 text-xs text-muted text-justify">Gunakan akun admin yang diberikan pengelola sistem.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-brand/30 bg-brand-soft p-3 text-xs text-brand leading-relaxed text-justify">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="admin-email">Email admin</Label>
        <Input
          id="admin-email"
          type="email"
          required
          autoComplete="username"
          placeholder="admin@spk.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-password">Password</Label>
        <Input
          id="admin-password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          placeholder="Minimal 6 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading} className="mt-2 w-full">
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Memverifikasi…
          </>
        ) : (
          <>
            <LogIn size={16} /> Masuk ke panel admin
          </>
        )}
      </Button>
    </form>
  );
}
