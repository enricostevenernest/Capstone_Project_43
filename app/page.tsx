import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { GapRuler } from "@/components/GapRuler";
import { SpecOverview } from "@/components/SpecOverview";

const STEPS = [
  { title: "Pilih peminatan", body: "SAGE atau DELTA. Dari sini sistem tahu kompetensi dan posisi mana yang relevan buatmu." },
  { title: "Isi nilai mata kuliah", body: "Cukup nilai huruf dari transkrip. Enam mata kuliah, satu per kompetensi." },
  { title: "Ceritakan portofoliomu", body: "Proyek, sertifikasi, atau pengalaman kerja. Belum punya? Boleh dikosongkan." },
  { title: "Cek skor dari AI", body: "Gemini membaca ceritamu dan memberi skor 1 sampai 4, lengkap dengan alasannya." },
  { title: "Lihat hitungannya", body: "Selisih nilaimu dengan target tiap posisi dihitung terbuka, tidak ada yang disembunyikan." },
  { title: "Bandingkan dan simpan", body: "Posisi diurutkan dari yang paling cocok. Admin prodi ikut memeriksa hasil yang kamu simpan." },
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
              Cari tempat magang yang benar-benar pas dengan kemampuanmu.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
              Bukan cuma karena namanya terkenal atau diajak teman. Isi nilai mata kuliah dan ceritakan proyek yang pernah
              kamu kerjakan. Sistem membandingkannya dengan kebutuhan tiap posisi magang dan menunjukkan mana yang paling
              cocok, beserta alasannya.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/spk"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 text-sm font-semibold text-on-brand shadow-sm transition hover:brightness-110"
              >
                Cek kecocokanku <ArrowRight size={16} />
              </Link>
              <Link
                href="/history"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-line bg-surface px-6 text-sm font-semibold transition hover:bg-surface-2"
              >
                <History size={16} /> Riwayatku
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
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Enam langkah, kira-kira 10 menit</h2>
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
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Apa saja yang dibandingkan?</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Target tiap posisi kami susun dari literatur dan lowongan yang dipublikasikan. Setiap posisi punya kompetensi
            utama (core factor) dan pendukung (secondary factor), dan admin prodi bisa memperbaruinya kapan saja.
          </p>
          <SpecOverview />
        </section>

        {/* Metode */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid gap-8 rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">Hitungannya terbuka</h2>
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
                Kurang satu tingkat dinilai lebih berat daripada lebih satu tingkat, karena kekurangan kompetensi lebih
                berisiko saat magang dibanding kelebihan.
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
