"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarRanking } from "@/components/BarRanking";
import { GapRuler } from "@/components/GapRuler";
import { AuthModal } from "@/components/AuthModal";
import { InternshipDetail } from "@/components/InternshipDetail";
import { useReferenceData } from "@/components/ReferenceProvider";
import {
  ExternalLink,
  CloudUpload,
  Loader2,
  CheckCircle2,
  Printer,
  RotateCcw,
  ArrowLeft,
  BookOpen,
  Hammer,
  Info,
} from "lucide-react";
import { findInternship } from "@/lib/reference";
import type { PMResult } from "@/lib/profile-matching";
import { ACADEMIC_WEIGHT, PORTFOLIO_WEIGHT } from "@/lib/profile-matching";
import type { Internship, SpecializationCode } from "@/lib/types";
import { supabase, saveAssessmentToSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { categorySuggestions } from "@/lib/suggestions";
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
  const { data: ref } = useReferenceData();
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [detail, setDetail] = useState<Internship | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, [configured]);

  const top = ranked[0];
  if (!top) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
        Belum ada posisi aktif untuk peminatan ini. Hubungi admin program studi.
      </div>
    );
  }

  const topIntern = findInternship(ref, top.internshipId);
  const barData = ranked.map((r) => ({
    name: findInternship(ref, r.internshipId)?.position_name.replace(" Intern", "") ?? r.internshipId,
    percentage: r.matchPercentage,
  }));
  const topTargets = ref.targets.filter((t) => t.internship_id === top.internshipId);

  // Kategori yang masih di bawah target posisi teratas, diurutkan dari yang paling jauh
  const gaps = categories
    .map((cat) => {
      const t = topTargets.find((x) => x.competency_category_id === cat.id);
      if (!t) return null;
      const academicGap = (academicScores[cat.id] ?? 0) - t.target_score;
      const portfolioGap = (portfolioScores[cat.id] ?? 1) - t.target_score;
      return { cat, target: t, academicGap, portfolioGap, worst: Math.min(academicGap, portfolioGap) };
    })
    .filter((g): g is NonNullable<typeof g> => !!g && g.worst < 0)
    .sort((a, b) => (a.target.factor_type === b.target.factor_type ? a.worst - b.worst : a.target.factor_type === "CORE" ? -1 : 1))
    .slice(0, 3);

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
      setSaveError(result.error || "Hasilnya belum tersimpan. Coba sekali lagi.");
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Paling cocok untukmu · {spec}</p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {topIntern?.position_name ?? top.internshipId}
            </h1>
            <p className="mt-1 text-muted">
              {topIntern?.company_name}
              {topIntern?.description ? ` · ${topIntern.description}` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 print:hidden">
              {topIntern?.vacancy_url && (
                <a
                  href={topIntern.vacancy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                >
                  <ExternalLink size={14} /> Lihat lowongannya
                </a>
              )}
              {topIntern && (
                <button
                  onClick={() => setDetail(topIntern)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
                >
                  <Info size={14} /> Apa yang dicari posisi ini?
                </button>
              )}
            </div>
          </div>
          <div className="lg:text-right">
            <div className="font-display text-6xl font-bold leading-none tracking-tight tabular sm:text-7xl">
              {formatNumber(top.matchPercentage, 1)}
              <span className="text-3xl text-muted">%</span>
            </div>
            <p className="mt-2 font-mono text-xs text-muted">
              cocok · nilai akhir {formatNumber(top.finalScore, 3)} dari 5
            </p>
          </div>
        </div>
        <div className="h-1.5 bg-surface-2">
          <div className="h-full bg-brand" style={{ width: `${Math.min(top.matchPercentage, 100)}%` }} />
        </div>
      </div>

      {/* Saran pengembangan */}
      {gaps.length > 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold">Biar makin siap, mulai dari sini</h2>
          <p className="mt-1 text-sm text-muted">
            Ada {gaps.length} kompetensi yang masih di bawah kebutuhan {topIntern?.position_name ?? "posisi ini"}. Yang
            ditandai utama paling berpengaruh ke skormu.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {gaps.map(({ cat, target, academicGap, portfolioGap }) => {
              const tip = categorySuggestions[cat.id];
              return (
                <div key={cat.id} className="rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold">{cat.name}</h3>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        target.factor_type === "CORE" ? "bg-ink text-bg" : "bg-surface-2 text-muted",
                      )}
                    >
                      {target.factor_type === "CORE" ? "Utama" : "Pendukung"}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted">
                    {academicGap < 0 && (
                      <li className="flex gap-2">
                        <BookOpen size={14} className="mt-0.5 shrink-0 text-brand" />
                        <span>{tip?.study ?? "Perdalam lagi materi mata kuliah ini."}</span>
                      </li>
                    )}
                    {portfolioGap < 0 && (
                      <li className="flex gap-2">
                        <Hammer size={14} className="mt-0.5 shrink-0 text-brand" />
                        <span>{tip?.build ?? "Tambahkan satu proyek nyata di kategori ini."}</span>
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-ok/30 bg-ok-soft p-5 text-sm text-ok">
          Semua kompetensimu sudah memenuhi target {topIntern?.position_name ?? "posisi ini"}. Tinggal siapkan CV dan
          kirim lamaranmu.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profil vs target */}
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold">Kamu dibanding kebutuhan posisi</h2>
          <p className="mt-1 text-xs text-muted">
            Garis tegak adalah target posisi, titik adalah nilaimu. Angka di kanan menunjukkan selisihnya.
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
                      target {t.target_score} · {t.factor_type === "CORE" ? "utama" : "pendukung"}
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
            <h2 className="font-display text-lg font-semibold">Urutan kecocokan</h2>
            <BarRanking data={barData} />
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {ranked.map((r, idx) => {
              const intern = findInternship(ref, r.internshipId);
              return (
                <div key={r.internshipId} className={cn("flex items-center gap-4 px-5 py-3.5", idx > 0 && "border-t border-line")}>
                  <span className={cn("font-mono text-sm font-semibold", idx === 0 ? "text-brand" : "text-muted")}>
                    #{idx + 1}
                  </span>
                  <button
                    onClick={() => intern && setDetail(intern)}
                    className="min-w-0 flex-1 text-left hover:underline"
                    aria-label={`Detail ${intern?.position_name ?? r.internshipId}`}
                  >
                    <div className="truncate text-sm font-semibold">{intern?.position_name ?? r.internshipId}</div>
                    <div className="truncate text-xs text-muted">{intern?.company_name}</div>
                  </button>
                  <span className="font-mono text-sm font-semibold tabular">{formatNumber(r.matchPercentage)}%</span>
                  {intern?.vacancy_url && (
                    <a
                      href={intern.vacancy_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Buka lowongan ${intern.position_name}`}
                      className="rounded-md p-1 text-muted transition hover:bg-surface-2 hover:text-ink print:hidden"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted">
        Hasil ini bahan pertimbangan, bukan keputusan akhir. Pilihan tetap di tanganmu, dan sistem tidak menjamin kamu
        diterima di tempat tersebut.
      </p>

      {saveError && (
        <div role="alert" className="rounded-lg border border-brand/30 bg-brand-soft p-3 text-sm text-brand">
          {saveError}
        </div>
      )}

      {savedId && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ok/30 bg-ok-soft p-3 text-sm text-ok">
          <span className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 size={16} /> Tersimpan. Admin program studi akan memeriksanya.
          </span>
          <Link href="/history" className="font-semibold underline">
            Buka riwayat
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft size={16} /> Lihat hitungannya
        </Button>
        <Button variant="outline" onClick={onRestart}>
          <RotateCcw size={16} /> Ulangi dari Awal
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer size={16} /> Cetak Hasil
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

      <InternshipDetail internship={detail} onClose={() => setDetail(null)} />
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
