import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ReferenceProvider } from "@/components/ReferenceProvider";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SPK Rekomendasi Tempat Magang — Capstone Project 43",
  description:
    "Sistem Pendukung Keputusan berbasis Profile Matching (Kusrini) dan evaluasi portofolio Gemini AI untuk rekomendasi tempat magang mahasiswa — Kelompok 43, S1 Sistem Informasi, Telkom University Jakarta.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${bricolage.variable} ${jakarta.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ReferenceProvider>{children}</ReferenceProvider>
      </body>
    </html>
  );
}
