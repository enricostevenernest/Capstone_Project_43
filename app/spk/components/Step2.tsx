"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { gradeOptions, gradeToScale, type GradeLetter } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

export function Step2({
  categories,
  coursesForSpec,
  grades,
  setGrades,
  academicScores,
  onPrev,
  onNext,
  canNext,
}: {
  categories: { id: string; name: string; shortName: string }[];
  coursesForSpec: { id: string; competency_category_id: string; code: string; name: string }[];
  grades: Record<string, GradeLetter>;
  setGrades: (fn: (p: Record<string, GradeLetter>) => Record<string, GradeLetter>) => void;
  academicScores: Record<string, number>;
  onPrev: () => void;
  onNext: () => void;
  canNext: boolean;
}) {
  const filled = coursesForSpec.filter((c) => grades[c.id]).length;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Berapa nilaimu di mata kuliah ini?</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Buka transkripmu dan pilih nilai huruf yang tertera. Sistem mengubahnya ke nilai mutu Telkom University,
            dari A = 4,00 sampai E = 0,00.
          </p>
        </div>
        <span className="font-mono text-sm text-muted">
          <span className="font-semibold text-ink">{filled}</span>/{coursesForSpec.length} terisi
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
        {categories.map((cat, idx) => {
          const cs = coursesForSpec.filter((c) => c.competency_category_id === cat.id);
          const score = academicScores[cat.id] ?? 0;
          const complete = cs.every((c) => grades[c.id]);
          return (
            <div
              key={cat.id}
              className={`grid items-center gap-3 p-4 sm:grid-cols-[1fr_220px_88px] sm:gap-6 sm:px-6 ${idx > 0 ? "border-t border-line" : ""}`}
            >
              <div>
                <div className="text-sm font-semibold">{cat.name}</div>
                {cs.map((co) => (
                  <div key={co.id} className="text-xs text-muted">
                    <span className="font-mono">{co.code}</span> · {co.name}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {cs.map((co) => (
                  <Select
                    key={co.id}
                    aria-label={`Nilai ${co.name}`}
                    value={grades[co.id] || ""}
                    onChange={(e) =>
                      setGrades((prev) => ({ ...prev, [co.id]: e.target.value as GradeLetter }))
                    }
                  >
                    <option value="">Pilih nilai</option>
                    {gradeOptions.map((g) => (
                      <option key={g} value={g}>
                        {g} ({formatNumber(gradeToScale[g])})
                      </option>
                    ))}
                  </Select>
                ))}
              </div>
              <div className="text-right font-mono">
                <div className={`text-lg font-semibold tabular ${complete ? "" : "text-muted/50"}`}>
                  {complete ? formatNumber(score) : "–"}
                </div>
                <div className="text-[10px] text-muted">/ 4,00</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft size={16} /> Ganti peminatan
        </Button>
        <div className="flex items-center gap-3">
          {!canNext && <span className="text-xs text-muted">Masih ada nilai yang kosong.</span>}
          <Button onClick={onNext} disabled={!canNext}>
            Lanjut ke portofolio <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </section>
  );
}
