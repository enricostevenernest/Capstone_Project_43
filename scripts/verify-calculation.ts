// ============================================================
// Verifikasi perhitungan Profile Matching terhadap laporan
// Data uji: Tabel 28 (SAGE) dan Tabel 31 (DELTA)
// Hasil harapan: Tabel 30, 32, dan 34. Jalankan: npm test
// ============================================================

import { gapToWeight, rankInternships } from "../lib/profile-matching";
import { allTargets } from "../lib/allTargets";

type Expected = [internshipId: string, finalScore: number, matchPercentage: number];

function check(label: string, academic: number[], portfolio: number[], categoryIds: string[], expected: Expected[]) {
  const inputs = categoryIds.map((categoryId, i) => ({ categoryId, academicScore: academic[i], portfolioScore: portfolio[i] }));
  const ranked = rankInternships(inputs, expected.map(([id]) => id), allTargets);
  let failed = 0;
  ranked.forEach((r, i) => {
    const [id, final, pct] = expected[i];
    const ok = r.internshipId === id && Math.abs(r.finalScore - final) < 0.0015 && Math.abs(r.matchPercentage - pct) < 0.015;
    if (!ok) failed++;
    console.log(`${ok ? "OK  " : "GAGAL"} ${label} #${i + 1} ${r.internshipId} akhir=${r.finalScore} kecocokan=${r.matchPercentage}% (laporan: ${id} ${final} ${pct}%)`);
  });
  return failed;
}

let failures = 0;

failures += check(
  "SAGE",
  [4.0, 3.5, 3.0, 4.0, 2.5, 3.0],
  [3, 2, 3, 4, 1, 1],
  ["sage_1", "sage_2", "sage_3", "sage_4", "sage_5", "sage_6"],
  [
    ["int_sage_1", 4.733, 94.67],
    ["int_sage_5", 4.667, 93.33],
    ["int_sage_2", 4.26, 85.2],
    ["int_sage_3", 3.613, 72.27],
    ["int_sage_4", 3.353, 67.07],
  ],
);

failures += check(
  "DELTA",
  [3.5, 4.0, 3.0, 3.5, 3.0, 2.5],
  [2, 3, 3, 2, 2, 1],
  ["delta_1", "delta_2", "delta_3", "delta_4", "delta_5", "delta_6"],
  [
    ["int_delta_1", 4.567, 91.33],
    ["int_delta_2", 4.24, 84.8],
    ["int_delta_4", 4.173, 83.47],
    ["int_delta_3", 4.073, 81.47],
    ["int_delta_5", 4.04, 80.8],
  ],
);

// BB-16: GAP desimal 0,5 harus berbobot 4,75 (interpolasi linier)
const w = gapToWeight(0.5);
const okGap = Math.abs(w - 4.75) < 1e-9;
if (!okGap) failures++;
console.log(`${okGap ? "OK  " : "GAGAL"} BB-16 gapToWeight(0.5) = ${w} (laporan: 4.75)`);

console.log(failures === 0 ? "\nSemua hasil sama dengan laporan." : `\n${failures} pemeriksaan tidak sesuai.`);
process.exit(failures === 0 ? 0 : 1);
