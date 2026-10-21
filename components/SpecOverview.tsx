"use client";
import { useReferenceData } from "./ReferenceProvider";
import { activeInternshipsFor, categoriesFor } from "@/lib/reference";
import type { SpecializationCode } from "@/lib/types";

const TITLES: Record<SpecializationCode, string> = {
  SAGE: "Software and IT Governance Engineering",
  DELTA: "Data Exploration, Learning & Translational Analytics",
};

export function SpecOverview() {
  const { data } = useReferenceData();
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      {(["SAGE", "DELTA"] as const).map((code) => {
        const cats = categoriesFor(data, code);
        const roles = activeInternshipsFor(data, code);
        return (
          <div key={code} className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-2xl font-bold tracking-tight">{code}</h3>
              <span className="text-xs text-muted">
                {cats.length} kompetensi · {roles.length} posisi
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{TITLES[code]}</p>
            <div className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted">Kompetensi yang dinilai</div>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <li key={c.id} className="rounded-md bg-surface-2 px-2 py-1 text-xs">
                  {c.name}
                </li>
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
      })}
    </div>
  );
}
