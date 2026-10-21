"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, ClipboardCheck, LogOut, Briefcase } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Hasil mahasiswa", Icon: ClipboardCheck },
  { href: "/admin/lowongan", label: "Lowongan & target", Icon: Briefcase },
];

/** Kerangka tampilan admin: header gelap terpisah dari tampilan mahasiswa */
export function AdminShell({ email, children }: { email?: string | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-ink text-bg print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-display text-sm font-bold text-on-brand">
              43
            </span>
            <span className="leading-tight">
              <span className="block font-display text-sm font-semibold">Panel Admin</span>
              <span className="block text-[11px] opacity-60">SPK Magang · Program Studi SI</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/"
              className="hidden items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold opacity-70 transition hover:opacity-100 sm:inline-flex"
            >
              Lihat tampilan mahasiswa <ArrowUpRight size={14} />
            </Link>
            {email && <span className="hidden max-w-[180px] truncate text-xs opacity-60 md:inline">{email}</span>}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-bg/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-bg/10"
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6" aria-label="Menu admin">
          {ADMIN_NAV.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition",
                  active ? "border-brand opacity-100" : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                <Icon size={15} /> {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
