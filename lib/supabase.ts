import { createClient } from "@supabase/supabase-js";
import type { PMResult } from "./types";
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

export interface SavedAssessmentHistory {
  id: string;
  specialization_id: string;
  academic_weight: number;
  portfolio_weight: number;
  created_at: string;
  assessment_details: {
    id: string;
    competency_category_id: string;
    academic_score: number;
    portfolio_essay: string | null;
    evidence_url: string | null;
    portfolio_score_ai: number | null;
    ai_reasoning: string | null;
  }[];
  recommendation_results: {
    id: string;
    internship_id: string;
    na_score: number;
    np_score: number;
    final_score: number;
    match_percentage: number;
    rank_position: number;
  }[];
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
    return { success: false, error: "Supabase belum terkonfigurasi dengan lengkap." };
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Harap login terlebih dahulu untuk menyimpan riwayat rekomendasi.",
      };
    }

    // 1. Simpan Header Assessment
    const { data: assessmentData, error: assessmentError } = await supabase
      .from("student_assessments")
      .insert({
        user_id: user.id,
        specialization_id: payload.specializationId,
        academic_weight: payload.academicWeight ?? ACADEMIC_WEIGHT,
        portfolio_weight: payload.portfolioWeight ?? PORTFOLIO_WEIGHT,
      })
      .select("id")
      .single();

    if (assessmentError || !assessmentData) {
      return { success: false, error: assessmentError?.message || "Gagal membuat record assessment." };
    }

    const assessmentId = assessmentData.id;

    // 2. Simpan Detail Kategori Kompetensi
    if (payload.details && payload.details.length > 0) {
      const detailsToInsert = payload.details.map((d) => ({
        assessment_id: assessmentId,
        competency_category_id: d.categoryId,
        academic_score: d.academicScore,
        portfolio_essay: d.portfolioEssay || null,
        evidence_url: d.evidenceUrl || null,
        portfolio_score_ai: d.portfolioScoreAi || null,
        ai_reasoning: d.aiReasoning || null,
      }));

      const { error: detailsError } = await supabase
        .from("assessment_details")
        .insert(detailsToInsert);

      if (detailsError) {
        return { success: false, error: `Gagal menyimpan detail kompetensi: ${detailsError.message}` };
      }
    }

    // 3. Simpan Hasil Rekomendasi Per Lowongan
    if (payload.recommendations && payload.recommendations.length > 0) {
      const recsToInsert = payload.recommendations.map((r, index) => ({
        assessment_id: assessmentId,
        internship_id: r.internshipId,
        na_score: r.na,
        np_score: r.np,
        final_score: r.finalScore,
        match_percentage: r.matchPercentage,
        rank_position: index + 1,
      }));

      const { error: recsError } = await supabase
        .from("recommendation_results")
        .insert(recsToInsert);

      if (recsError) {
        return { success: false, error: `Gagal menyimpan hasil rekomendasi: ${recsError.message}` };
      }
    }

    return { success: true, assessmentId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga.";
    return { success: false, error: message };
  }
}

/**
 * Mengambil riwayat rekomendasi mahasiswa yang sedang login
 */
export async function getStudentAssessmentHistory(): Promise<{
  data: SavedAssessmentHistory[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: "Supabase belum terkonfigurasi." };
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: [], error: "Pengguna belum login." };
    }

    const { data, error } = await supabase
      .from("student_assessments")
      .select(`
        id,
        specialization_id,
        academic_weight,
        portfolio_weight,
        created_at,
        assessment_details (
          id,
          competency_category_id,
          academic_score,
          portfolio_essay,
          evidence_url,
          portfolio_score_ai,
          ai_reasoning
        ),
        recommendation_results (
          id,
          internship_id,
          na_score,
          np_score,
          final_score,
          match_percentage,
          rank_position
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as unknown as SavedAssessmentHistory[]) || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil riwayat.";
    return { data: [], error: message };
  }
}
