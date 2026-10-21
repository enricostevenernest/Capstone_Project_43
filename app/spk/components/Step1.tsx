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
  spec: SpecializationCode;
  setSpec: (s: SpecializationCode) => void;
  onNext: () => void;
}) {
  return (
    <section>
      <h1 className="font-display text-3xl font-bold tracking-tight">Pilih peminatan Anda</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Peminatan menjadi penyaring awal: hanya kategori kompetensi dan posisi magang dari peminatan ini yang
        dibandingkan dengan profil Anda.
      </p>

      <div role="radiogroup" aria-label="Peminatan" className="mt-6 grid gap-4 md:grid-cols-2">
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
                "relative rounded-2xl border bg-surface p-6 text-left transition",
                selected ? "border-brand ring-2 ring-brand/20" : "border-line hover:border-muted/50",
              )}
            >
              <span
                className={cn(
                  "absolute right-5 top-5 grid h-6 w-6 place-items-center rounded-full border",
                  selected ? "border-brand bg-brand text-on-brand" : "border-line",
                )}
              >
                {selected && <Check size={14} strokeWidth={3} />}
              </span>
              <div className="font-display text-3xl font-bold tracking-tight">{opt.code}</div>
              <div className="mt-1 pr-8 text-sm font-medium">{opt.title}</div>
              <p className="mt-2 text-sm text-muted">{opt.focus}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {cats.map((c) => (
                  <span key={c.id} className="rounded-md bg-surface-2 px-2 py-1 text-xs">{c.shortName}</span>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted">
                {roles.length} posisi: {roles.map((r) => r.position_name.replace(" Intern", "")).join(", ")}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onNext}>
          Lanjut ke nilai <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}
