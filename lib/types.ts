// ============================================================
// Shared Type Definitions — Capstone Project 43
// SPK Rekomendasi Tempat Magang (Profile Matching + Gemini AI)
// ============================================================

/** Kode peminatan yang tersedia */
export type SpecializationCode = "SAGE" | "DELTA";

/** Nilai huruf akademik */
export type GradeLetter = "A" | "AB" | "B" | "BC" | "C" | "D" | "E";

/** Tipe faktor dalam Profile Matching (Kusrini, 2007) */
export type FactorType = "CORE" | "SECONDARY";

/** Entitas peminatan */
export interface Specialization {
  id: string;
  code: SpecializationCode;
  name: string;
  description: string;
}

/** Kategori kompetensi per peminatan */
export interface CompetencyCategory {
  id: string;
  specialization_id: string;
  name: string;
  shortName: string;
  description: string;
}

/** Mata kuliah */
export interface Course {
  id: string;
  competency_category_id: string;
  code: string;
  name: string;
}

/** Lowongan magang */
export interface Internship {
  id: string;
  specialization_id: string;
  position_name: string;
  company_name: string;
  description: string;
  vacancy_url: string;
  /** false = dinonaktifkan admin, tidak ditampilkan ke mahasiswa */
  is_active?: boolean;
}

/** Target skor per kompetensi untuk setiap lowongan */
export interface InternshipTarget {
  id: string;
  internship_id: string;
  competency_category_id: string;
  target_score: number;
  factor_type: FactorType;
}

/** Status pemeriksaan hasil rekomendasi oleh admin (UC-10, UC-11) */
export type AssessmentStatus = "pending" | "approved" | "corrected" | "needs_revision";

// ---- Profile Matching types ----

/** Input kompetensi mahasiswa */
export interface CompetencyInput {
  categoryId: string;
  /** Skor akademik (skala 0.00 - 4.00) */
  academicScore: number;
  /** Skor portofolio (skala 1 - 4) */
  portfolioScore: number;
}

/** Info target untuk perhitungan Profile Matching */
export interface InternshipTargetInfo {
  internshipId: string;
  competency_category_id: string;
  target_score: number;
  factor_type: FactorType;
}

/** Breakdown detail GAP per kategori */
export interface PMBreakdown {
  categoryId: string;
  academicGap: number;
  academicWeight: number;
  portfolioGap: number;
  portfolioWeight: number;
  factorType: string;
  target: number;
}

/** Hasil perhitungan Profile Matching per lowongan */
export interface PMResult {
  internshipId: string;
  /** Nilai Aspek Akademik */
  na: number;
  /** Nilai Aspek Portofolio */
  np: number;
  /** Nilai Akhir = (Wa × Na) + (Wp × Np) */
  finalScore: number;
  /** Persentase Kecocokan = (finalScore / 5) × 100% */
  matchPercentage: number;
  breakdown: PMBreakdown[];
  /** NCF Akademik */
  ncfA: number;
  /** NSF Akademik */
  nsfA: number;
  /** NCF Portofolio */
  ncfP: number;
  /** NSF Portofolio */
  nsfP: number;
}
