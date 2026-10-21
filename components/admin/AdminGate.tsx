"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, LogIn, LogOut, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/useAuth";
import { authErrorText } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { AdminShell } from "./AdminShell";

/** Halaman admin hanya terbuka untuk akun yang terdaftar di tabel admin_users */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, ready, configured } = useAuth();

  if (!configured) {
    return (
      <AdminLoginLayout>
        <p className="text-sm text-muted">Database belum tersambung. Isi variabel Supabase di .env.local dulu.</p>
      </AdminLoginLayout>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-muted">
        <Loader2 size={22} className="animate-spin" />
        <p className="text-xs">Mengecek akses admin…</p>
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
          <ShieldAlert size={28} className="text-warn" />
          <h2 className="font-display text-xl font-semibold">Akun ini bukan akun admin</h2>
          <p className="text-sm text-muted">
            Kamu masuk sebagai <b className="text-ink">{user.email}</b>, yang terdaftar sebagai mahasiswa. Keluar dulu, lalu
            masuk dengan akun admin program studi.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>
              <LogOut size={16} /> Keluar
            </Button>
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-muted hover:text-ink"
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
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden flex-col justify-between bg-ink p-10 text-bg lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-display text-sm font-bold text-on-brand">
            43
          </span>
          <span className="font-display text-sm font-semibold">SPK Magang · Telkom University Jakarta</span>
        </div>
        <div>
          <ShieldCheck size={36} className="text-brand" />
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight">Panel Admin Program Studi</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed opacity-70">
            Tempat memeriksa hasil rekomendasi mahasiswa, memvalidasi atau mengoreksi penilaian AI, dan mengelola data
            lowongan beserta nilai targetnya.
          </p>
        </div>
        <p className="text-xs opacity-50">Akun admin dibuat oleh pengelola sistem, tidak lewat pendaftaran.</p>
      </div>
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
            <ArrowLeft size={14} /> Kembali ke tampilan mahasiswa
          </Link>
          {children}
        </div>
      </div>
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
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand lg:hidden">Panel Admin</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Masuk sebagai admin</h2>
        <p className="mt-1 text-sm text-muted">Gunakan akun admin yang diberikan pengelola sistem.</p>
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-brand/30 bg-brand-soft p-3 text-sm text-brand">
          {error}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="admin-email">Email admin</Label>
        <Input id="admin-email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="admin-password">Password</Label>
        <Input
          id="admin-password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />} Masuk ke panel admin
      </Button>
    </form>
  );
}
