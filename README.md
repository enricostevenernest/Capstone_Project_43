# Sistem Pendukung Keputusan (SPK) Rekomendasi Tempat Magang Mahasiswa

**Capstone Project - Kelompok 43 | S1 Sistem Informasi Telkom University Jakarta**

Aplikasi web Sistem Pendukung Keputusan (SPK) berbasis metode **Profile Matching** dan **Smart Rubric Evaluator (Google Gemini AI)** untuk menentukan rekomendasi bidang dan tempat magang (KPPM) berdasarkan profil kompetensi mahasiswa (Peminatan, Nilai Akademik, dan Portofolio).

---

## Tim Pengembang (Kelompok 43)

- **Enrico Steven Ernest** (102042300075)
- **Muhammad Abrar Rayhan** (102042330088)
- **Linggar Adhi Wibowo** (102042300151)
- **Refa Dias Adelia** (102042300040)

**Dosen Pembimbing Akademik:** Hafidza Safara Zahratunnisa S.T., M.Kom.

---

## Tech Stack (Zero-Budget / Free-Tier Optimized)

- **Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- **Styling & UI:** Tailwind CSS v4 + komponen UI ringan (gaya shadcn/ui) + Lucide Icons
- **Data Visualization:** Recharts (Radar Chart / Spider Chart & Bar Chart)
- **Database & Auth:** Supabase (PostgreSQL)
- **AI Portfolio Evaluator:** Google Gemini API (`@google/genai` - `gemini-3.8-flash` Structured JSON Output)
- **Deployment:** Vercel (Free Tier)

---

## Alur Utama Sistem (End-to-End Workflow)

1. **Pemilihan Peminatan (Initial Filtering):** Mahasiswa memilih peminatan **SAGE** (_Software and IT Governance Engineering_) atau **DELTA** (_Data Exploration, Learning & Translational Analytics_).
2. **Input Nilai Akademik (Knowledge Representation):** Mahasiswa memasukkan nilai huruf (`A`, `AB`, `B`, `BC`, `C`, `D`, `E`) pada mata kuliah yang relevan dengan kategori kompetensi di peminatannya. Sistem mengonversi nilai ke bobot nilai mutu (`0.00` - `4.00`) dan menghitung rata-rata per kategori kompetensi.
3. **Input Essay Portofolio & Bukti (Smart Rubric Assessment):** Mahasiswa menuliskan deskripsi/essay pengalaman proyek, studi kasus, atau sertifikasi per kategori kompetensi beserta tautan bukti (GitHub/Drive/Sertifikat). Form ini opsional; kategori yang dikosongkan otomatis mendapat Skor 1.
4. **AI Rubric Evaluation & Preview:** Modul Gemini AI mengevaluasi essay secara objektif ke dalam skala `1 - 4` berdasarkan rubrik Paulson dkk. beserta alasan penilaiannya. Mahasiswa melihat _Transparent Preview_ ringkasan profil kompetensinya sebelum dikalkulasi.
5. **Perhitungan Profile Matching (8 Tahap Kusrini):**
   - Menghitung $\text{GAP} = \text{Nilai Profil Mahasiswa} - \text{Nilai Target Magang}$.
   - Memetakan bobot nilai GAP (Skala `1.0` s.d. `5.0`).
   - Menghitung rata-rata _Core Factor_ ($NCF$) dan _Secondary Factor_ ($NSF$) untuk Aspek Akademik ($Na$) dan Aspek Portofolio ($Np$) dengan proporsi $60\% \text{ CF} + 40\% \text{ SF}$.
   - Menghitung Nilai Akhir $= (W_a \times Na) + (W_p \times Np)$ dan mengonversinya menjadi **Persentase Kecocokan** $= (\text{Nilai Akhir} / 5) \times 100\%$.
6. **Perankingan & Rekomendasi Utama:** Sistem mengurutkan tempat/bidang magang dari persentase tertinggi ke terendah, menampilkan perbandingan profil terhadap target, saran pengembangan untuk kompetensi yang masih kurang, detail lowongan, dan menyimpan riwayat rekomendasi.
7. **Pemeriksaan Admin (UC-10, UC-11, UC-12):** Admin program studi membuka `/admin` untuk memeriksa hasil yang disimpan mahasiswa, memvalidasi, mengoreksi skor portofolio atau rekomendasi akhir (wajib dengan alasan, peringkat dihitung ulang otomatis), atau meminta perbaikan. Status dan catatan admin tampil di riwayat mahasiswa.
8. **Pengelolaan Lowongan:** Admin menambah, mengubah, menyembunyikan, atau menghapus lowongan beserta nilai target dan pembagian core/secondary factor di `/admin/lowongan`.

---

## Pemetaan Kategori Kompetensi & Rubrik

### 1. Kategori Kompetensi per Peminatan

- **SAGE:**
  1. Nilai Mata Kuliah Pemrograman Berorientasi Objek
  2. Nilai Mata Kuliah Analisis dan Perancangan Sistem Informasi
  3. Nilai Mata Kuliah Algoritma dan Pemrograman
  4. Nilai Mata Kuliah Pengembangan Aplikasi Website
  5. Nilai Mata Kuliah Arsitektur Enterprise
  6. Nilai Mata Kuliah Tata Kelola dan Manajemen Teknologi Informasi

- **DELTA:**
  1. Nilai Mata Kuliah Penambangan Data
  2. Nilai Mata Kuliah Probabilitas dan Statistik
  3. Nilai Mata Kuliah Sistem Basis Data
  4. Nilai Mata Kuliah Statistika Industri
  5. Nilai Mata Kuliah Data Warehouse dan Business Intelligence
  6. Nilai Mata Kuliah Matematika Diskrit

### 2. Konversi Nilai Akademik

| Nilai Huruf | Bobot Nilai Mutu |
| :---------: | :--------------: |
|    **A**    |       4.00       |
|   **AB**    |       3.50       |
|    **B**    |       3.00       |
|   **BC**    |       2.50       |
|    **C**    |       2.00       |
|    **D**    |       1.00       |
|    **E**    |       0.00       |

_Catatan: Jika satu kategori kompetensi diwakili lebih dari satu mata kuliah, nilai mutu dirata-ratakan dalam skala 4.00._

### 3. Rubrik Penilaian Portofolio (Skala 1 - 4)

- **Skor 1:** Tidak terdapat bukti portofolio atau isi essay tidak relevan dengan kategori kompetensi.
- **Skor 2:** Berkaitan dengan kategori kompetensi, tetapi masih bersifat latihan dasar / tutorial sederhana.
- **Skor 3:** Proyek relevan dengan kompleksitas menengah (Tugas Besar, studi kasus nyata UMKM/instansi, _freelance_, sertifikasi profesional).
- **Skor 4:** Proyek relevan, kompleks, dan terbukti hasilnya secara nyata (digunakan pengguna nyata di _production_ atau meraih penghargaan kompetisi).

### 4. Tabel Bobot Nilai GAP (Kusrini, 2007)

| Selisih (GAP) | Bobot Nilai | Keterangan                                      |
| :-----------: | :---------: | :---------------------------------------------- |
|     **0**     |   **5.0**   | Tidak ada selisih (Kompetensi sesuai kebutuhan) |
|     **1**     |   **4.5**   | Kompetensi lebih 1 tingkat                      |
|    **-1**     |   **4.0**   | Kompetensi kurang 1 tingkat                     |
|     **2**     |   **3.5**   | Kompetensi lebih 2 tingkat                      |
|    **-2**     |   **3.0**   | Kompetensi kurang 2 tingkat                     |
|     **3**     |   **2.5**   | Kompetensi lebih 3 tingkat                      |
|    **-3**     |   **2.0**   | Kompetensi kurang 3 tingkat                     |
|     **4**     |   **1.5**   | Kompetensi lebih 4 tingkat                      |
|    **-4**     |   **1.0**   | Kompetensi kurang 4 tingkat                     |

---

## Skema Database (Supabase PostgreSQL)

1. `specializations`: `id`, `code` (`SAGE` | `DELTA`), `name`, `description`
2. `competency_categories`: `id`, `specialization_id`, `name`, `description`
3. `courses`: `id`, `competency_category_id`, `code`, `name`, `credits`
4. `internships`: `id`, `specialization_id`, `position_name`, `company_name`, `description`, `vacancy_url`
5. `internship_targets`: `id`, `internship_id`, `competency_category_id`, `target_score` (1-4), `factor_type` (`CORE` | `SECONDARY`)
6. `student_assessments`: `id`, `user_id`, `specialization_id`, `academic_weight` (default 0.4), `portfolio_weight` (default 0.6), `created_at`
7. `assessment_details`: `id`, `assessment_id`, `competency_category_id`, `academic_score` (0.00-4.00), `portfolio_essay`, `evidence_url`, `portfolio_score_ai` (1-4), `ai_reasoning`
8. `recommendation_results`: `id`, `assessment_id`, `internship_id`, `na_score`, `np_score`, `final_score`, `match_percentage`, `rank_position`

Tambahan dari `migration_002_admin.sql`:

- `admin_users`: `user_id` akun yang berperan sebagai admin, dicek lewat fungsi `is_admin()`
- `student_assessments`: `student_name`, `student_email`, `status` (`pending` | `approved` | `corrected` | `needs_revision`), `admin_note`, `override_internship_id`, `reviewed_by`, `reviewed_at`
- `assessment_details`: `portfolio_score_admin` (koreksi skor oleh admin, 1-4)
- `internships`: `is_active`
- `review_logs`: riwayat setiap pemeriksaan admin

---

## Cara Instalasi & Menjalankan

1. **Clone Repository:**

   ```bash
   git clone https://github.com/enricostevenernest/Capstone_Project_43.git
   cd Capstone_Project_43
   ```

2. **Install Dependencies** (Node.js 20.9+):

   ```bash
   npm install
   ```

3. **Setup Database Supabase:**
   - Buka project Supabase Anda di [supabase.com](https://supabase.com).
   - Masuk ke menu **SQL Editor** → **New Query**.
   - Buka file [`supabase/migration.sql`](supabase/migration.sql), copy seluruh isinya, paste di SQL Editor, lalu klik **Run**.
   - Skrip ini akan membuat ke-8 tabel, constraint, index, policy RLS (Row Level Security), dan memasukkan data awal (seed data) otomatis. Skrip aman dijalankan ulang.
   - Setelah itu jalankan juga [`supabase/migration_002_admin.sql`](supabase/migration_002_admin.sql). Skrip ini menambah peran admin, status validasi, riwayat pemeriksaan, dan menyamakan nilai target lama (skala 1-5) dengan skala 1-4 yang dipakai laporan.
   - Jadikan akunmu admin. Daftar dulu lewat aplikasi, lalu jalankan di SQL Editor:

     ```sql
     INSERT INTO admin_users (user_id)
     SELECT id FROM auth.users WHERE email = 'email.kamu@contoh.ac.id'
     ON CONFLICT DO NOTHING;
     ```

     Menu **Admin** akan muncul di navigasi setelah kamu masuk dengan akun tersebut.

4. **Konfigurasi Environment Variables:** salin `.env.example` menjadi `.env.local` lalu isi nilainya. File `.env.local` sudah masuk `.gitignore`, jangan di-commit.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_google_ai_studio_free_api_key
   ```

5. **Cek Perhitungan (opsional):** `npm test` mencocokkan hasil Profile Matching dengan data uji Tabel 28 dan 31 pada laporan.

6. **Jalankan Server Development:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di browser.
