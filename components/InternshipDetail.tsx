"use client";
import { useEffect } from "react";
import { ExternalLink, X } from "lucide-react";
import { useReferenceData } from "./ReferenceProvider";
import { cn } from "@/lib/utils";
import type { Internship } from "@/lib/types";

/** Detail lowongan: deskripsi, kebutuhan kompetensi, dan tautan (FR Menampilkan Rekomendasi no. 4 & 5) */
export function InternshipDetail({ internship, onClose }: { internship: Internship | null; onClose: () => void }) {
  const { data } = useReferenceData();

  useEffect(() => {
    if (!internship) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [internship, onClose]);

  if (!internship) return null;

  const targets = data.targets.filter((t) => t.internship_id === internship.id);
  const rows = data.categories
    .filter((c) => c.specialization_id === internship.specialization_id)
    .map((c) => ({ cat: c, target: targets.find((t) => t.competency_category_id === c.id) }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="internship-title"
    >
      <div
        className="animate-rise max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-surface p-6 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">{internship.company_name}</p>
            <h2 id="internship-title" className="mt-1 font-display text-2xl font-bold tracking-tight">
              {internship.position_name}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-ink">
            <X size={18} />
          </button>
        </div>
        {internship.description && <p className="mt-3 text-sm leading-relaxed text-muted">{internship.description}</p>}

        <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted">Kompetensi yang dicari</h3>
        <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
          {rows.map(({ cat, target }) => (
            <li key={cat.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="min-w-0 flex-1">{cat.name}</span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-semibold",
                  target?.factor_type === "CORE" ? "bg-ink text-bg" : "bg-surface-2 text-muted",
                )}
              >
                {target?.factor_type === "CORE" ? "Utama" : "Pendukung"}
              </span>
              <span className="flex gap-0.5" aria-label={`Target ${target?.target_score ?? "-"} dari 4`}>
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    className={cn("h-2 w-4 rounded-sm", n <= (target?.target_score ?? 0) ? "bg-brand" : "bg-surface-2")}
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">
          Kompetensi utama (core factor) bobotnya 60%, pendukung (secondary factor) 40%.
        </p>

        {internship.vacancy_url && (
          <a
            href={internship.vacancy_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            Lihat lowongannya <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
