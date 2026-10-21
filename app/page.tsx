import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { GapRuler } from "@/components/GapRuler";
import { competencyCategories, internships } from "@/lib/data";

const STEPS = [
  { title: "Pilih peminatan", body: "SAGE atau DELTA menentukan kategori kompetensi dan posisi magang yang dibandingkan." },
  { title: "Isi nilai mata kuliah", body: "Nilai huruf dikonversi ke nilai mutu (A = 4,00 … E = 0,00) per kategori kompetensi." },
  { title: "Ceritakan portofolio", body: "Tulis proyek, sertifikasi, atau pengalaman per kategori. Boleh dikosongkan." },
  { title: "Periksa skor", body: "Gemini menilai portofolio dengan rubrik skala 1–4 beserta alasannya." },
  { title: "Hitung Profile Matching", body: "GAP, bobot nilai, NCF/NSF, Na dan Np dihitung untuk setiap posisi." },
  { title: "Bandingkan rekomendasi", body: "Posisi diurutkan dari persentase kecocokan tertinggi, lengkap dengan tautan lowongan." },
];

const GAP_TABLE: [string, string][] = [
  ["0", "5,0"],
  ["+1", "4,5"],
  ["−1", "4,0"],
  ["+2", "3,5"],
  ["−2", "3,0"],
  ["+3", "2,5"],
  ["−3", "2,0"],
  ["+4", "1,5"],
  ["−4", "1,0"],
];

function SpecColumn({ code, title, specId }: { code: string; title: string; specId: string }) {
  const cats = competencyCategories.filter((c) => c.specialization_id === specId);
  const roles = internships.filter((i) => i.specialization_id === specId);
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl font-bold tracking-tight">{code}</h3>
        <span className="text-xs text-muted">{cats.length} kompetensi · {roles.length} posisi</span>
      </div>
      <p className="mt-1 text-sm text-muted">{title}</p>
      <div className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted">Kategori kompetensi</div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <li key={c.id} className="rounded-md bg-surface-2 px-2 py-1 text-xs">{c.name}</li>
        ))}
      </ul>
      <div className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted">Posisi magang</div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {roles.map((r) => (
          <li key={r.id} className="flex justify-between gap-3 border-b border-line pb-1.5 last:border-0">
            <span className="font-medium">{r.position_name}</span>
            <span className="truncate text-right text-muted">{r.company_name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-20">
          <div className="animate-rise">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              KPPM · S1 Sistem Informasi · Telkom University Jakarta
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Magang yang cocok dimulai dari selisih yang terukur.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
              Masukkan peminatan, nilai mata kuliah, dan portofolio Anda. Sistem membandingkannya dengan
              kebutuhan kompetensi setiap posisi magang menggunakan metode Profile Matching, lalu
              mengurutkan posisi dari persentase kecocokan tertinggi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/spk"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 text-sm font-semibold text-on-brand shadow-sm transition hover:brightness-110"
              >
                Mulai penilaian <ArrowRight size={16} />
              </Link>
              <Link
                href="/history"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-line bg-surface px-6 text-sm font-semibold transition hover:bg-surface-2"
              >
                <History size={16} /> Lihat riwayat
              </Link>
            </div>
          </div>

          {/* Contoh perhitungan */}
          <div className="animate-rise rounded-2xl border border-line bg-surface p-6 shadow-sm [animation-delay:120ms]">
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Contoh perhitungan GAP</p>
              <span className="font-mono text-[11px] text-muted">DELTA</span>
            </div>
            <p className="mt-3 font-display text-lg font-semibold">Penambangan Data → Data Scientist Intern</p>
            <p className="text-xs text-muted">Target kebutuhan posisi: 4 (core factor)</p>
            <GapRuler className="mt-6" target={4} lanes={[{ label: "Akademik", value: 3.5 }, { label: "Portofolio", value: 3 }]} />
            <div className="mt-2 grid grid-cols-3 gap-2 border-t border-line pt-4 font-mono text-xs">
              <div>
                <div className="text-muted">GAP portofolio</div>
                <div className="mt-1 text-sm font-semibold">3 − 4 = −1</div>
              </div>
              <div>
                <div className="text-muted">Bobot nilai</div>
                <div className="mt-1 text-sm font-semibold">4,0</div>
              </div>
              <div>
                <div className="text-muted">Maksimum</div>
                <div className="mt-1 text-sm font-semibold">5,0</div>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              <span className="font-semibold text-brand">Merah</span> berarti kompetensi di bawah target,{" "}
              <span className="font-semibold text-data">biru</span> di atas target,{" "}
              <span className="font-semibold text-ok">hijau</span> tepat sesuai.
            </p>
          </div>
        </section>

        {/* Alur */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Enam langkah, sekitar 10 menit</h2>
            <ol className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="font-mono text-sm font-semibold text-brand">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Peminatan */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Yang dibandingkan</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Kebutuhan kompetensi tiap posisi disusun dari literatur dan data lowongan publik, dengan pembagian
            core factor dan secondary factor per posisi.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <SpecColumn code="SAGE" title="Software and IT Governance Engineering" specId="spec_sage" />
            <SpecColumn code="DELTA" title="Data Exploration, Learning & Translational Analytics" specId="spec_delta" />
          </div>
        </section>

        {/* Metode */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid gap-8 rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">Rumus yang dipakai</h2>
              <dl className="mt-5 space-y-3 font-mono text-sm">
                <div><dt className="text-xs text-muted">Nilai aspek</dt><dd>N = 60% × NCF + 40% × NSF</dd></div>
                <div><dt className="text-xs text-muted">Nilai akhir</dt><dd>0,4 × Na + 0,6 × Np</dd></div>
                <div><dt className="text-xs text-muted">Persentase kecocokan</dt><dd>(Nilai akhir ÷ 5) × 100%</dd></div>
              </dl>
              <p className="mt-5 text-xs text-muted">Sumber: Kusrini (2007), Konsep dan Aplikasi Sistem Pendukung Keputusan.</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Tabel bobot nilai GAP</p>
              <div className="mt-3 grid grid-cols-3 gap-1.5 font-mono text-sm sm:grid-cols-9">
                {GAP_TABLE.map(([gap, w]) => (
                  <div key={gap} className="rounded-lg bg-surface-2 px-2 py-2 text-center">
                    <div className={gap === "0" ? "text-ok" : gap.startsWith("−") ? "text-brand" : "text-data"}>{gap}</div>
                    <div className="mt-0.5 font-semibold">{w}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Untuk selisih yang sama, kekurangan kompetensi diberi bobot lebih rendah daripada kelebihan karena lebih
                berisiko bagi pelaksanaan magang.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
          <span>Capstone Project Kelompok 43 · Program Studi S1 Sistem Informasi · Telkom University Jakarta</span>
          <span>Enrico Steven Ernest · Muhammad Abrar Rayhan · Linggar Adhi Wibowo · Refa Dias Adelia</span>
        </div>
      </footer>
    </div>
  );
}
