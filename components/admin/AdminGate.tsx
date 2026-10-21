"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, LogIn, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Hasil mahasiswa" },
  { href: "/admin/lowongan", label: "Lowongan & target" },
];

/** Halaman admin hanya terbuka untuk akun yang terdaftar di tabel admin_users */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, ready, configured } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const pathname = usePathname();

  let body: React.ReactNode;
  if (!configured) {
    body = <Notice title="Database belum tersambung" text="Halaman admin butuh Supabase. Isi variabel di .env.local dulu." />;
  } else if (!ready) {
    body = (
      <div className="flex flex-col items-center gap-2 py-24 text-muted">
        <Loader2 size={22} className="animate-spin" />
        <p className="text-xs">Mengecek akses admin…</p>
      </div>
    );
  } else if (!user) {
    body = (
      <Notice
        title="Khusus admin program studi"
        text="Masuk dengan akun admin untuk memeriksa hasil rekomendasi mahasiswa."
        action={
          <Button onClick={() => setAuthOpen(true)}>
            <LogIn size={16} /> Masuk
          </Button>
        }
      />
    );
  } else if (!isAdmin) {
    body = (
      <Notice
        icon
        title="Akunmu belum punya akses admin"
        text={`Kamu masuk sebagai ${user.email}. Minta pengelola sistem menambahkan akun ini ke tabel admin_users (perintahnya ada di supabase/migration_002_admin.sql).`}
        action={
          <Link href="/" className="text-sm font-semibold text-brand hover:underline">
            Kembali ke beranda
          </Link>
        }
      />
    );
  } else {
    body = (
      <>
        <nav className="mb-6 flex gap-1 border-b border-line" aria-label="Menu admin">
          {ADMIN_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition",
                  active ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {body}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </main>
  );
}

function Notice({ title, text, action, icon }: { title: string; text: string; action?: React.ReactNode; icon?: boolean }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      {icon && <ShieldAlert size={28} className="mx-auto mb-3 text-warn" />}
      <h1 className="font-display text-xl font-semibold">{title}</h1>
      <p className="mx-auto mt-2 text-sm text-muted">{text}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
