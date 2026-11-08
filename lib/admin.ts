// ============================================================
// Fungsi Admin — UC-10, UC-11, UC-12 dan pengelolaan lowongan
// Semua hak akses dijaga oleh RLS + fungsi is_admin() di database.
// ============================================================

import { rankInternships } from "./profile-matching";
import { toTargetInfo, type ReferenceData } from "./reference";
import {
  supabase,
  isMissingSchemaError,
  toRecommendationRows,
  type SavedAssessmentHistory,
} from "./supabase";
import type { AssessmentStatus, FactorType, Internship, PMResult } from "./types";

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
}

export const STATUS_LABEL: Record<AssessmentStatus, string> = {
  pending: "Menunggu pemeriksaan",
  approved: "Tervalidasi",
  corrected: "Dikoreksi admin",
  needs_revision: "Perlu diperbaiki",
};

/** Hitung ulang peringkat dari detail tersimpan (dipakai setelah admin mengoreksi skor) */
export function recomputeRanking(
  assessment: SavedAssessmentHistory,
  ref: ReferenceData,
  scoreOverrides: Record<string, number | null> = {},
): PMResult[] {
  const inputs = assessment.assessment_details.map((d) => {
    const override = d.id in scoreOverrides ? scoreOverrides[d.id] : d.portfolio_score_admin ?? null;
    return {
      categoryId: d.competency_category_id,
      academicScore: Number(d.academic_score),
      portfolioScore: override ?? d.portfolio_score_ai ?? 1,
    };
  });
  // Lowongan yang dibandingkan tetap sama dengan saat penilaian dibuat
  const internshipIds = assessment.recommendation_results.map((r) => r.internship_id);
  return rankInternships(
    inputs,
    internshipIds,
    toTargetInfo(ref.targets),
    Number(assessment.academic_weight),
    Number(assessment.portfolio_weight),
  );
}

export type ReviewAction = "approve" | "correct" | "request_revision" | "reopen";

const NEXT_STATUS: Record<ReviewAction, AssessmentStatus> = {
  approve: "approved",
  correct: "corrected",
  request_revision: "needs_revision",
  reopen: "pending",
};

export interface ReviewInput {
  assessment: SavedAssessmentHistory;
  action: ReviewAction;
  note: string;
  /** Rekomendasi utama pengganti (UC-11 langkah 5) */
  overrideInternshipId?: string | null;
  /** Koreksi skor portofolio per detail: id detail → skor 1–4, atau null untuk kembali ke skor AI */
  scoreOverrides?: Record<string, number | null>;
  ref: ReferenceData;
}

export async function reviewAssessment(input: ReviewInput): Promise<{ success: boolean; error?: string }> {
  const { assessment, action, note, overrideInternshipId, scoreOverrides = {}, ref } = input;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Sesi admin berakhir. Masuk lagi untuk melanjutkan." };

  if ((action === "correct" || action === "request_revision") && !note.trim()) {
    return { success: false, error: "Tulis alasannya dulu, supaya mahasiswa paham apa yang berubah." };
  }

  // 1. Simpan koreksi skor portofolio
  const changed = Object.entries(scoreOverrides).filter(([id, score]) => {
    const detail = assessment.assessment_details.find((d) => d.id === id);
    return detail && (detail.portfolio_score_admin ?? null) !== score;
  });

  for (const [id, score] of changed) {
    const { error } = await supabase.from("assessment_details").update({ portfolio_score_admin: score }).eq("id", id);
    if (error) return { success: false, error: describe(error.message) };
  }

  // 2. Hitung ulang dan ganti hasil rekomendasi jika skor berubah
  if (changed.length > 0) {
    const ranked = recomputeRanking(assessment, ref, scoreOverrides);
    const del = await supabase.from("recommendation_results").delete().eq("assessment_id", assessment.id);
    if (del.error) return { success: false, error: describe(del.error.message) };
    const ins = await supabase.from("recommendation_results").insert(toRecommendationRows(assessment.id, ranked));
    if (ins.error) return { success: false, error: describe(ins.error.message) };
  }

  // 3. Perbarui status penilaian
  const newStatus = NEXT_STATUS[action];
  const { error: updateError } = await supabase
    .from("student_assessments")
    .update({
      status: newStatus,
      admin_note: note.trim() || null,
      override_internship_id: action === "correct" ? overrideInternshipId ?? null : assessment.override_internship_id ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", assessment.id);
  if (updateError) return { success: false, error: describe(updateError.message) };

  // 4. Catat riwayat pemeriksaan
  const { error: logError } = await supabase.from("review_logs").insert({
    assessment_id: assessment.id,
    admin_id: user.id,
    action,
    previous_status: assessment.status ?? "pending",
    new_status: newStatus,
    note: note.trim() || null,
  });
  if (logError) return { success: false, error: describe(logError.message) };

  return { success: true };
}

// ============================================================
// Pengelolaan lowongan & nilai target
// ============================================================

export interface TargetInput {
  competency_category_id: string;
  target_score: number;
  factor_type: FactorType;
}

export interface InternshipInput {
  id?: string;
  specialization_id: string;
  position_name: string;
  company_name: string;
  description: string;
  vacancy_url: string;
  is_active: boolean;
  targets: TargetInput[];
}

export function validateInternship(input: InternshipInput): string | null {
  if (!input.position_name.trim()) return "Nama posisi wajib diisi.";
  if (!input.company_name.trim()) return "Nama perusahaan atau instansi wajib diisi.";
  if (input.vacancy_url.trim() && !/^https?:\/\/\S+\.\S+/.test(input.vacancy_url.trim())) {
    return "Tautan lowongan harus diawali http:// atau https://.";
  }
  if (input.targets.some((t) => t.target_score < 1 || t.target_score > 4)) return "Nilai target harus 1 sampai 4.";
  if (!input.targets.some((t) => t.factor_type === "CORE")) return "Tandai minimal satu kompetensi sebagai core factor.";
  if (!input.targets.some((t) => t.factor_type === "SECONDARY")) {
    return "Sisakan minimal satu kompetensi sebagai secondary factor, supaya rumus 60% NCF + 40% NSF tetap berlaku.";
  }
  return null;
}

export async function saveInternship(input: InternshipInput): Promise<{ success: boolean; error?: string; id?: string }> {
  const invalid = validateInternship(input);
  if (invalid) return { success: false, error: invalid };

  const prefix = input.specialization_id === "spec_sage" ? "int_sage" : "int_delta";
  const id = input.id ?? `${prefix}_${Date.now().toString(36)}`;
  const row: Partial<Internship> & { id: string } = {
    id,
    specialization_id: input.specialization_id,
    position_name: input.position_name.trim(),
    company_name: input.company_name.trim(),
    description: input.description.trim(),
    vacancy_url: input.vacancy_url.trim(),
    is_active: input.is_active,
  };

  const { error } = await supabase.from("internships").upsert(row);
  if (error) return { success: false, error: describe(error.message) };

  const targets = input.targets.map((t) => ({
    id: `t_${id}_${t.competency_category_id}`,
    internship_id: id,
    competency_category_id: t.competency_category_id,
    target_score: t.target_score,
    factor_type: t.factor_type,
  }));

  // Target lama (mis. seed t1..t60) dihapus lalu diganti, agar tidak ada target ganda per kategori
  const del = await supabase.from("internship_targets").delete().eq("internship_id", id);
  if (del.error) return { success: false, error: describe(del.error.message) };
  const ins = await supabase.from("internship_targets").insert(targets);
  if (ins.error) return { success: false, error: describe(ins.error.message) };

  return { success: true, id };
}

export async function setInternshipActive(id: string, active: boolean) {
  const { error } = await supabase.from("internships").update({ is_active: active }).eq("id", id);
  return error ? { success: false, error: describe(error.message) } : { success: true };
}

export async function deleteInternship(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("internships").delete().eq("id", id);
  if (!error) return { success: true };
  if (error.code === "23503") {
    return {
      success: false,
      error: "Lowongan ini sudah tercatat di riwayat mahasiswa, jadi tidak bisa dihapus. Nonaktifkan saja.",
    };
  }
  return { success: false, error: describe(error.message) };
}

function describe(message: string) {
  if (/row-level security|permission denied/i.test(message)) {
    return "Akses ditolak. Pastikan akun ini terdaftar sebagai admin dan migration_002_admin.sql sudah dijalankan.";
  }
  if (isMissingSchemaError({ message })) {
    return "Struktur database belum lengkap. Jalankan supabase/migration_002_admin.sql di SQL Editor.";
  }
  return message;
}
