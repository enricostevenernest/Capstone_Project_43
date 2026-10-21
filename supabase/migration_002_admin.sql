-- ============================================================
-- Capstone Project 43 — Migrasi 002: Peran Admin
-- UC-10 Memeriksa hasil rekomendasi, UC-11 Memvalidasi/mengoreksi,
-- UC-12 Mengelola hasil rekomendasi, FR Mengelola data lowongan.
--
-- Jalankan SETELAH migration.sql, di Supabase SQL Editor.
-- Skrip ini aman dijalankan ulang.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Daftar admin & fungsi pengecekan
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User bisa cek status admin sendiri" ON admin_users;
CREATE POLICY "User bisa cek status admin sendiri"
  ON admin_users FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- SECURITY DEFINER agar bisa dipakai di policy tabel lain tanpa rekursi RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated;

-- ------------------------------------------------------------
-- 2. Kolom tambahan
-- ------------------------------------------------------------
ALTER TABLE internships
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE student_assessments
  ADD COLUMN IF NOT EXISTS student_name TEXT,
  ADD COLUMN IF NOT EXISTS student_email TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS override_internship_id TEXT REFERENCES internships(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE student_assessments DROP CONSTRAINT IF EXISTS student_assessments_status_check;
ALTER TABLE student_assessments
  ADD CONSTRAINT student_assessments_status_check
  CHECK (status IN ('pending', 'approved', 'corrected', 'needs_revision'));

ALTER TABLE assessment_details
  ADD COLUMN IF NOT EXISTS portfolio_score_admin INTEGER;

ALTER TABLE assessment_details DROP CONSTRAINT IF EXISTS assessment_details_portfolio_score_admin_check;
ALTER TABLE assessment_details
  ADD CONSTRAINT assessment_details_portfolio_score_admin_check
  CHECK (portfolio_score_admin IS NULL OR portfolio_score_admin BETWEEN 1 AND 4);

CREATE INDEX IF NOT EXISTS idx_assessment_status ON student_assessments(status);

-- ------------------------------------------------------------
-- 3. Riwayat pemeriksaan admin
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES student_assessments(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('approve', 'correct', 'request_revision', 'reopen')),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_logs_assessment ON review_logs(assessment_id);

ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin bisa baca semua log" ON review_logs;
CREATE POLICY "Admin bisa baca semua log"
  ON review_logs FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Mahasiswa bisa baca log penilaian sendiri" ON review_logs;
CREATE POLICY "Mahasiswa bisa baca log penilaian sendiri"
  ON review_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_assessments sa
      WHERE sa.id = review_logs.assessment_id AND sa.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin bisa menulis log" ON review_logs;
CREATE POLICY "Admin bisa menulis log"
  ON review_logs FOR INSERT TO authenticated
  WITH CHECK (is_admin() AND admin_id = auth.uid());

-- ------------------------------------------------------------
-- 4. Hak akses admin pada data penilaian
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admin bisa baca semua assessment" ON student_assessments;
CREATE POLICY "Admin bisa baca semua assessment"
  ON student_assessments FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admin bisa mengubah assessment" ON student_assessments;
CREATE POLICY "Admin bisa mengubah assessment"
  ON student_assessments FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin bisa baca semua detail" ON assessment_details;
CREATE POLICY "Admin bisa baca semua detail"
  ON assessment_details FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admin bisa mengubah detail" ON assessment_details;
CREATE POLICY "Admin bisa mengubah detail"
  ON assessment_details FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin bisa baca semua rekomendasi" ON recommendation_results;
CREATE POLICY "Admin bisa baca semua rekomendasi"
  ON recommendation_results FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admin bisa menulis rekomendasi" ON recommendation_results;
CREATE POLICY "Admin bisa menulis rekomendasi"
  ON recommendation_results FOR INSERT TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin bisa menghapus rekomendasi" ON recommendation_results;
CREATE POLICY "Admin bisa menghapus rekomendasi"
  ON recommendation_results FOR DELETE TO authenticated
  USING (is_admin());

-- ------------------------------------------------------------
-- 5. Hak akses admin pada data lowongan & nilai target
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admin bisa menambah lowongan" ON internships;
CREATE POLICY "Admin bisa menambah lowongan"
  ON internships FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin bisa mengubah lowongan" ON internships;
CREATE POLICY "Admin bisa mengubah lowongan"
  ON internships FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin bisa menghapus lowongan" ON internships;
CREATE POLICY "Admin bisa menghapus lowongan"
  ON internships FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admin bisa menambah target" ON internship_targets;
CREATE POLICY "Admin bisa menambah target"
  ON internship_targets FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin bisa mengubah target" ON internship_targets;
CREATE POLICY "Admin bisa mengubah target"
  ON internship_targets FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin bisa menghapus target" ON internship_targets;
CREATE POLICY "Admin bisa menghapus target"
  ON internship_targets FOR DELETE TO authenticated USING (is_admin());

-- ------------------------------------------------------------
-- 6. Sinkronisasi nilai target ke skala 1-4 (Tabel 26 & 27 laporan)
-- Database lama masih memakai skala 1-5. Baris seed t1..t60 disamakan
-- dengan lib/targets.ts, lalu batasan 1-4 dipasang ulang.
-- Target yang dibuat lewat halaman admin (id t_...) tidak tersentuh.
-- ------------------------------------------------------------
ALTER TABLE internship_targets DROP CONSTRAINT IF EXISTS internship_targets_target_score_check;

UPDATE internship_targets AS t
SET target_score = v.score, factor_type = v.factor
FROM (VALUES
    ('t1', 3, 'CORE'),
    ('t2', 2, 'SECONDARY'),
    ('t3', 3, 'CORE'),
    ('t4', 4, 'CORE'),
    ('t5', 2, 'SECONDARY'),
    ('t6', 1, 'SECONDARY'),
    ('t7', 4, 'CORE'),
    ('t8', 2, 'SECONDARY'),
    ('t9', 4, 'CORE'),
    ('t10', 3, 'CORE'),
    ('t11', 3, 'SECONDARY'),
    ('t12', 1, 'SECONDARY'),
    ('t13', 2, 'SECONDARY'),
    ('t14', 4, 'CORE'),
    ('t15', 2, 'SECONDARY'),
    ('t16', 2, 'SECONDARY'),
    ('t17', 4, 'CORE'),
    ('t18', 3, 'CORE'),
    ('t19', 1, 'SECONDARY'),
    ('t20', 3, 'CORE'),
    ('t21', 1, 'SECONDARY'),
    ('t22', 1, 'SECONDARY'),
    ('t23', 3, 'CORE'),
    ('t24', 4, 'CORE'),
    ('t25', 3, 'CORE'),
    ('t26', 3, 'SECONDARY'),
    ('t27', 3, 'CORE'),
    ('t28', 4, 'CORE'),
    ('t29', 2, 'SECONDARY'),
    ('t30', 2, 'SECONDARY'),
    ('t31', 2, 'SECONDARY'),
    ('t32', 4, 'CORE'),
    ('t33', 3, 'CORE'),
    ('t34', 3, 'CORE'),
    ('t35', 2, 'SECONDARY'),
    ('t36', 2, 'SECONDARY'),
    ('t37', 4, 'CORE'),
    ('t38', 4, 'CORE'),
    ('t39', 3, 'SECONDARY'),
    ('t40', 2, 'SECONDARY'),
    ('t41', 3, 'CORE'),
    ('t42', 3, 'SECONDARY'),
    ('t43', 3, 'CORE'),
    ('t44', 2, 'SECONDARY'),
    ('t45', 4, 'CORE'),
    ('t46', 2, 'SECONDARY'),
    ('t47', 4, 'CORE'),
    ('t48', 2, 'SECONDARY'),
    ('t49', 2, 'SECONDARY'),
    ('t50', 2, 'SECONDARY'),
    ('t51', 4, 'CORE'),
    ('t52', 2, 'SECONDARY'),
    ('t53', 3, 'CORE'),
    ('t54', 3, 'CORE'),
    ('t55', 4, 'CORE'),
    ('t56', 3, 'SECONDARY'),
    ('t57', 3, 'SECONDARY'),
    ('t58', 2, 'SECONDARY'),
    ('t59', 4, 'CORE'),
    ('t60', 3, 'CORE')
) AS v(id, score, factor)
WHERE t.id = v.id;

ALTER TABLE internship_targets
  ADD CONSTRAINT internship_targets_target_score_check CHECK (target_score BETWEEN 1 AND 4);

-- ============================================================
-- Menjadikan sebuah akun admin (akun harus sudah terdaftar di aplikasi):
--
--   INSERT INTO admin_users (user_id)
--   SELECT id FROM auth.users WHERE email = 'email.admin@contoh.ac.id'
--   ON CONFLICT DO NOTHING;
-- ============================================================
