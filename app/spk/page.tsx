"use client";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

// Wizard hanya dirender di browser karena membaca draf dari localStorage saat pertama dimuat
const Wizard = dynamic(() => import("./Wizard").then((m) => m.Wizard), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center gap-2 py-24 text-muted">
      <Loader2 size={22} className="animate-spin" />
      <p className="text-xs">Menyiapkan formulir…</p>
    </div>
  ),
});

export default function SPKPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Wizard />
    </div>
  );
}
