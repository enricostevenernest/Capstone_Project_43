// ============================================================
// Data Referensi — peminatan, kategori, mata kuliah, lowongan, target
// Sumber utama: Supabase. Cadangan: data statis lib/data.ts & lib/targets.ts
// ============================================================

import { specializations, competencyCategories, courses, internships } from "./data";
import { allInternshipTargets } from "./targets";
import { supabase, isSupabaseConfigured } from "./supabase";
import { MAX_SCALE } from "./profile-matching";
import type {
  Specialization,
  SpecializationCode,
  CompetencyCategory,
  Course,
  Internship,
  InternshipTarget,
  InternshipTargetInfo,
} from "./types";

export interface ReferenceData {
  specializations: Specialization[];
  categories: CompetencyCategory[];
  courses: Course[];
  /** Semua lowongan, termasuk yang nonaktif (dipakai admin & riwayat) */
  internships: Internship[];
  targets: InternshipTarget[];
}

export type ReferenceSource = "database" | "static";

export const staticReference: ReferenceData = {
  specializations,
  categories: competencyCategories,
  courses,
  internships,
  targets: allInternshipTargets,
};

export const specIdOf = (code: SpecializationCode) => (code === "SAGE" ? "spec_sage" : "spec_delta");

export function categoriesFor(ref: ReferenceData, code: SpecializationCode) {
  return ref.categories.filter((c) => c.specialization_id === specIdOf(code));
}

export function coursesFor(ref: ReferenceData, code: SpecializationCode) {
  const ids = new Set(categoriesFor(ref, code).map((c) => c.id));
  return ref.courses.filter((c) => ids.has(c.competency_category_id));
}

/** Lowongan aktif untuk satu peminatan (yang dihitung untuk mahasiswa) */
export function activeInternshipsFor(ref: ReferenceData, code: SpecializationCode) {
  return ref.internships.filter((i) => i.specialization_id === specIdOf(code) && i.is_active !== false);
}

export function findInternship(ref: ReferenceData, id: string | null | undefined) {
  return id ? ref.internships.find((i) => i.id === id) : undefined;
}

export function findCategory(ref: ReferenceData, id: string) {
  return ref.categories.find((c) => c.id === id);
}

/** Konversi target ke format yang dipakai lib/profile-matching.ts */
export function toTargetInfo(targets: InternshipTarget[]): InternshipTargetInfo[] {
  return targets.map((t) => ({
    internshipId: t.internship_id,
    competency_category_id: t.competency_category_id,
    target_score: t.target_score,
    factor_type: t.factor_type,
  }));
}

/**
 * Ambil data referensi dari Supabase. Jika belum dikonfigurasi, gagal,
 * atau tabel masih kosong, kembalikan data statis.
 */
export async function fetchReferenceData(): Promise<{ data: ReferenceData; source: ReferenceSource }> {
  if (!isSupabaseConfigured()) return { data: staticReference, source: "static" };

  try {
    const [specs, cats, crs, ints, tgts] = await Promise.all([
      supabase.from("specializations").select("*"),
      supabase.from("competency_categories").select("*"),
      supabase.from("courses").select("*"),
      supabase.from("internships").select("*").order("id"),
      supabase.from("internship_targets").select("*"),
    ]);

    const failed = [specs, cats, crs, ints, tgts].find((r) => r.error);
    if (failed || !specs.data?.length || !cats.data?.length || !ints.data?.length || !tgts.data?.length) {
      return { data: staticReference, source: "static" };
    }

    // Database lama masih memakai skala target 1-5. Selama belum disinkronkan
    // (migration_002_admin.sql bagian 6), pakai data statis yang sesuai laporan.
    const outOfScale = (tgts.data as InternshipTarget[]).some((t) => t.target_score < 1 || t.target_score > MAX_SCALE);
    if (outOfScale) return { data: staticReference, source: "static" };

    // Urutan kategori mengikuti urutan statis (sage_1..6, delta_1..6) agar grafik konsisten
    const order = (id: string) => {
      const idx = competencyCategories.findIndex((c) => c.id === id);
      return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
    };

    return {
      source: "database",
      data: {
        specializations: specs.data as Specialization[],
        categories: (cats.data as Record<string, string>[])
          .map((c) => ({
            id: c.id,
            specialization_id: c.specialization_id,
            name: c.name,
            shortName: c.short_name ?? c.name,
            description: c.description ?? "",
          }))
          .sort((a, b) => order(a.id) - order(b.id) || a.id.localeCompare(b.id)),
        courses: (crs.data ?? []) as Course[],
        internships: ints.data as Internship[],
        targets: tgts.data as InternshipTarget[],
      },
    };
  } catch {
    return { data: staticReference, source: "static" };
  }
}
