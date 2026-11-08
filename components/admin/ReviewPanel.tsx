"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, PencilLine, AlertTriangle, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Select, Label } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useReferenceData } from "@/components/ReferenceProvider";
import { findCategory, findInternship } from "@/lib/reference";
import { recomputeRanking, reviewAssessment, type ReviewAction } from "@/lib/admin";
import type { SavedAssessmentHistory } from "@/lib/supabase";
import { cn, formatNumber } from "@/lib/utils";

const ACTION_LABEL: Record<string, string> = {
  approve: "Divalidasi",
  correct: "Dikoreksi",
  request_revision: "Diminta perbaikan",
  reopen: "Dibuka ulang",
};

export function ReviewPanel({
  assessment,
  onClose,
  onDone,
}: {
  assessment: SavedAssessmentHistory;
  onClose: () => void;
  onDone: () => Promise<void> | void;
}) {
  const { data: ref } = useReferenceData();
  const [scores, setScores] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(assessment.assessment_details.map((d) => [d.id, d.portfolio_score_admin ?? null])),
  );
  const [override, setOverride] = useState<string>(assessment.override_internship_id ?? "");
  const [note, setNote] = useState(assessment.admin_note ?? "");
  const [busy, setBusy] = useState<ReviewAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const scoresChanged = assessment.assessment_details.some((d) => (d.portfolio_score_admin ?? null) !== scores[d.id]);
  const overrideChanged = (assessment.override_internship_id ?? "") !== override;

  // Pratinjau peringkat: dihitung ulang kalau admin mengubah skor portofolio
  const preview = useMemo(() => {
    const ranked = scoresChanged ? recomputeRanking(assessment, ref, scores) : null;
    if (ranked) return ranked.map((r, i) => ({ id: r.internshipId, pct: r.matchPercentage, rank: i + 1 }));
    return [...assessment.recommendation_results]
      .sort((a, b) => a.rank_position - b.rank_position)
      .map((r) => ({ id: r.internship_id, pct: Number(r.match_percentage), rank: r.rank_position }));
  }, [assessment, ref, scores, scoresChanged]);

  const candidates = assessment.recommendation_results.map((r) => findInternship(ref, r.internship_id)).filter(Boolean);
  const spec = assessment.specialization_id === "spec_sage" ? "SAGE" : "DELTA";

  async function run(action: ReviewAction) {
    setBusy(action);
    setError(null);
    setSuccess(null);
    const res = await reviewAssessment({
      assessment,
      action,
      note,
      overrideInternshipId: override || null,
      scoreOverrides: action === "correct" ? scores : {},
      ref,
    });
    setBusy(null);
    if (!res.success) {
      setError(res.error ?? "Perubahan belum tersimpan.");
      return;
    }
    setSuccess(
      action === "approve"
        ? "Hasil divalidasi."
        : action === "correct"
          ? "Koreksi tersimpan dan peringkat sudah dihitung ulang."
          : action === "request_revision"
            ? "Mahasiswa akan melihat catatan perbaikanmu di riwayatnya."
            : "Status dikembalikan ke menunggu pemeriksaan.",
    );
    await onDone();
  }

  const canCorrect = (scoresChanged || overrideChanged) && note.trim().length > 0;

  return (
    <aside className="rounded-2xl border border-line bg-surface">
      <header className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-display text-lg font-semibold">
              {assessment.student_name || assessment.student_email || "Mahasiswa tanpa nama"}
            </h2>
            <StatusBadge status={assessment.status ?? "pending"} />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">
            {assessment.student_email ?? `ID ${assessment.user_id?.slice(0, 8) ?? "-"}`} · {spec} ·{" "}
            {new Date(assessment.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <button onClick={onClose} aria-label="Tutup detail" className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-ink">
          <X size={18} />
        </button>
      </header>

      <div className="space-y-6 p-5">
        {/* Skor per kategori + koreksi */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Profil kompetensi & penilaian AI</h3>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
            {assessment.assessment_details.map((d) => {
              const cat = findCategory(ref, d.competency_category_id);
              return (
                <li key={d.id} className="p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="min-w-0 flex-1 font-semibold">{cat?.name ?? d.competency_category_id}</span>
                    <span className="font-mono text-xs text-muted">akd {formatNumber(Number(d.academic_score))}</span>
                    <span className="font-mono text-xs text-muted">AI {d.portfolio_score_ai ?? "–"}</span>
                    <Select
                      aria-label={`Skor portofolio ${cat?.name ?? ""}`}
                      className="h-8 w-auto py-0 text-xs"
                      value={scores[d.id] ?? ""}
                      onChange={(e) =>
                        setScores((prev) => ({ ...prev, [d.id]: e.target.value ? Number(e.target.value) : null }))
                      }
                    >
                      <option value="">Ikuti AI</option>
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          Koreksi: {n}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {d.ai_reasoning && <p className="mt-1.5 text-xs leading-relaxed text-muted">AI: {d.ai_reasoning}</p>}
                  {d.portfolio_essay && (
                    <details className="mt-1.5 text-xs">
                      <summary className="cursor-pointer font-semibold text-muted hover:text-ink">Baca cerita mahasiswa</summary>
                      <p className="mt-1 whitespace-pre-line leading-relaxed">{d.portfolio_essay}</p>
                    </details>
                  )}
                  {d.evidence_url && (
                    <a
                      href={d.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-data hover:underline"
                    >
                      <ExternalLink size={12} /> Bukti
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Peringkat */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Peringkat {scoresChanged ? "setelah koreksi (pratinjau)" : "saat ini"}
          </h3>
          <ol className="mt-2 divide-y divide-line rounded-xl border border-line">
            {preview.map((r) => {
              const intern = findInternship(ref, r.id);
              return (
                <li key={r.id} className={cn("flex items-center gap-3 px-3 py-2 text-sm", override === r.id && "bg-data-soft")}>
                  <span className="w-6 font-mono text-xs text-muted">#{r.rank}</span>
                  <span className="min-w-0 flex-1 truncate">{intern?.position_name ?? r.id}</span>
                  <span className="font-mono text-xs font-semibold tabular">{formatNumber(r.pct)}%</span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Keputusan */}
        <section className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="override">Rekomendasi akhir</Label>
            <Select id="override" value={override} onChange={(e) => setOverride(e.target.value)}>
              <option value="">Ikuti peringkat #1 dari sistem</option>
              {candidates.map((i) => (
                <option key={i!.id} value={i!.id}>
                  Ganti ke: {i!.position_name} ({i!.company_name})
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Catatan untuk mahasiswa</Label>
            <Textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Wajib diisi kalau kamu mengoreksi atau meminta perbaikan. Contoh: Bukti proyek web belum bisa dibuka, skor portofolio diturunkan ke 2."
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-brand/30 bg-brand-soft p-3 text-sm text-brand">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="rounded-lg border border-ok/30 bg-ok-soft p-3 text-sm text-ok">
              {success}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => run("approve")} disabled={!!busy || scoresChanged || overrideChanged}>
              {busy === "approve" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Validasi
            </Button>
            <Button variant="secondary" onClick={() => run("correct")} disabled={!!busy || !canCorrect}>
              {busy === "correct" ? <Loader2 size={16} className="animate-spin" /> : <PencilLine size={16} />} Simpan koreksi
            </Button>
            <Button variant="outline" onClick={() => run("request_revision")} disabled={!!busy || !note.trim()}>
              {busy === "request_revision" ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}{" "}
              Minta perbaikan
            </Button>
            {assessment.status && assessment.status !== "pending" && (
              <Button variant="ghost" onClick={() => run("reopen")} disabled={!!busy}>
                <RotateCcw size={16} /> Buka ulang
              </Button>
            )}
          </div>
          {(scoresChanged || overrideChanged) && (
            <p className="text-xs text-muted">
              Ada perubahan yang belum disimpan. Tulis alasannya, lalu tekan Simpan koreksi.
            </p>
          )}
        </section>

        {/* Riwayat pemeriksaan (UC-12 langkah 5) */}
        {assessment.review_logs && assessment.review_logs.length > 0 && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Riwayat pemeriksaan</h3>
            <ol className="mt-2 space-y-2 border-l border-line pl-4">
              {[...assessment.review_logs]
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .map((log) => (
                  <li key={log.id} className="text-xs">
                    <p>
                      <b>{ACTION_LABEL[log.action] ?? log.action}</b>{" "}
                      <span className="text-muted">
                        {new Date(log.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </p>
                    {log.note && <p className="mt-0.5 text-muted">{log.note}</p>}
                  </li>
                ))}
            </ol>
          </section>
        )}
      </div>
    </aside>
  );
}
