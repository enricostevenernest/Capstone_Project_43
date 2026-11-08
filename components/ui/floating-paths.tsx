"use client";
import React from "react";
import { cn } from "@/lib/utils";

export interface FloatingPathsProps {
  position?: number;
  className?: string;
  children?: React.ReactNode;
}

export function FloatingPaths({ position = -1 }: { position?: number }) {
  // 36 kurva halus yang membentuk efek kedalaman multi-layer (KokonutUI style)
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.8 + i * 0.04,
    opacity: 0.12 + (i % 6) * 0.035,
    duration: 20 + (i % 8) * 2,
    delay: (i % 5) * 1.5,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <svg
        className="h-full w-full text-ink/25"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <style>{`
          @keyframes floatingPathMotion {
            0% {
              stroke-dashoffset: 1400;
            }
            50% {
              stroke-dashoffset: 700;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
        {paths.map((p) => (
          <path
            key={p.id}
            d={p.d}
            stroke="currentColor"
            strokeWidth={p.width}
            strokeLinecap="round"
            strokeDasharray="260 400"
            style={{
              opacity: p.opacity,
              animation: `floatingPathMotion ${p.duration}s linear infinite`,
              animationDelay: `-${p.delay}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function FloatingPathsBackground({
  position = -1,
  className,
  children,
}: FloatingPathsProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <FloatingPaths position={position} />
      {children}
    </div>
  );
}
