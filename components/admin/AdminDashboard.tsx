"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, RefreshCw } from "lucide-react";
import { fetchAssessments, type SavedAssessmentHistory } from "@/lib/supabase";
import { findInternship } from "@/lib/reference";
import { STATUS_LABEL } from "@/lib/admin";
import { useReferenceData } from "@/components/ReferenceProvider";
import { StatusBadge } from "@/components/StatusBadge";
import { Input, Select } from "@/components/ui/input";
import { ReviewPanel } from "./ReviewPanel";
import { cn, formatNumber } from "@/lib/utils";
import type { AssessmentStatus } from "@/lib/types";

const STATUSES: AssessmentStatus[] = ["pending", "needs_revision", "corrected", "approved"];

export function AdminDashboard() {
  const { data: ref } = useReferenceData();
  const [items, setItems] = useState<SavedAssessmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AssessmentStatus | "all">("pending");
  const [spec, setSpec] = useState<"all" | "spec_sage" | "spec_delta">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetchAssessments();
    if (res.error) setError(res.error);
    else {
      setError(null);
      setItems(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Ditunda satu tick supaya setState tidak terjadi sinkron di dalam effect
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const schemaReady = items.length === 0 || items.some((i) => i.status !== undefined);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const s of STATUSES) c[s] = items.filter((i) => (i.status ?? "pending") === s).length;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (status !== "all" && (i.status ?? "pending") !== status) return false;
      if (spec !== "all" && i.specialization_id !== spec) return false;
      if (!q) return true;
      const top = [...i.recommendation_results].sort((a, b) => a.rank_position - b.rank_position)[0];
      const haystack = [i.student_name, i.student_email, findInternship(ref, top?.internship_id)?.position_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, status, spec, query, ref]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-muted">
        <Loader2 size={22} className="animate-spin" />
        <p className="text-xs">Mengambil hasil mahasiswa…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Periksa hasil rekomendasi</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Cocokkan skor AI dengan cerita dan bukti portofolio mahasiswa. Kalau ada yang meleset, koreksi skornya atau
            ganti rekomendasi akhirnya, dan tulis alasannya supaya mahasiswa paham.
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <RefreshCw size={14} /> Muat ulang
        </button>
      </div>

      {!schemaReady && (
        <div className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm text-warn">
          Kolom status belum ada di database. Jalankan <code className="font-mono">supabase/migration_002_admin.sql</code>{" "}
          di Supabase SQL Editor supaya validasi dan koreksi bisa disimpan.
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-brand/30 bg-brand-soft p-4 text-sm text-brand">
          Data belum bisa diambil ({error}).
        </div>
      )}

      {/* Ringkasan status */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            className={cn(
              "rounded-xl border bg-surface p-4 text-left transition",
              status === s ? "border-brand ring-2 ring-brand/15" : "border-line hover:border-muted/50",
            )}
          >
            <div className="font-display text-2xl font-bold tabular">{counts[s] ?? 0}</div>
            <div className="mt-0.5 text-xs text-muted">{s === "all" ? "Semua hasil" : STATUS_LABEL[s]}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            aria-label="Cari mahasiswa"
            placeholder="Cari nama, email, atau posisi…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          aria-label="Filter peminatan"
          className="w-auto font-sans"
          value={spec}
          onChange={(e) => setSpec(e.target.value as typeof spec)}
        >
          <option value="all">Semua peminatan</option>
          <option value="spec_sage">SAGE</option>
          <option value="spec_delta">DELTA</option>
        </Select>
      </div>

      <div className={cn("grid gap-6", selected && "xl:grid-cols-[1fr_1.1fr]")}>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {filtered.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm text-muted">
              {items.length === 0
                ? "Belum ada mahasiswa yang menyimpan hasil."
                : "Tidak ada hasil yang cocok dengan filter ini."}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((i) => {
                const top = [...i.recommendation_results].sort((a, b) => a.rank_position - b.rank_position)[0];
                const finalIntern = findInternship(ref, i.override_internship_id ?? top?.internship_id);
                return (
                  <li key={i.id}>
                    <button
                      onClick={() => setSelectedId(i.id)}
                      aria-current={selectedId === i.id}
                      className={cn(
                        "flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-surface-2/60",
                        selectedId === i.id && "bg-surface-2",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold">
                            {i.student_name || i.student_email || `Mahasiswa ${i.user_id?.slice(0, 6) ?? ""}`}
                          </span>
                          <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                            {i.specialization_id === "spec_sage" ? "SAGE" : "DELTA"}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted">
                          {finalIntern?.position_name ?? "-"} ·{" "}
                          {new Date(i.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                      {top && (
                        <span className="font-mono text-sm font-semibold tabular">
                          {formatNumber(Number(top.match_percentage), 1)}%
                        </span>
                      )}
                      <StatusBadge status={i.status ?? "pending"} className="hidden sm:inline-flex" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selected && (
          <ReviewPanel
            key={selected.id}
            assessment={selected}
            onClose={() => setSelectedId(null)}
            onDone={load}
          />
        )}
      </div>
    </div>
  );
}
