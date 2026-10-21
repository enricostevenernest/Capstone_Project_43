-- ============================================================
-- Capstone Project 43 — Database Schema & Seed Data
-- SPK Rekomendasi Tempat Magang (Profile Matching + Gemini AI)
-- 
-- Jalankan SQL ini di Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → Paste → Run
-- ============================================================

-- ============================================================
-- 1. TABEL UTAMA
-- ============================================================

-- 1.1 Peminatan (SAGE / DELTA)
CREATE TABLE IF NOT EXISTS specializations (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE CHECK (code IN ('SAGE', 'DELTA')),
  name TEXT NOT NULL,
  description TEXT NOT NULL
);

-- 1.2 Kategori Kompetensi (6 per peminatan)
CREATE TABLE IF NOT EXISTS competency_categories (
  id TEXT PRIMARY KEY,
  specialization_id TEXT NOT NULL REFERENCES specializations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  description TEXT NOT NULL
);

-- 1.3 Mata Kuliah
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  competency_category_id TEXT NOT NULL REFERENCES competency_categories(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL
);

-- 1.4 Lowongan Magang
CREATE TABLE IF NOT EXISTS internships (
  id TEXT PRIMARY KEY,
  specialization_id TEXT NOT NULL REFERENCES specializations(id) ON DELETE CASCADE,
  position_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT NOT NULL,
  vacancy_url TEXT NOT NULL
);

-- 1.5 Target Skor Internship per Kompetensi
CREATE TABLE IF NOT EXISTS internship_targets (
  id TEXT PRIMARY KEY,
  internship_id TEXT NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  competency_category_id TEXT NOT NULL REFERENCES competency_categories(id) ON DELETE CASCADE,
  target_score INTEGER NOT NULL CHECK (target_score BETWEEN 1 AND 4),
  factor_type TEXT NOT NULL CHECK (factor_type IN ('CORE', 'SECONDARY'))
);

-- 1.6 Penilaian Mahasiswa (History)
CREATE TABLE IF NOT EXISTS student_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialization_id TEXT NOT NULL REFERENCES specializations(id),
  academic_weight NUMERIC(3,2) NOT NULL DEFAULT 0.4,
  portfolio_weight NUMERIC(3,2) NOT NULL DEFAULT 0.6,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.7 Detail Penilaian per Kategori Kompetensi
CREATE TABLE IF NOT EXISTS assessment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES student_assessments(id) ON DELETE CASCADE,
  competency_category_id TEXT NOT NULL REFERENCES competency_categories(id),
  academic_score NUMERIC(3,2) NOT NULL CHECK (academic_score BETWEEN 0.00 AND 4.00),
  portfolio_essay TEXT,
  evidence_url TEXT,
  portfolio_score_ai INTEGER CHECK (portfolio_score_ai BETWEEN 1 AND 4),
  ai_reasoning TEXT
);

-- 1.8 Hasil Rekomendasi per Lowongan
CREATE TABLE IF NOT EXISTS recommendation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES student_assessments(id) ON DELETE CASCADE,
  internship_id TEXT NOT NULL REFERENCES internships(id),
  na_score NUMERIC(5,3) NOT NULL,
  np_score NUMERIC(5,3) NOT NULL,
  final_score NUMERIC(5,3) NOT NULL,
  match_percentage NUMERIC(5,2) NOT NULL,
  rank_position INTEGER NOT NULL
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_assessment_user ON student_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_details_assessment ON assessment_details(assessment_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_assessment ON recommendation_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_internship_targets_internship ON internship_targets(internship_id);

-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- (DROP POLICY IF EXISTS membuat skrip aman dijalankan ulang)
-- ============================================================

-- Data referensi (read-only untuk semua authenticated users)
ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Semua user bisa baca specializations" ON specializations;
CREATE POLICY "Semua user bisa baca specializations"
  ON specializations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Semua user bisa baca competency_categories" ON competency_categories;
CREATE POLICY "Semua user bisa baca competency_categories"
  ON competency_categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Semua user bisa baca courses" ON courses;
CREATE POLICY "Semua user bisa baca courses"
  ON courses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Semua user bisa baca internships" ON internships;
CREATE POLICY "Semua user bisa baca internships"
  ON internships FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Semua user bisa baca internship_targets" ON internship_targets;
CREATE POLICY "Semua user bisa baca internship_targets"
  ON internship_targets FOR SELECT TO anon, authenticated USING (true);

-- Data mahasiswa (hanya bisa akses milik sendiri)
ALTER TABLE student_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User bisa baca assessment sendiri" ON student_assessments;
CREATE POLICY "User bisa baca assessment sendiri"
  ON student_assessments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User bisa insert assessment sendiri" ON student_assessments;
CREATE POLICY "User bisa insert assessment sendiri"
  ON student_assessments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User bisa baca detail assessment sendiri" ON assessment_details;
CREATE POLICY "User bisa baca detail assessment sendiri"
  ON assessment_details FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_assessments sa
      WHERE sa.id = assessment_details.assessment_id
      AND sa.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "User bisa insert detail assessment sendiri" ON assessment_details;
CREATE POLICY "User bisa insert detail assessment sendiri"
  ON assessment_details FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_assessments sa
      WHERE sa.id = assessment_details.assessment_id
      AND sa.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "User bisa baca rekomendasi sendiri" ON recommendation_results;
CREATE POLICY "User bisa baca rekomendasi sendiri"
  ON recommendation_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_assessments sa
      WHERE sa.id = recommendation_results.assessment_id
      AND sa.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "User bisa insert rekomendasi sendiri" ON recommendation_results;
CREATE POLICY "User bisa insert rekomendasi sendiri"
  ON recommendation_results FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_assessments sa
      WHERE sa.id = recommendation_results.assessment_id
      AND sa.user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. SEED DATA — Peminatan
-- ============================================================

INSERT INTO specializations (id, code, name, description) VALUES
  ('spec_sage', 'SAGE', 'SAGE', 'Software and IT Governance Engineering'),
  ('spec_delta', 'DELTA', 'DELTA', 'Data Exploration, Learning & Translational Analytics')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. SEED DATA — Kategori Kompetensi
-- ============================================================

INSERT INTO competency_categories (id, specialization_id, name, short_name, description) VALUES
  ('sage_1', 'spec_sage', 'Pemrograman Berorientasi Objek', 'PBO', 'OOP'),
  ('sage_2', 'spec_sage', 'Analisis dan Perancangan SI', 'APSI', 'Analisis'),
  ('sage_3', 'spec_sage', 'Algoritma dan Pemrograman', 'Algoritma', 'Algoritma'),
  ('sage_4', 'spec_sage', 'Pengembangan Aplikasi Website', 'Web Dev', 'Web'),
  ('sage_5', 'spec_sage', 'Arsitektur Enterprise', 'AE', 'AE'),
  ('sage_6', 'spec_sage', 'Tata Kelola dan Manajemen TI', 'TGTI', 'TGTI'),
  ('delta_1', 'spec_delta', 'Penambangan Data', 'Data Mining', 'Mining'),
  ('delta_2', 'spec_delta', 'Probabilitas dan Statistik', 'ProbStat', 'ProbStat'),
  ('delta_3', 'spec_delta', 'Sistem Basis Data', 'SBD', 'SBD'),
  ('delta_4', 'spec_delta', 'Statistika Industri', 'Stat Industri', 'Stat'),
  ('delta_5', 'spec_delta', 'Data Warehouse dan BI', 'DWBI', 'DWBI'),
  ('delta_6', 'spec_delta', 'Matematika Diskrit', 'MatDis', 'MatDis')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. SEED DATA — Mata Kuliah
-- ============================================================

INSERT INTO courses (id, competency_category_id, code, name) VALUES
  ('c_sage_1a', 'sage_1', 'IS2113', 'Pemrograman Berorientasi Objek'),
  ('c_sage_2a', 'sage_2', 'IS3214', 'Analisis dan Perancangan SI'),
  ('c_sage_3a', 'sage_3', 'IS1212', 'Algoritma dan Pemrograman'),
  ('c_sage_4a', 'sage_4', 'IS3223', 'Pengembangan Aplikasi Website'),
  ('c_sage_5a', 'sage_5', 'IS4312', 'Arsitektur Enterprise'),
  ('c_sage_6a', 'sage_6', 'IS4323', 'Tata Kelola dan Manajemen TI'),
  ('c_delta_1a', 'delta_1', 'IS3423', 'Penambangan Data'),
  ('c_delta_2a', 'delta_2', 'IS2212', 'Probabilitas dan Statistik'),
  ('c_delta_3a', 'delta_3', 'IS2223', 'Sistem Basis Data'),
  ('c_delta_4a', 'delta_4', 'IS3323', 'Statistika Industri'),
  ('c_delta_5a', 'delta_5', 'IS4223', 'Data Warehouse dan BI'),
  ('c_delta_6a', 'delta_6', 'IS1213', 'Matematika Diskrit')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. SEED DATA — Lowongan Magang
-- ============================================================

INSERT INTO internships (id, specialization_id, position_name, company_name, description, vacancy_url) VALUES
  ('int_sage_1', 'spec_sage', 'Frontend Developer Intern', 'Telkom Digital Solution', 'Antarmuka web responsif React/Next.js', 'https://karir.telkom.co.id'),
  ('int_sage_2', 'spec_sage', 'Backend Developer Intern', 'BUMN Startup Hub', 'REST API, microservices', 'https://linkedin.com/jobs'),
  ('int_sage_3', 'spec_sage', 'System Analyst Intern', 'PT Sigma Cipta Caraka', 'Analisis kebutuhan, UML', 'https://telkomindonesia.co.id/karir'),
  ('int_sage_4', 'spec_sage', 'IT Governance Intern', 'Kementerian BUMN', 'Audit tata kelola TI, COBIT & ITIL', 'https://rekrutmenbersama.fhcibumn.id'),
  ('int_sage_5', 'spec_sage', 'Fullstack Developer Intern', 'UMKM Digital Nusantara', 'End-to-end web app UMKM', 'https://glints.com/id'),
  ('int_delta_1', 'spec_delta', 'Data Analyst Intern', 'Telkom Data Analytics Center', 'Analisis data bisnis', 'https://karir.telkom.co.id'),
  ('int_delta_2', 'spec_delta', 'Data Scientist Intern', 'BigBox AI - Telkom', 'Machine learning, data mining', 'https://bigbox.co.id/career'),
  ('int_delta_3', 'spec_delta', 'Business Intelligence Intern', 'PT Telekomunikasi Indonesia', 'ETL, data warehouse, BI', 'https://telkomindonesia.co.id/karir'),
  ('int_delta_4', 'spec_delta', 'Database Administrator Intern', 'Finnet Indonesia', 'Manajemen database, optimasi query', 'https://finnet.co.id/karir'),
  ('int_delta_5', 'spec_delta', 'Machine Learning Engineer Intern', 'Amartha Data Lab', 'Pipeline ML dan deployment', 'https://glints.com/id')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. SEED DATA — Target Skor Internship
-- ============================================================

INSERT INTO internship_targets (id, internship_id, competency_category_id, target_score, factor_type) VALUES
  -- SAGE: Frontend Developer
  ('t1',  'int_sage_1', 'sage_1', 3, 'CORE'),
  ('t2',  'int_sage_1', 'sage_2', 2, 'SECONDARY'),
  ('t3',  'int_sage_1', 'sage_3', 3, 'CORE'),
  ('t4',  'int_sage_1', 'sage_4', 4, 'CORE'),
  ('t5',  'int_sage_1', 'sage_5', 2, 'SECONDARY'),
  ('t6',  'int_sage_1', 'sage_6', 1, 'SECONDARY'),
  -- SAGE: Backend Developer
  ('t7',  'int_sage_2', 'sage_1', 4, 'CORE'),
  ('t8',  'int_sage_2', 'sage_2', 2, 'SECONDARY'),
  ('t9',  'int_sage_2', 'sage_3', 4, 'CORE'),
  ('t10', 'int_sage_2', 'sage_4', 3, 'CORE'),
  ('t11', 'int_sage_2', 'sage_5', 3, 'SECONDARY'),
  ('t12', 'int_sage_2', 'sage_6', 1, 'SECONDARY'),
  -- SAGE: System Analyst
  ('t13', 'int_sage_3', 'sage_1', 2, 'SECONDARY'),
  ('t14', 'int_sage_3', 'sage_2', 4, 'CORE'),
  ('t15', 'int_sage_3', 'sage_3', 2, 'SECONDARY'),
  ('t16', 'int_sage_3', 'sage_4', 2, 'SECONDARY'),
  ('t17', 'int_sage_3', 'sage_5', 4, 'CORE'),
  ('t18', 'int_sage_3', 'sage_6', 3, 'CORE'),
  -- SAGE: IT Governance
  ('t19', 'int_sage_4', 'sage_1', 1, 'SECONDARY'),
  ('t20', 'int_sage_4', 'sage_2', 3, 'CORE'),
  ('t21', 'int_sage_4', 'sage_3', 1, 'SECONDARY'),
  ('t22', 'int_sage_4', 'sage_4', 1, 'SECONDARY'),
  ('t23', 'int_sage_4', 'sage_5', 3, 'CORE'),
  ('t24', 'int_sage_4', 'sage_6', 4, 'CORE'),
  -- SAGE: Fullstack Developer
  ('t25', 'int_sage_5', 'sage_1', 3, 'CORE'),
  ('t26', 'int_sage_5', 'sage_2', 3, 'SECONDARY'),
  ('t27', 'int_sage_5', 'sage_3', 3, 'CORE'),
  ('t28', 'int_sage_5', 'sage_4', 4, 'CORE'),
  ('t29', 'int_sage_5', 'sage_5', 2, 'SECONDARY'),
  ('t30', 'int_sage_5', 'sage_6', 2, 'SECONDARY'),
  -- DELTA: Data Analyst
  ('t31', 'int_delta_1', 'delta_1', 2, 'SECONDARY'),
  ('t32', 'int_delta_1', 'delta_2', 4, 'CORE'),
  ('t33', 'int_delta_1', 'delta_3', 3, 'CORE'),
  ('t34', 'int_delta_1', 'delta_4', 3, 'CORE'),
  ('t35', 'int_delta_1', 'delta_5', 2, 'SECONDARY'),
  ('t36', 'int_delta_1', 'delta_6', 2, 'SECONDARY'),
  -- DELTA: Data Scientist
  ('t37', 'int_delta_2', 'delta_1', 4, 'CORE'),
  ('t38', 'int_delta_2', 'delta_2', 4, 'CORE'),
  ('t39', 'int_delta_2', 'delta_3', 3, 'SECONDARY'),
  ('t40', 'int_delta_2', 'delta_4', 2, 'SECONDARY'),
  ('t41', 'int_delta_2', 'delta_5', 3, 'CORE'),
  ('t42', 'int_delta_2', 'delta_6', 3, 'SECONDARY'),
  -- DELTA: Business Intelligence
  ('t43', 'int_delta_3', 'delta_1', 3, 'CORE'),
  ('t44', 'int_delta_3', 'delta_2', 2, 'SECONDARY'),
  ('t45', 'int_delta_3', 'delta_3', 4, 'CORE'),
  ('t46', 'int_delta_3', 'delta_4', 2, 'SECONDARY'),
  ('t47', 'int_delta_3', 'delta_5', 4, 'CORE'),
  ('t48', 'int_delta_3', 'delta_6', 2, 'SECONDARY'),
  -- DELTA: Database Administrator
  ('t49', 'int_delta_4', 'delta_1', 2, 'SECONDARY'),
  ('t50', 'int_delta_4', 'delta_2', 2, 'SECONDARY'),
  ('t51', 'int_delta_4', 'delta_3', 4, 'CORE'),
  ('t52', 'int_delta_4', 'delta_4', 2, 'SECONDARY'),
  ('t53', 'int_delta_4', 'delta_5', 3, 'CORE'),
  ('t54', 'int_delta_4', 'delta_6', 3, 'CORE'),
  -- DELTA: Machine Learning Engineer
  ('t55', 'int_delta_5', 'delta_1', 4, 'CORE'),
  ('t56', 'int_delta_5', 'delta_2', 3, 'SECONDARY'),
  ('t57', 'int_delta_5', 'delta_3', 3, 'SECONDARY'),
  ('t58', 'int_delta_5', 'delta_4', 2, 'SECONDARY'),
  ('t59', 'int_delta_5', 'delta_5', 4, 'CORE'),
  ('t60', 'int_delta_5', 'delta_6', 3, 'CORE')
ON CONFLICT (id) DO UPDATE SET target_score = EXCLUDED.target_score;

-- ============================================================
-- Selesai! Verifikasi dengan:
-- SELECT COUNT(*) FROM specializations;        -- expected: 2
-- SELECT COUNT(*) FROM competency_categories;  -- expected: 12
-- SELECT COUNT(*) FROM courses;                -- expected: 12
-- SELECT COUNT(*) FROM internships;            -- expected: 10
-- SELECT COUNT(*) FROM internship_targets;     -- expected: 60
-- ============================================================
