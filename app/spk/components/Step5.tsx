"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import type { PMResult } from "@/lib/profile-matching";
import { ACADEMIC_WEIGHT, PORTFOLIO_WEIGHT } from "@/lib/profile-matching";
import { internships } from "@/lib/data";
import { gapTone, formatGap } from "@/components/GapRuler";
import { cn, formatNumber } from "@/lib/utils";

function GapCell({ gap, weight }: { gap: number; weight: number }) {
  const tone = gapTone(gap);
  return (
    <td className="px-3 py-2 text-right">
      <span className={cn("inline-block min-w-[44px] rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold", tone.soft, tone.text)}>
        {formatGap(gap)}
      </span>
      <span className="ml-2 font-mono text-xs tabular">{formatNumber(weight, 2)}</span>
    </td>
  );
}

export function Step5({
  ranked,
  categories,
  onPrev,
  onNext,
}: {
  ranked: PMResult[];
  categories: { id: string; shortName: string; name: string }[];
  onPrev: () => void;
  onNext: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(ranked[0]?.internshipId ?? null);

  return (
    <section>
      <h1 className="font-display text-3xl font-bold tracking-tight">Detail perhitungan Profile Matching</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        GAP = nilai profil − nilai target. Setiap GAP dikonversi ke bobot nilai (tabel Kusrini, 2007), dirata-ratakan
        per core factor (NCF) dan secondary factor (NSF), lalu digabung menjadi Na dan Np.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs">
        <span className="rounded-md bg-surface-2 px-2 py-1">N = 60% NCF + 40% NSF</span>
        <span className="rounded-md bg-surface-2 px-2 py-1">
          Akhir = {formatNumber(ACADEMIC_WEIGHT, 1)}·Na + {formatNumber(PORTFOLIO_WEIGHT, 1)}·Np
        </span>
        <span className="rounded-md bg-surface-2 px-2 py-1">Kecocokan = Akhir ÷ 5 × 100%</span>
      </div>

      <div className="mt-6 space-y-3">
        {ranked.map((r, idx) => {
          const intern = internships.find((i) => i.id === r.internshipId);
          const open = openId === r.internshipId;
          return (
            <div key={r.internshipId} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <button
                onClick={() => setOpenId(open ? null : r.internshipId)}
                aria-expanded={open}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-surface-2/60"
              >
                <span className={cn("font-mono text-sm font-semibold", idx === 0 ? "text-brand" : "text-muted")}>
                  #{idx + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{intern?.position_name ?? r.internshipId}</span>
                  <span className="block truncate text-xs text-muted">{intern?.company_name}</span>
                </span>
                <span className="hidden font-mono text-xs text-muted sm:block">
                  Na {formatNumber(r.na, 3)} · Np {formatNumber(r.np, 3)} · Akhir {formatNumber(r.finalScore, 3)}
                </span>
                <span className={cn("font-mono text-lg font-semibold tabular", idx === 0 && "text-brand")}>
                  {formatNumber(r.matchPercentage)}%
                </span>
                <ChevronDown size={16} className={cn("text-muted transition", open && "rotate-180")} />
              </button>

              {open && (
                <div className="border-t border-line">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted">
                        <tr>
                          <th className="px-5 py-2 text-left font-semibold">Kompetensi</th>
                          <th className="px-3 py-2 text-left font-semibold">Faktor</th>
                          <th className="px-3 py-2 text-right font-semibold">Target</th>
                          <th className="px-3 py-2 text-right font-semibold">GAP · bobot akademik</th>
                          <th className="px-3 py-2 text-right font-semibold">GAP · bobot portofolio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.breakdown.map((b) => {
                          const cat = categories.find((c) => c.id === b.categoryId);
                          return (
                            <tr key={b.categoryId} className="border-t border-line">
                              <td className="px-5 py-2">{cat?.name ?? b.categoryId}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[11px] font-semibold",
                                    b.factorType === "CORE" ? "bg-ink text-bg" : "bg-surface-2 text-muted",
                                  )}
                                >
                                  {b.factorType === "CORE" ? "Core" : "Secondary"}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-xs">{b.target}</td>
                              <GapCell gap={b.academicGap} weight={b.academicWeight} />
                              <GapCell gap={b.portfolioGap} weight={b.portfolioWeight} />
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <dl className="grid grid-cols-2 gap-px border-t border-line bg-line font-mono text-xs sm:grid-cols-4">
                    {[
                      ["NCF / NSF akademik", `${formatNumber(r.ncfA, 3)} / ${formatNumber(r.nsfA, 3)}`],
                      ["Na", formatNumber(r.na, 3)],
                      ["NCF / NSF portofolio", `${formatNumber(r.ncfP, 3)} / ${formatNumber(r.nsfP, 3)}`],
                      ["Np", formatNumber(r.np, 3)],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-surface px-5 py-3">
                        <dt className="text-muted">{k}</dt>
                        <dd className="mt-0.5 text-sm font-semibold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft size={16} /> Pratinjau
        </Button>
        <Button onClick={onNext}>
          Lihat rekomendasi <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}
