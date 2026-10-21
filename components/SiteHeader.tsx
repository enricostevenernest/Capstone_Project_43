"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserNav } from "./UserNav";
import { useAuth } from "./useAuth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/spk", label: "Penilaian" },
  { href: "/history", label: "Riwayat" },
];

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const nav = isAdmin ? [...NAV, { href: "/admin", label: "Admin" }] : NAV;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-display text-sm font-bold text-on-brand">
            43
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-sm font-semibold">SPK Magang</span>
            <span className="block text-[11px] text-muted">Telkom University Jakarta</span>
          </span>
        </Link>
        <nav className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-2 py-1.5 text-xs font-semibold transition sm:px-3 sm:text-sm",
                  item.href === "/" && "hidden sm:inline-flex",
                  active ? "bg-surface-2 text-ink" : "text-muted hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          {children}
          <span className="ml-1">
            <UserNav />
          </span>
        </nav>
      </div>
    </header>
  );
}
