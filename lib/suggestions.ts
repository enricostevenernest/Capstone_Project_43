// ============================================================
// Saran pengembangan per kategori kompetensi
// Ditampilkan untuk kategori yang skornya masih di bawah target posisi.
// ============================================================

export interface CategorySuggestion {
  /** Kalau nilai akademik yang kurang */
  study: string;
  /** Kalau portofolio yang kurang */
  build: string;
}

export const categorySuggestions: Record<string, CategorySuggestion> = {
  // SAGE
  sage_1: {
    study: "Ulang konsep inheritance, interface, dan design pattern dasar seperti Factory dan Observer.",
    build: "Bikin aplikasi kecil berlapis (model, service, controller) di Java atau TypeScript, lalu taruh di GitHub lengkap dengan README.",
  },
  sage_2: {
    study: "Latihan menulis use case description dan activity diagram dari studi kasus nyata, bukan cuma contoh buku.",
    build: "Ambil satu proses di UMKM atau organisasi kampus, petakan As-Is dan To-Be-nya, lalu susun dokumen kebutuhan sistemnya.",
  },
  sage_3: {
    study: "Rutin kerjakan soal struktur data (array, tree, graph) di LeetCode atau HackerRank, cukup 3 soal seminggu.",
    build: "Tulis solusi beserta analisis kompleksitasnya di repositori, supaya terlihat cara berpikirmu.",
  },
  sage_4: {
    study: "Pahami HTTP, REST, dan cara kerja autentikasi sebelum lompat ke framework.",
    build: "Deploy satu aplikasi web lengkap (frontend, API, database) ke Vercel atau hosting gratis, lalu minta teman mencobanya.",
  },
  sage_5: {
    study: "Pelajari TOGAF ADM dan cara membaca peta proses bisnis suatu organisasi.",
    build: "Susun blueprint arsitektur sederhana (bisnis, data, aplikasi) untuk satu unit kampus sebagai studi kasus.",
  },
  sage_6: {
    study: "Baca ringkasan COBIT 2019 dan ITIL 4, fokus ke domain yang paling sering diaudit.",
    build: "Lakukan audit kecil, misalnya tingkat kapabilitas proses layanan TI di organisasi kampus, dan tulis laporannya.",
  },
  // DELTA
  delta_1: {
    study: "Ulang materi klasifikasi, clustering, dan evaluasi model (precision, recall, confusion matrix).",
    build: "Kerjakan satu kompetisi Kaggle level pemula sampai submit, lalu tulis notebook yang menjelaskan tiap langkah.",
  },
  delta_2: {
    study: "Latih uji hipotesis dan distribusi peluang memakai data sungguhan, bukan hanya soal hitungan.",
    build: "Analisis survei kecil (misalnya kebiasaan belajar mahasiswa) dan sajikan kesimpulannya dengan uji statistik yang tepat.",
  },
  delta_3: {
    study: "Kuasai JOIN, subquery, indexing, dan normalisasi sampai 3NF.",
    build: "Rancang database untuk satu aplikasi nyata, isi data dummy ribuan baris, lalu optimalkan query yang lambat.",
  },
  delta_4: {
    study: "Pelajari regresi, control chart, dan design of experiment yang sering dipakai di industri.",
    build: "Ambil dataset produksi atau penjualan publik dan buat analisis tren serta peramalan sederhana.",
  },
  delta_5: {
    study: "Pahami skema bintang (star schema), proses ETL, dan perbedaan OLTP dengan OLAP.",
    build: "Bangun dashboard di Looker Studio, Power BI, atau Metabase dari data yang kamu olah sendiri lewat pipeline ETL.",
  },
  delta_6: {
    study: "Ulang logika, himpunan, relasi, dan teori graf, karena semuanya muncul lagi di algoritma dan basis data.",
    build: "Terapkan teori graf pada masalah nyata, misalnya rute terpendek antar gedung kampus, dan dokumentasikan solusinya.",
  },
};
