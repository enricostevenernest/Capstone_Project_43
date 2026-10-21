"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarRanking } from "@/components/BarRanking";
import { GapRuler } from "@/components/GapRuler";
import { AuthModal } from "@/components/AuthModal";
import { ExternalLink, CloudUpload, Loader2, CheckCircle2, Printer, RotateCcw, ArrowLeft } from "lucide-react";
import { internships } from "@/lib/data";
import { allTargets } from "@/lib/allTargets";
import type { PMResult } from "@/lib/profile-matching";
import { ACADEMIC_WEIGHT, PORTFOLIO_WEIGHT } from "@/lib/profile-matching";
import type { SpecializationCode } from "@/lib/types";
import { supabase, saveAssessmentToSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { cn, formatNumber } from "@/lib/utils";

interface Step6Props {
  ranked: PMResult[];
  categories: { id: string; name: string; shortName: string }[];
  academicScores: Record<string, number>;
  portfolioScores: Record<string, number>;
  spec?: SpecializationCode;
  essays?: Record<string, string>;
  evidences?: Record<string, string>;
  reasonings?: Record<string, string>;
  onPrev: () => void;
  onRestart: () => void;
}

export function Step6({
  ranked,
  categories,
  academicScores,
  portfolioScores,
  spec = "SAGE",
  essays = {},
  evidences = {},
  reasonings = {},
  onPrev,
  onRestart,
}: Step6Props) {
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, [configured]);

  const top = ranked[0];
  if (!top) return null;

  const topIntern = internships.find((i) => i.id === top.internshipId)!;
  const barData = ranked.map((r) => ({
    name: internships.find((i) => i.id === r.internshipId)?.position_name.replace(" Intern", "") ?? r.internshipId,
    percentage: r.matchPercentage,
  }));
  const topTargets = allTargets.filter((t) => t.internshipId === top.internshipId);

  /** Simpan ke Supabase. Tidak bergantung pada state `user` agar aman dipanggil tepat setelah login. */
  async function performSave() {
    setSaving(true);
    setSaveError(null);

    const details = categories.map((cat) => ({
      categoryId: cat.id,
      academicScore: academicScores[cat.id] ?? 0,
      portfolioEssay: essays[cat.id],
      evidenceUrl: evidences[cat.id],
      portfolioScoreAi: portfolioScores[cat.id],
      aiReasoning: reasonings[cat.id],
    }));

    const result = await saveAssessmentToSupabase({
      specializationId: spec === "SAGE" ? "spec_sage" : "spec_delta",
      academicWeight: ACADEMIC_WEIGHT,
      portfolioWeight: PORTFOLIO_WEIGHT,
      details,
      recommendations: ranked,
    });

    setSaving(false);

    if (result.success && result.assessmentId) {
      setSavedId(result.assessmentId);
    } else {
      setSaveError(result.error || "Gagal menyimpan ke Supabase.");
    }
  }

  function handleSave() {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    performSave();
  }

  return (
    <section className="space-y-6">
      {/* Rekomendasi utama */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Rekomendasi utama · {spec}</p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{topIntern.position_name}</h1>
            <p className="mt-1 text-muted">
              {topIntern.company_name} · {topIntern.description}
            </p>
            <a
              href={topIntern.vacancy_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline print:hidden"
            >
              <ExternalLink size={14} /> Buka halaman lowongan
            </a>
          </div>
          <div className="lg:text-right">
            <div className="font-display text-6xl font-bold leading-none tracking-tight tabular sm:text-7xl">
              {formatNumber(top.matchPercentage, 1)}
              <span className="text-3xl text-muted">%</span>
            </div>
            <p className="mt-2 font-mono text-xs text-muted">
              kecocokan · nilai akhir {formatNumber(top.finalScore, 3)} / 5
            </p>
          </div>
        </div>
        <div className="h-1.5 bg-surface-2">
          <div className="h-full bg-brand" style={{ width: `${Math.min(top.matchPercentage, 100)}%` }} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profil vs target */}
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold">Profil Anda vs kebutuhan posisi ini</h2>
          <p className="mt-1 text-xs text-muted">
            Garis tegak = target posisi. Titik = nilai Anda. Angka di kanan = GAP.
          </p>
          <div className="mt-5 space-y-5">
            {categories.map((cat) => {
              const t = topTargets.find((x) => x.competency_category_id === cat.id);
              if (!t) return null;
              return (
                <div key={cat.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">{cat.name}</span>
                    <span className="font-mono text-[11px] text-muted">
                      target {t.target_score} · {t.factor_type === "CORE" ? "core" : "secondary"}
                    </span>
                  </div>
                  <GapRuler
                    target={t.target_score}
                    lanes={[
                      { label: "Akademik", value: academicScores[cat.id] ?? 0 },
                      { label: "Portofolio", value: portfolioScores[cat.id] ?? 1 },
                    ]}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Ranking */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">Peringkat kecocokan</h2>
            <BarRanking data={barData} />
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {ranked.map((r, idx) => {
              const intern = internships.find((i) => i.id === r.internshipId)!;
              return (
                <div
                  key={r.internshipId}
                  className={cn("flex items-center gap-4 px-5 py-3.5", idx > 0 && "border-t border-line")}
                >
                  <span className={cn("font-mono text-sm font-semibold", idx === 0 ? "text-brand" : "text-muted")}>
                    #{idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{intern.position_name}</div>
                    <div className="truncate text-xs text-muted">{intern.company_name}</div>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular">{formatNumber(r.matchPercentage)}%</span>
                  <a
                    href={intern.vacancy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Buka lowongan ${intern.position_name}`}
                    className="rounded-md p-1 text-muted transition hover:bg-surface-2 hover:text-ink print:hidden"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted">
        Rekomendasi ini adalah bahan pertimbangan. Keputusan akhir tetap di tangan Anda dan tidak menjamin penerimaan di
        tempat magang tersebut.
      </p>

      {saveError && (
        <div role="alert" className="rounded-lg border border-brand/30 bg-brand-soft p-3 text-sm text-brand">
          {saveError}
        </div>
      )}

      {savedId && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ok/30 bg-ok-soft p-3 text-sm text-ok">
          <span className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 size={16} /> Hasil tersimpan di akun Anda.
          </span>
          <Link href="/history" className="font-semibold underline">
            Buka riwayat
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft size={16} /> Detail perhitungan
        </Button>
        <Button variant="outline" onClick={onRestart}>
          <RotateCcw size={16} /> Mulai ulang
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer size={16} /> Cetak hasil
        </Button>
        {!savedId && (
          <Button onClick={handleSave} disabled={saving} className="sm:ml-auto">
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Menyimpan…
              </>
            ) : (
              <>
                <CloudUpload size={16} /> Simpan ke riwayat
              </>
            )}
          </Button>
        )}
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          performSave();
        }}
      />
    </section>
  );
}
