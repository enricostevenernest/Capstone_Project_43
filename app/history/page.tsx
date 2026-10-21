"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, ExternalLink, Loader2, LogIn, ArrowRight, MessageSquareText } from "lucide-react";
import {
  getStudentAssessmentHistory,
  SavedAssessmentHistory,
  supabase,
  isSupabaseConfigured,
  effectivePortfolioScore,
} from "@/lib/supabase";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useReferenceData } from "@/components/ReferenceProvider";
import { findCategory, findInternship } from "@/lib/reference";
import { cn, formatNumber } from "@/lib/utils";

function EmptyState({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
      <div className="mt-5 flex justify-center">{action}</div>
    </div>
  );
}

export default function HistoryPage() {
  const configured = isSupabaseConfigured();
  const { data: ref } = useReferenceData();
  const [history, setHistory] = useState<SavedAssessmentHistory[]>([]);
  const [authReady, setAuthReady] = useState(!configured);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getStudentAssessmentHistory();
    if (res.error) {
      setError(res.error);
    } else {
      setHistory(res.data);
      setExpandedId(res.data[0]?.id ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!configured) return;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
      if (session?.user) {
        // Ditunda agar tidak memanggil Supabase di dalam callback auth (menghindari deadlock)
        setTimeout(loadHistory, 0);
      } else {
        setHistory([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [configured, loadHistory]);

  const getInternship = (id: string | null | undefined) => findInternship(ref, id);
  const getCategory = (id: string) => findCategory(ref, id);

  let content: React.ReactNode;
  if (!configured) {
    content = (
      <div className="rounded-2xl border border-warn/30 bg-warn-soft p-5 text-sm text-warn">
        <p className="font-semibold">Database belum tersambung</p>
        <p className="mt-1 text-xs">
          Isi <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di <code className="font-mono">.env.local</code>.
        </p>
      </div>
    );
  } else if (!authReady || (user && loading && history.length === 0)) {
    content = (
      <div className="flex flex-col items-center gap-2 py-20 text-muted">
        <Loader2 size={22} className="animate-spin" />
        <p className="text-xs">Mengambil riwayatmu…</p>
      </div>
    );
  } else if (!user) {
    content = (
      <EmptyState
        title="Silakan Masuk Terlebih Dahulu"
        body="Riwayat disimpan per akun. Pakai akun yang sama dengan saat kamu menyimpan hasil penilaian."
        action={
          <Button onClick={() => setIsAuthOpen(true)}>
            <LogIn size={16} /> Masuk atau daftar
          </Button>
        }
      />
    );
  } else if (error) {
    content = (
      <div role="alert" className="rounded-2xl border border-brand/30 bg-brand-soft p-5 text-sm text-brand">
        Riwayatmu belum bisa diambil ({error}).
        <button onClick={loadHistory} className="ml-2 font-semibold underline">
          Coba lagi
        </button>
      </div>
    );
  } else if (history.length === 0) {
    content = (
      <EmptyState
        title="Belum Ada Riwayat Tersimpan"
        body="Selesaikan penilaian sampai langkah terakhir, lalu tekan Simpan ke riwayat. Hasilnya muncul di sini dan bisa kamu buka kapan saja."
        action={
          <Link
            href="/spk"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand"
          >
            Mulai penilaian <ArrowRight size={16} />
          </Link>
        }
      />
    );
  } else {
    content = (
      <div className="space-y-3">
        {history.map((item) => {
          const isExpanded = expandedId === item.id;
          const dateStr = new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const specCode = item.specialization_id === "spec_sage" ? "SAGE" : "DELTA";
          const sortedRecs = [...(item.recommendation_results || [])].sort((a, b) => a.rank_position - b.rank_position);
          const topRec = sortedRecs[0];
          const overrideIntern = getInternship(item.override_internship_id);
          const topIntern = overrideIntern ?? (topRec ? getInternship(topRec.internship_id) : null);

          return (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                aria-expanded={isExpanded}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-surface-2/60"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold">{topIntern?.position_name ?? "Penilaian magang"}</span>
                    <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] font-semibold">
                      {specCode}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted">
                    {dateStr}
                    {topIntern ? ` · ${topIntern.company_name}` : ""}
                  </div>
                </div>
                {topRec && !overrideIntern && (
                  <span className="font-mono text-lg font-semibold text-brand tabular">
                    {formatNumber(Number(topRec.match_percentage), 1)}%
                  </span>
                )}
                <span className="hidden text-xs font-semibold text-muted sm:inline">
                  {isExpanded ? "Tutup Detail" : "Lihat Detail"}
                </span>
                <ChevronDown size={16} className={cn("text-muted transition", isExpanded && "rotate-180")} />
              </button>

              {isExpanded && (
                <div className="grid gap-6 border-t border-line p-5 lg:grid-cols-2">
                  {(item.admin_note || overrideIntern) && (
                    <div className="rounded-xl border border-data/30 bg-data-soft p-4 text-sm lg:col-span-2">
                      <p className="flex items-center gap-1.5 font-semibold text-data">
                        <MessageSquareText size={16} /> Catatan dari admin program studi
                      </p>
                      {overrideIntern && (
                        <p className="mt-2">
                          Rekomendasi akhir diganti menjadi <b>{overrideIntern.position_name}</b> di{" "}
                          {overrideIntern.company_name}.
                        </p>
                      )}
                      {item.admin_note && <p className="mt-1 leading-relaxed">{item.admin_note}</p>}
                      {item.reviewed_at && (
                        <p className="mt-2 text-xs text-muted">
                          Diperiksa{" "}
                          {new Date(item.reviewed_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Peringkat posisi</h3>
                    <ol className="mt-2 divide-y divide-line">
                      {sortedRecs.map((rec) => {
                        const intern = getInternship(rec.internship_id);
                        if (!intern) return null;
                        return (
                          <li key={rec.id} className="flex items-center gap-3 py-2 text-sm">
                            <span className="w-6 font-mono text-xs text-muted">#{rec.rank_position}</span>
                            <span className="min-w-0 flex-1 truncate">{intern.position_name}</span>
                            <span className="hidden font-mono text-[11px] text-muted sm:inline">
                              Na {formatNumber(Number(rec.na_score))} · Np {formatNumber(Number(rec.np_score))}
                            </span>
                            <span className="w-14 text-right font-mono text-xs font-semibold tabular">
                              {formatNumber(Number(rec.match_percentage), 1)}%
                            </span>
                            {intern.vacancy_url && <a
                              href={intern.vacancy_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Buka lowongan ${intern.position_name}`}
                              className="text-muted hover:text-ink"
                            >
                              <ExternalLink size={14} />
                            </a>}
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  {item.assessment_details?.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                        Skor kompetensi
                      </h3>
                      <ul className="mt-2 divide-y divide-line">
                        {item.assessment_details.map((det) => {
                          const cat = getCategory(det.competency_category_id);
                          return (
                            <li key={det.id} className="py-2 text-sm">
                              <div className="flex items-baseline justify-between gap-3">
                                <span>{cat ? cat.name : det.competency_category_id}</span>
                                <span className="shrink-0 font-mono text-xs">
                                  {formatNumber(Number(det.academic_score))}
                                  <span className="text-muted"> akd</span> ·{" "}
                                  <span className="font-semibold text-data">{effectivePortfolioScore(det)}</span>
                                  <span className="text-muted"> port</span>
                                  {det.portfolio_score_admin != null && det.portfolio_score_admin !== det.portfolio_score_ai && (
                                    <span className="text-muted"> (AI: {det.portfolio_score_ai ?? "–"})</span>
                                  )}
                                </span>
                              </div>
                              {det.ai_reasoning && (
                                <p className="mt-0.5 text-xs leading-relaxed text-muted">{det.ai_reasoning}</p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Riwayat rekomendasi</h1>
            <p className="mt-1 text-sm text-muted">Semua hasil yang pernah kamu simpan, yang terbaru paling atas.</p>
          </div>
          {user && history.length > 0 && (
            <Link
              href="/spk"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-semibold transition hover:bg-surface-2"
            >
              Penilaian baru <ArrowRight size={16} />
            </Link>
          )}
        </div>
        {content}
      </main>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
