"use client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useThemeColors } from "@/components/useThemeColors";
import { formatNumber } from "@/lib/utils";

const MODE_LABEL: Record<string, { text: string; tone: string }> = {
  gemini: { text: "Dinilai oleh Gemini AI", tone: "border-ok/30 bg-ok-soft text-ok" },
  heuristic: { text: "Dinilai heuristik — GEMINI_API_KEY belum diatur", tone: "border-warn/30 bg-warn-soft text-warn" },
  heuristic_fallback: { text: "Dinilai heuristik — Gemini sedang tidak dapat dihubungi", tone: "border-warn/30 bg-warn-soft text-warn" },
  skipped_all: { text: "Semua portofolio kosong — skor default 1", tone: "border-line bg-surface-2 text-muted" },
};

export function Step4({
  categories,
  academicScores,
  portfolioScores,
  reasonings,
  evidences,
  evalMode,
  onPrev,
  onNext,
}: {
  categories: { id: string; name: string; shortName: string }[];
  academicScores: Record<string, number>;
  portfolioScores: Record<string, number>;
  reasonings: Record<string, string>;
  evidences: Record<string, string>;
  evalMode: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  const c = useThemeColors();
  const mode = MODE_LABEL[evalMode];
  const radarData = categories.map((cat) => ({
    subject: cat.shortName,
    Akademik: academicScores[cat.id] ?? 0,
    Portofolio: portfolioScores[cat.id] ?? 1,
  }));

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Pratinjau profil kompetensi</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Periksa skor sebelum dihitung. Jika penilaian portofolio terasa kurang tepat, perjelas deskripsinya lalu nilai
            ulang.
          </p>
        </div>
        {mode && <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${mode.tone}`}>{mode.text}</span>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="grid grid-cols-[1fr_80px_80px] gap-3 border-b border-line bg-surface-2 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <span>Kompetensi</span>
            <span className="text-right">Akademik</span>
            <span className="text-right">Portofolio</span>
          </div>
          {categories.map((cat, idx) => (
            <div key={cat.id} className={`px-5 py-4 ${idx > 0 ? "border-t border-line" : ""}`}>
              <div className="grid grid-cols-[1fr_80px_80px] items-baseline gap-3">
                <span className="text-sm font-semibold">{cat.name}</span>
                <span className="text-right font-mono text-sm tabular">
                  {formatNumber(academicScores[cat.id] ?? 0)}
                  <span className="text-muted">/4</span>
                </span>
                <span className="text-right font-mono text-sm font-semibold text-data tabular">
                  {portfolioScores[cat.id] ?? "–"}
                  <span className="font-normal text-muted">/4</span>
                </span>
              </div>
              {reasonings[cat.id] && <p className="mt-1.5 text-xs leading-relaxed text-muted">{reasonings[cat.id]}</p>}
              {evidences[cat.id] && (
                <a
                  href={evidences[cat.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-data hover:underline"
                >
                  <ExternalLink size={12} /> Buka bukti
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Akademik vs portofolio</p>
          <div className="mt-2 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke={c.line} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: c.ink }} />
                <PolarRadiusAxis domain={[0, 4]} tickCount={5} angle={30} tick={{ fontSize: 10, fill: c.muted }} stroke={c.line} />
                <Radar name="Akademik" dataKey="Akademik" stroke={c.muted} fill={c.muted} fillOpacity={0.18} />
                <Radar name="Portofolio" dataKey="Portofolio" stroke={c.data} fill={c.data} fillOpacity={0.28} />
                <Tooltip contentStyle={{ background: c.surface, border: `1px solid ${c.line}`, borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft size={16} /> Ubah portofolio
        </Button>
        <Button onClick={onNext}>
          Hitung kecocokan <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}
