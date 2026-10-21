"use client";
import { useSyncExternalStore } from "react";

/** Token warna yang dipakai chart (Recharts butuh nilai warna konkret, bukan var()) */
const TOKENS = ["ink", "muted", "line", "brand", "data", "ok", "surface"] as const;
type Token = (typeof TOKENS)[number];
export type ThemeColors = Record<Token, string>;

const LIGHT_FALLBACK = "#15171c|#5b6270|#dde1e7|#c8102e|#2453a6|#157347|#ffffff";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot() {
  const style = getComputedStyle(document.documentElement);
  return TOKENS.map((t) => style.getPropertyValue(`--${t}`).trim()).join("|");
}

export function useThemeColors(): ThemeColors {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => LIGHT_FALLBACK);
  const values = snapshot.split("|");
  return Object.fromEntries(TOKENS.map((t, i) => [t, values[i] || "#888888"])) as ThemeColors;
}
