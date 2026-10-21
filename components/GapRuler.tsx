import { cn, formatNumber } from "@/lib/utils";

export interface GapLane {
  label: string;
  value: number;
}

/** Warna berdasarkan arah GAP: kurang dari target (merah), sesuai (hijau), melebihi (biru) */
export function gapTone(gap: number) {
  if (Math.abs(gap) < 0.005) return { text: "text-ok", bg: "bg-ok", soft: "bg-ok-soft" };
  if (gap < 0) return { text: "text-brand", bg: "bg-brand", soft: "bg-brand-soft" };
  return { text: "text-data", bg: "bg-data", soft: "bg-data-soft" };
}

export function formatGap(gap: number, digits = 2) {
  const rounded = Number(gap.toFixed(digits));
  if (rounded === 0) return "0";
  return `${rounded > 0 ? "+" : "−"}${formatNumber(Math.abs(rounded), Number.isInteger(rounded) ? 0 : digits)}`;
}

/**
 * Penggaris GAP: skala 0–max dengan penanda target (garis tegak) dan posisi
 * nilai mahasiswa (titik). Segmen di antaranya diwarnai sesuai arah GAP.
 */
export function GapRuler({
  target,
  lanes,
  max = 4,
  className,
}: {
  target: number;
  lanes: GapLane[];
  max?: number;
  className?: string;
}) {
  const pct = (v: number) => `${(Math.min(Math.max(v, 0), max) / max) * 100}%`;
  const ticks = Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <div className={cn("space-y-1", className)}>
      {lanes.map((lane, laneIdx) => {
        const gap = lane.value - target;
        const tone = gapTone(gap);
        const lo = Math.min(lane.value, target);
        const hi = Math.max(lane.value, target);
        const isLast = laneIdx === lanes.length - 1;
        return (
          <div key={lane.label} className="grid grid-cols-[72px_1fr_56px] items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{lane.label}</span>
            <div className={cn("relative h-6", isLast && "mb-4")}>
              {/* garis dasar */}
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
              {ticks.map((t) => (
                <div key={t} className="absolute top-1/2 -translate-x-1/2" style={{ left: pct(t) }}>
                  <div className="h-2 w-px -translate-y-1/2 bg-line" />
                  {isLast && (
                    <span className="absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[10px] text-muted">{t}</span>
                  )}
                </div>
              ))}
              {/* segmen GAP */}
              <div
                className={cn("absolute top-1/2 h-1 -translate-y-1/2 rounded-full", tone.bg)}
                style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }}
              />
              {/* target */}
              <div
                className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
                style={{ left: pct(target) }}
                title={`Target ${target}`}
              />
              {/* nilai mahasiswa */}
              <div
                className={cn("absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface", tone.bg)}
                style={{ left: pct(lane.value) }}
                title={`${lane.label}: ${lane.value}`}
              />
            </div>
            <span className={cn("text-right font-mono text-xs font-semibold tabular", tone.text)}>{formatGap(gap)}</span>
          </div>
        );
      })}
    </div>
  );
}
