"use client";
import { useState, useMemo } from "react";
import { competencyCategories, courses, gradeToScale, internships } from "@/lib/data";
import type { SpecializationCode, GradeLetter } from "@/lib/data";
import { allTargets } from "@/lib/allTargets";
import { rankInternships } from "@/lib/profile-matching";
import { cn, isValidUrl } from "@/lib/utils";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Step1 } from "./components/Step1";
import { Step2 } from "./components/Step2";
import { Step3 } from "./components/Step3";
import { Step4 } from "./components/Step4";
import { Step5 } from "./components/Step5";
import { Step6 } from "./components/Step6";

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type RecordUpdater<T> = (fn: (p: Record<string, T>) => Record<string, T>) => void;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Peminatan" },
  { n: 2, label: "Nilai" },
  { n: 3, label: "Portofolio" },
  { n: 4, label: "Pratinjau" },
  { n: 5, label: "Perhitungan" },
  { n: 6, label: "Rekomendasi" },
];

const specIdOf = (code: SpecializationCode) => (code === "SAGE" ? "spec_sage" : "spec_delta");

export default function SPKPage() {
  const [spec, setSpec] = useState<SpecializationCode>("SAGE");
  const [step, setStep] = useState<Step>(1);
  const [maxStep, setMaxStep] = useState<Step>(1);
  const [grades, setGrades] = useState<Record<string, GradeLetter>>({});
  const [essays, setEssays] = useState<Record<string, string>>({});
  const [evidences, setEvidences] = useState<Record<string, string>>({});
  const [portfolioScores, setPortfolioScores] = useState<Record<string, number>>({});
  const [reasonings, setReasonings] = useState<Record<string, string>>({});
  const [evaluating, setEvaluating] = useState(false);
  const [evalMode, setEvalMode] = useState<string>("");
  const [evalError, setEvalError] = useState<string | null>(null);

  const categories = useMemo(
    () => competencyCategories.filter((c) => c.specialization_id === specIdOf(spec)),
    [spec],
  );
  const coursesForSpec = useMemo(
    () => courses.filter((c) => categories.some((cat) => cat.id === c.competency_category_id)),
    [categories],
  );
  const internshipsForSpec = useMemo(
    () => internships.filter((i) => i.specialization_id === specIdOf(spec)),
    [spec],
  );

  const academicScores = useMemo(() => {
    const m: Record<string, number> = {};
    for (const cat of categories) {
      const cs = coursesForSpec.filter((c) => c.competency_category_id === cat.id);
      const vals = cs.map((c) => (grades[c.id] ? gradeToScale[grades[c.id]] : 0));
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      m[cat.id] = Number(avg.toFixed(2));
    }
    return m;
  }, [categories, coursesForSpec, grades]);

  const gradesComplete = coursesForSpec.every((c) => grades[c.id]);
  const invalidEvidence = categories
    .filter((cat) => (evidences[cat.id] || "").trim() && !isValidUrl(evidences[cat.id]))
    .map((cat) => cat.id);

  function goTo(n: Step) {
    setStep(n);
    setMaxStep((m) => (n > m ? n : m));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function canOpen(n: Step) {
    if (n > maxStep) return false;
    if (n >= 3 && !gradesComplete) return false;
    return true;
  }

  /** Hasil evaluasi portofolio jadi usang jika peminatan atau isi portofolio berubah */
  function invalidateEvaluation() {
    setPortfolioScores({});
    setReasonings({});
    setEvalMode("");
    setMaxStep((m) => (m > 3 ? 3 : m));
  }

  function changeSpec(next: SpecializationCode) {
    if (next === spec) return;
    setSpec(next);
    invalidateEvaluation();
    setMaxStep(1);
  }

  const updateEssays: RecordUpdater<string> = (fn) => {
    setEssays(fn);
    if (maxStep > 3) invalidateEvaluation();
  };
  const updateEvidences: RecordUpdater<string> = (fn) => {
    setEvidences(fn);
    if (maxStep > 3) invalidateEvaluation();
  };

  async function handleEvaluate() {
    if (invalidEvidence.length > 0) return;
    setEvaluating(true);
    setEvalError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: categories.map((cat) => ({
            categoryId: cat.id,
            name: cat.name,
            essay: essays[cat.id] || "",
            evidenceUrl: evidences[cat.id] || "",
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data.results)) {
        throw new Error(data.error || `Server merespons ${res.status}`);
      }
      const ps: Record<string, number> = {};
      const rs: Record<string, string> = {};
      for (const r of data.results) {
        ps[r.categoryId] = r.score;
        rs[r.categoryId] = r.reasoning;
      }
      setPortfolioScores(ps);
      setReasonings(rs);
      setEvalMode(data.mode || "");
      goTo(4);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setEvalError(`Portofolio belum bisa dinilai (${msg}). Periksa koneksi lalu coba lagi.`);
    } finally {
      setEvaluating(false);
    }
  }

  const ranked = useMemo(() => {
    if (step < 5) return [];
    const inputs = categories.map((cat) => ({
      categoryId: cat.id,
      academicScore: academicScores[cat.id] ?? 0,
      portfolioScore: portfolioScores[cat.id] ?? 1,
    }));
    return rankInternships(inputs, internshipsForSpec.map((i) => i.id), allTargets);
  }, [step, categories, academicScores, portfolioScores, internshipsForSpec]);

  function restart() {
    setStep(1);
    setMaxStep(1);
    setGrades({});
    setEssays({});
    setEvidences({});
    setPortfolioScores({});
    setReasonings({});
    setEvalMode("");
    setEvalError(null);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Stepper */}
      <div className="border-b border-line bg-surface print:hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ol className="flex items-center gap-1 overflow-x-auto py-3">
            {STEPS.map((s, i) => {
              const active = step === s.n;
              const done = maxStep > s.n && !active;
              const enabled = canOpen(s.n);
              return (
                <li key={s.n} className="flex items-center gap-1">
                  {i > 0 && <span className={cn("h-px w-4 sm:w-8", maxStep >= s.n ? "bg-brand" : "bg-line")} />}
                  <button
                    onClick={() => enabled && goTo(s.n)}
                    disabled={!enabled}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded-full py-1.5 pl-1.5 pr-3 text-xs font-semibold transition",
                      active && "bg-ink text-bg",
                      !active && enabled && "text-ink hover:bg-surface-2",
                      !enabled && "cursor-not-allowed text-muted/60",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-6 w-6 place-items-center rounded-full font-mono text-[11px]",
                        active ? "bg-brand text-on-brand" : done ? "bg-brand-soft text-brand" : "bg-surface-2",
                      )}
                    >
                      {done ? <Check size={12} strokeWidth={3} /> : s.n}
                    </span>
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <main key={step} className="animate-rise mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {step === 1 && <Step1 spec={spec} setSpec={changeSpec} onNext={() => goTo(2)} />}
        {step === 2 && (
          <Step2
            categories={categories}
            coursesForSpec={coursesForSpec}
            grades={grades}
            setGrades={setGrades}
            academicScores={academicScores}
            onPrev={() => goTo(1)}
            onNext={() => goTo(3)}
            canNext={gradesComplete}
          />
        )}
        {step === 3 && (
          <Step3
            categories={categories}
            essays={essays}
            setEssays={updateEssays}
            evidences={evidences}
            setEvidences={updateEvidences}
            invalidEvidence={invalidEvidence}
            onPrev={() => goTo(2)}
            onEvaluate={handleEvaluate}
            evaluating={evaluating}
            error={evalError}
          />
        )}
        {step === 4 && (
          <Step4
            categories={categories}
            academicScores={academicScores}
            portfolioScores={portfolioScores}
            reasonings={reasonings}
            evidences={evidences}
            evalMode={evalMode}
            onPrev={() => goTo(3)}
            onNext={() => goTo(5)}
          />
        )}
        {step === 5 && <Step5 ranked={ranked} categories={categories} onPrev={() => goTo(4)} onNext={() => goTo(6)} />}
        {step === 6 && (
          <Step6
            ranked={ranked}
            categories={categories}
            academicScores={academicScores}
            portfolioScores={portfolioScores}
            spec={spec}
            essays={essays}
            evidences={evidences}
            reasonings={reasonings}
            onPrev={() => goTo(5)}
            onRestart={restart}
          />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-muted sm:px-6 print:hidden">
        Profile Matching (Kusrini, 2007) dan evaluasi portofolio Gemini 3.8 Flash · Kelompok 43 · Telkom University Jakarta
      </footer>
    </div>
  );
}
