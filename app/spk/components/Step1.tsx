"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { competencyCategories, internships } from "@/lib/data";
import type { SpecializationCode } from "@/lib/data";
import { cn } from "@/lib/utils";

const OPTIONS: { code: SpecializationCode; specId: string; title: string; focus: string }[] = [
  {
    code: "SAGE",
    specId: "spec_sage",
    title: "Software and IT Governance Engineering",
    focus: "Rekayasa perangkat lunak serta tata kelola teknologi informasi.",
  },
  {
    code: "DELTA",
    specId: "spec_delta",
    title: "Data Exploration, Learning & Translational Analytics",
    focus: "Eksplorasi data, pembelajaran mesin, dan analitik untuk keputusan bisnis.",
  },
];

export function Step1({
  spec,
  setSpec,
  onNext,
}: {
  spec: SpecializationCode | null;
  setSpec: (s: SpecializationCode | null) => void;
  onNext: () => void;
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            Tahap 1 dari 6
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Pilih Peminatan</h1>
        </div>
        <div className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted">
          {spec ? `${spec} dipilih` : "Belum memilih"}
        </div>
      </div>

      <p className="max-w-2xl text-sm text-muted">
        Pilih peminatan yang sedang kamu tempuh untuk mendapatkan rekomendasi tempat magang sesuai kompetensi.
      </p>

      <div role="radiogroup" aria-label="Peminatan" className="grid gap-4 md:grid-cols-2">
        {OPTIONS.map((opt) => {
          const selected = spec === opt.code;
          const cats = competencyCategories.filter((c) => c.specialization_id === opt.specId);
          const roles = internships.filter((i) => i.specialization_id === opt.specId);
          return (
            <button
              key={opt.code}
              role="radio"
              aria-checked={selected}
              onClick={() => setSpec(opt.code)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-surface p-5 text-left transition-all duration-200 md:p-6",
                selected
                  ? "border-brand bg-brand-soft/40 ring-2 ring-brand/20 shadow-sm"
                  : "border-line bg-surface hover:-translate-y-0.5 hover:border-brand/40 hover:bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "absolute right-5 top-5 grid h-7 w-7 place-items-center rounded-full border",
                  selected ? "border-brand bg-brand text-on-brand" : "border-line bg-surface text-transparent",
                )}
              >
                {selected && <Check size={14} strokeWidth={3} />}
              </span>
              <div className="font-display text-3xl font-bold tracking-tight text-ink">{opt.code}</div>
              <div className="mt-1 pr-8 text-sm font-medium text-ink">{opt.title}</div>
              <p className="mt-2 text-sm leading-6 text-muted">{opt.focus}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {cats.map((c) => (
                  <span key={c.id} className="rounded-md bg-surface-2 px-2 py-1 text-[11px] font-medium text-muted">
                    {c.shortName}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted">
                {roles.length} posisi: {roles.map((r) => r.position_name.replace(" Intern", "")).join(", ")}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => spec && onNext()} disabled={!spec}>
          Ke Tahap Berikutnya <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}
