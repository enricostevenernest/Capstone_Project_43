import { createClient } from "@supabase/supabase-js";
import type { AssessmentStatus, PMResult } from "./types";
import { ACADEMIC_WEIGHT, PORTFOLIO_WEIGHT } from "./profile-matching";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    supabaseUrl.startsWith("http") &&
    Boolean(supabaseAnonKey) &&
    !supabaseAnonKey.includes("your_supabase_anon_key")
  );
};

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * true jika error berasal dari kolom/tabel/fungsi yang belum ada,
 * artinya migration_002_admin.sql belum dijalankan.
 */
export function isMissingSchemaError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  return ["42703", "42P01", "42883", "PGRST200", "PGRST202", "PGRST204"].includes(error.code ?? "")
    || /column|does not exist|schema cache/i.test(error.message ?? "");
}

// ============================================================
// Types untuk Supabase DB
// ============================================================

export interface AssessmentDetailPayload {
  categoryId: string;
  academicScore: number;
  portfolioEssay?: string;
  evidenceUrl?: string;
  portfolioScoreAi?: number;
  aiReasoning?: string;
}

export interface SaveAssessmentPayload {
  specializationId: string;
  academicWeight?: number;
  portfolioWeight?: number;
  details: AssessmentDetailPayload[];
  recommendations: PMResult[];
}

export interface SavedDetail {
  id: string;
  competency_category_id: string;
  academic_score: number;
  portfolio_essay: string | null;
  evidence_url: string | null;
  portfolio_score_ai: number | null;
  portfolio_score_admin?: number | null;
  ai_reasoning: string | null;
}

export interface SavedRecommendation {
  id: string;
  internship_id: string;
  na_score: number;
  np_score: number;
  final_score: number;
  match_percentage: number;
  rank_position: number;
}

export interface ReviewLog {
  id: string;
  action: "approve" | "correct" | "request_revision" | "reopen";
  previous_status: string | null;
  new_status: AssessmentStatus;
  note: string | null;
  created_at: string;
}

export interface SavedAssessmentHistory {
  id: string;
  user_id?: string;
  specialization_id: string;
  academic_weight: number;
  portfolio_weight: number;
  created_at: string;
  /** Kolom di bawah ini tersedia setelah migration_002_admin.sql dijalankan */
  student_name?: string | null;
  student_email?: string | null;
  status?: AssessmentStatus;
  admin_note?: string | null;
  override_internship_id?: string | null;
  reviewed_at?: string | null;
  assessment_details: SavedDetail[];
  recommendation_results: SavedRecommendation[];
  review_logs?: ReviewLog[];
}

const BASE_SELECT = `
  id, user_id, specialization_id, academic_weight, portfolio_weight, created_at,
  assessment_details ( id, competency_category_id, academic_score, portfolio_essay, evidence_url, portfolio_score_ai, ai_reasoning ),
  recommendation_results ( id, internship_id, na_score, np_score, final_score, match_percentage, rank_position )
`;

export const FULL_SELECT = `
  id, user_id, specialization_id, academic_weight, portfolio_weight, created_at,
  student_name, student_email, status, admin_note, override_internship_id, reviewed_at,
  assessment_details ( id, competency_category_id, academic_score, portfolio_essay, evidence_url, portfolio_score_ai, portfolio_score_admin, ai_reasoning ),
  recommendation_results ( id, internship_id, na_score, np_score, final_score, match_percentage, rank_position ),
  review_logs ( id, action, previous_status, new_status, note, created_at )
`;

/** Skor portofolio yang berlaku: koreksi admin jika ada, selain itu skor AI */
export function effectivePortfolioScore(d: SavedDetail) {
  return d.portfolio_score_admin ?? d.portfolio_score_ai ?? 1;
}

// ============================================================
// Helper Functions: Assessment History
// ============================================================

/**
 * Menyimpan hasil assessment & rekomendasi ke Supabase
 */
export async function saveAssessmentToSupabase(
  payload: SaveAssessmentPayload
): Promise<{ success: boolean; assessmentId?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase belum dikonfigurasi, jadi hasil belum bisa disimpan." };
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Masuk dulu supaya hasilnya bisa disimpan ke akunmu." };
    }

    const header = {
      user_id: user.id,
      specialization_id: payload.specializationId,
      academic_weight: payload.academicWeight ?? ACADEMIC_WEIGHT,
      portfolio_weight: payload.portfolioWeight ?? PORTFOLIO_WEIGHT,
    };

    // 1. Simpan header assessment (dengan identitas mahasiswa jika kolomnya sudah ada)
    let inserted = await supabase
      .from("student_assessments")
      .insert({
        ...header,
        student_name: (user.user_metadata?.full_name as string | undefined) || null,
        student_email: user.email ?? null,
      })
      .select("id")
      .single();

    if (inserted.error && isMissingSchemaError(inserted.error)) {
      inserted = await supabase.from("student_assessments").insert(header).select("id").single();
    }

    if (inserted.error || !inserted.data) {
      return { success: false, error: inserted.error?.message || "Gagal membuat catatan penilaian." };
    }

    const assessmentId = inserted.data.id as string;

    // 2. Simpan detail kategori kompetensi
    if (payload.details.length > 0) {
      const detailsToInsert = payload.details.map((d) => ({
        assessment_id: assessmentId,
        competency_category_id: d.categoryId,
        academic_score: d.academicScore,
        portfolio_essay: d.portfolioEssay || null,
        evidence_url: d.evidenceUrl || null,
        portfolio_score_ai: d.portfolioScoreAi || null,
        ai_reasoning: d.aiReasoning || null,
      }));

      const { error: detailsError } = await supabase.from("assessment_details").insert(detailsToInsert);

      if (detailsError) {
        return { success: false, error: `Detail kompetensi gagal disimpan: ${detailsError.message}` };
      }
    }

    // 3. Simpan hasil rekomendasi per lowongan
    if (payload.recommendations.length > 0) {
      const { error: recsError } = await supabase
        .from("recommendation_results")
        .insert(toRecommendationRows(assessmentId, payload.recommendations));

      if (recsError) {
        return { success: false, error: `Hasil rekomendasi gagal disimpan: ${recsError.message}` };
      }
    }

    return { success: true, assessmentId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.";
    return { success: false, error: message };
  }
}

export function toRecommendationRows(assessmentId: string, ranked: PMResult[]) {
  return ranked.map((r, index) => ({
    assessment_id: assessmentId,
    internship_id: r.internshipId,
    na_score: r.na,
    np_score: r.np,
    final_score: r.finalScore,
    match_percentage: r.matchPercentage,
    rank_position: index + 1,
  }));
}

/**
 * Mengambil riwayat penilaian. Tanpa filter user bila dipanggil admin
 * (RLS yang membatasi baris mana yang terlihat).
 */
export async function fetchAssessments(userId?: string): Promise<{ data: SavedAssessmentHistory[]; error?: string }> {
  const run = (columns: string) => {
    let query = supabase.from("student_assessments").select(columns).order("created_at", { ascending: false });
    if (userId) query = query.eq("user_id", userId);
    return query;
  };

  let res = await run(FULL_SELECT);
  if (res.error && isMissingSchemaError(res.error)) res = await run(BASE_SELECT);
  if (res.error) return { data: [], error: res.error.message };
  return { data: (res.data as unknown as SavedAssessmentHistory[]) || [] };
}

/**
 * Mengambil riwayat rekomendasi mahasiswa yang sedang login
 */
export async function getStudentAssessmentHistory(): Promise<{
  data: SavedAssessmentHistory[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: "Supabase belum dikonfigurasi." };
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: [], error: "Kamu belum masuk." };
    }

    return await fetchAssessments(user.id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Riwayat gagal diambil.";
    return { data: [], error: message };
  }
}
