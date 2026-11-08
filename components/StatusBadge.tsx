import { CheckCircle2, Clock, PencilLine, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssessmentStatus } from "@/lib/types";

const STYLE: Record<AssessmentStatus, { label: string; className: string; Icon: typeof Clock }> = {
  pending: { label: "Menunggu diperiksa", className: "border-line bg-surface-2 text-muted", Icon: Clock },
  approved: { label: "Tervalidasi", className: "border-ok/30 bg-ok-soft text-ok", Icon: CheckCircle2 },
  corrected: { label: "Dikoreksi admin", className: "border-data/30 bg-data-soft text-data", Icon: PencilLine },
  needs_revision: { label: "Perlu diperbaiki", className: "border-warn/30 bg-warn-soft text-warn", Icon: AlertTriangle },
};

export function StatusBadge({ status, className }: { status?: AssessmentStatus | null; className?: string }) {
  if (!status) return null;
  const s = STYLE[status] ?? STYLE.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        s.className,
        className,
      )}
    >
      <s.Icon size={12} /> {s.label}
    </span>
  );
}
