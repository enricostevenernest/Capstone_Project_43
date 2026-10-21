"use client";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

const RUBRIC = [
  { score: 1, text: "Belum ada bukti, atau ceritanya tidak nyambung dengan kategori." },
  { score: 2, text: "Sudah relevan, tapi masih latihan dasar atau ikut tutorial." },
  { score: 3, text: "Proyek menengah: tugas besar, studi kasus nyata, freelance, atau sertifikasi." },
  { score: 4, text: "Proyek kompleks yang hasilnya terbukti: dipakai orang sungguhan atau menang lomba." },
];

export function Step3({
  categories,
  essays,
  setEssays,
  evidences,
  setEvidences,
  invalidEvidence,
  onPrev,
  onEvaluate,
  evaluating,
  error,
}: {
  categories: { id: string; name: string; shortName: string }[];
  essays: Record<string, string>;
  setEssays: (fn: (p: Record<string, string>) => Record<string, string>) => void;
  evidences: Record<string, string>;
  setEvidences: (fn: (p: Record<string, string>) => Record<string, string>) => void;
  invalidEvidence: string[];
  onPrev: () => void;
  onEvaluate: () => void;
  evaluating: boolean;
  error: string | null;
}) {
  const filled = categories.filter((c) => (essays[c.id] || "").trim().length >= 10).length;

  return (
    <section className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Ceritakan apa yang pernah kamu kerjakan</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Satu cerita terbaik per kategori sudah cukup. Sebutkan apa yang kamu buat, peranmu di situ, alat yang dipakai,
          dan hasilnya. Belum punya pengalaman di suatu kategori? Kosongkan saja, nanti otomatis dapat skor 1.
        </p>

        <div className="mt-6 space-y-4">
          {categories.map((cat) => {
            const essay = essays[cat.id] || "";
            const invalid = invalidEvidence.includes(cat.id);
            return (
              <div key={cat.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-semibold">{cat.name}</h2>
                  <span className="font-mono text-[11px] text-muted">{essay.length} karakter</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor={`essay-${cat.id}`}>Ceritamu (opsional)</Label>
                  <Textarea
                    id={`essay-${cat.id}`}
                    value={essay}
                    rows={4}
                    onChange={(e) => setEssays((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                    placeholder="Contoh: Aku membangun sistem inventaris untuk toko kue tetangga pakai Laravel dan React. Sekarang dipakai 3 karyawan setiap hari."
                  />
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor={`evidence-${cat.id}`}>Tautan bukti (opsional)</Label>
                  <Input
                    id={`evidence-${cat.id}`}
                    type="url"
                    inputMode="url"
                    aria-invalid={invalid}
                    aria-describedby={invalid ? `evidence-err-${cat.id}` : undefined}
                    placeholder="https://github.com/… atau https://drive.google.com/…"
                    value={evidences[cat.id] || ""}
                    onChange={(e) => setEvidences((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                  />
                  {invalid && (
                    <p id={`evidence-err-${cat.id}`} className="text-xs text-brand">
                      Tautannya belum lengkap. Awali dengan https:// lalu nama situsnya, misalnya https://github.com/namamu.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-lg border border-brand/30 bg-brand-soft p-3 text-sm text-brand">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onPrev}>
            <ArrowLeft size={16} /> Kembali ke nilai
          </Button>
          <Button onClick={onEvaluate} disabled={evaluating || invalidEvidence.length > 0}>
            {evaluating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Sedang dibaca AI…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Submit
              </>
            )}
          </Button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Cara AI memberi skor</p>
          <ol className="mt-3 space-y-3">
            {RUBRIC.map((r) => (
              <li key={r.score} className="flex gap-3 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-surface-2 font-mono text-xs font-semibold">
                  {r.score}
                </span>
                <span className="text-muted">{r.text}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
            Rubrik diadaptasi dari Paulson dkk. (1991). Kamu sudah mengisi {filled} dari {categories.length} kategori.
          </p>
        </div>
      </aside>
    </section>
  );
}
