// ============================================================
// Profile Matching — 8 Tahap Kusrini (2007)
// Capstone Project 43
// ============================================================

import type {
  CompetencyInput,
  InternshipTargetInfo,
  PMResult,
} from "./types";

// Re-export types for backward compatibility
export type { CompetencyInput, InternshipTargetInfo, PMResult } from "./types";

// ---- Konstanta Bobot ----

/** Bobot aspek nilai akademik (Wa) */
export const ACADEMIC_WEIGHT = 0.4;
/** Bobot aspek portofolio (Wp) */
export const PORTFOLIO_WEIGHT = 0.6;
/** Proporsi Core Factor dan Secondary Factor (Kusrini, 2007) */
export const CORE_FACTOR_RATIO = 0.6;
export const SECONDARY_FACTOR_RATIO = 0.4;
/** Skala maksimum nilai profil & target */
export const MAX_SCALE = 4;

// ---- Tabel Bobot Nilai GAP (Kusrini, 2007) ----

const GAP_WEIGHT_MAP: Record<number, number> = {
  0: 5.0,   // Tidak ada selisih (kompetensi sesuai kebutuhan)
  1: 4.5,   // Kompetensi lebih 1 tingkat
  [-1]: 4.0, // Kompetensi kurang 1 tingkat
  2: 3.5,   // Kompetensi lebih 2 tingkat
  [-2]: 3.0, // Kompetensi kurang 2 tingkat
  3: 2.5,   // Kompetensi lebih 3 tingkat
  [-3]: 2.0, // Kompetensi kurang 3 tingkat
  4: 1.5,   // Kompetensi lebih 4 tingkat
  [-4]: 1.0, // Kompetensi kurang 4 tingkat
};

/** Konversi selisih GAP ke bobot nilai sesuai tabel Kusrini (dengan interpolasi linier untuk nilai desimal) */
export function gapToWeight(gap: number): number {
  if (gap in GAP_WEIGHT_MAP) {
    return GAP_WEIGHT_MAP[gap];
  }
  if (gap >= 4) return 1.5;
  if (gap <= -4) return 1.0;

  const lower = Math.floor(gap);
  const upper = Math.ceil(gap);
  const wLower = GAP_WEIGHT_MAP[lower] ?? 1.0;
  const wUpper = GAP_WEIGHT_MAP[upper] ?? 1.0;

  return Number((wLower + (wUpper - wLower) * (gap - lower)).toFixed(3));
}

/** Hitung rata-rata array numerik */
function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Hitung Profile Matching untuk satu lowongan.
 *
 * Langkah:
 * 1. Hitung GAP = Nilai Profil - Nilai Target
 * 2. Petakan ke Bobot GAP (tabel Kusrini)
 * 3. Hitung NCF & NSF untuk Aspek Akademik dan Portofolio
 * 4. Na = 60% × NCF_A + 40% × NSF_A
 * 5. Np = 60% × NCF_P + 40% × NSF_P
 * 6. Final = Wa × Na + Wp × Np
 * 7. Kecocokan = (Final / 5) × 100%
 */
export function calculateProfileMatching(
  inputs: CompetencyInput[],
  internshipId: string,
  targets: InternshipTargetInfo[],
  academicWeight = ACADEMIC_WEIGHT,
  portfolioWeight = PORTFOLIO_WEIGHT,
): PMResult {
  // Filter target untuk lowongan ini
  const targetsForInternship = targets.filter(
    (t) => t.internshipId === internshipId,
  );

  const breakdown: PMResult["breakdown"] = [];
  const coreAcademic: number[] = [];
  const secondaryAcademic: number[] = [];
  const corePortfolio: number[] = [];
  const secondaryPortfolio: number[] = [];

  for (const target of targetsForInternship) {
    const input = inputs.find(
      (i) => i.categoryId === target.competency_category_id,
    );
    const academicScore = input?.academicScore ?? 0;
    const portfolioScore = input?.portfolioScore ?? 1;

    // Hitung GAP
    const gapAcademic = Number((academicScore - target.target_score).toFixed(2));
    const gapPortfolio = Number((portfolioScore - target.target_score).toFixed(2));

    // Konversi ke bobot
    const weightAcademic = gapToWeight(gapAcademic);
    const weightPortfolio = gapToWeight(gapPortfolio);

    // Klasifikasi Core / Secondary
    if (target.factor_type === "CORE") {
      coreAcademic.push(weightAcademic);
      corePortfolio.push(weightPortfolio);
    } else {
      secondaryAcademic.push(weightAcademic);
      secondaryPortfolio.push(weightPortfolio);
    }

    breakdown.push({
      categoryId: target.competency_category_id,
      academicGap: gapAcademic,
      academicWeight: weightAcademic,
      portfolioGap: gapPortfolio,
      portfolioWeight: weightPortfolio,
      factorType: target.factor_type,
      target: target.target_score,
    });
  }

  // Hitung NCF & NSF
  const ncfA = average(coreAcademic);
  const nsfA = average(secondaryAcademic);
  const ncfP = average(corePortfolio);
  const nsfP = average(secondaryPortfolio);

  // Na & Np (60% CF + 40% SF)
  const na = CORE_FACTOR_RATIO * ncfA + SECONDARY_FACTOR_RATIO * nsfA;
  const np = CORE_FACTOR_RATIO * ncfP + SECONDARY_FACTOR_RATIO * nsfP;

  // Final Score & Match Percentage
  const finalScore = academicWeight * na + portfolioWeight * np;
  const matchPercentage = (finalScore / 5) * 100;

  return {
    internshipId,
    na: Number(na.toFixed(3)),
    np: Number(np.toFixed(3)),
    finalScore: Number(finalScore.toFixed(3)),
    matchPercentage: Number(matchPercentage.toFixed(2)),
    breakdown,
    ncfA: Number(ncfA.toFixed(3)),
    nsfA: Number(nsfA.toFixed(3)),
    ncfP: Number(ncfP.toFixed(3)),
    nsfP: Number(nsfP.toFixed(3)),
  };
}

/**
 * Hitung dan ranking semua lowongan berdasarkan Profile Matching.
 * Hasil diurutkan dari persentase kecocokan tertinggi ke terendah.
 */
export function rankInternships(
  inputs: CompetencyInput[],
  internshipIds: string[],
  allTargets: InternshipTargetInfo[],
  academicWeight?: number,
  portfolioWeight?: number,
): PMResult[] {
  const results = internshipIds.map((id) =>
    calculateProfileMatching(inputs, id, allTargets, academicWeight, portfolioWeight),
  );
  results.sort((a, b) => b.finalScore - a.finalScore);
  return results;
}
