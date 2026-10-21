"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import type { SpecializationCode } from "@/lib/types";
import { activeInternshipsFor, categoriesFor } from "@/lib/reference";
import { useReferenceData } from "@/components/ReferenceProvider";
import { cn } from "@/lib/utils";

const OPTIONS: { code: SpecializationCode; title: string; focus: string }[] = [
  {
    code: "SAGE",
    title: "Software and IT Governance Engineering",
    focus: "Buat kamu yang senang membangun aplikasi atau mengatur bagaimana TI dikelola di sebuah organisasi.",
  },
  {
    code: "DELTA",
    title: "Data Exploration, Learning & Translational Analytics",
    focus: "Buat kamu yang suka mengulik data, membangun model, lalu mengubah angka jadi keputusan bisnis.",
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
  const { data } = useReferenceData();

  return (
    <section>
      <h1 className="font-display text-3xl font-bold tracking-tight">Kamu ambil peminatan apa?</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Pilihan ini menentukan mata kuliah yang ditanyakan dan posisi magang yang dibandingkan dengan profilmu. Kalau
        salah pilih, kamu bisa kembali ke sini kapan saja.
      </p>

      <div role="radiogroup" aria-label="Peminatan" className="mt-6 grid gap-4 md:grid-cols-2">
        {OPTIONS.map((opt) => {
          const selected = spec === opt.code;
          const cats = categoriesFor(data, opt.code);
          const roles = activeInternshipsFor(data, opt.code);
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
                {roles.length} posisi dibandingkan: {roles.map((r) => r.position_name.replace(" Intern", "")).join(", ")}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onNext}>
          Ke tahap berikutnya <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}
