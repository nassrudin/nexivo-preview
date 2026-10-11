# Hasil verifikasi dashboard dan preview

Diperiksa 12 Oktober 2026 (WIB), Windows, Node 24.21.0, Chrome melalui Playwright CLI. Catatan ini berlaku untuk redesign dari empat gambar konsep terbaru.

## Kode dan backend

| Pemeriksaan | Hasil |
| --- | --- |
| ESLint | Lulus |
| TypeScript strict | Lulus |
| Tes HTTP/keamanan backend | 13 lulus, 0 gagal |
| Build aplikasi lengkap | Lulus |
| Build preview `pages` | Lulus |
| Diff whitespace | Bersih |

Tes backend mencakup validasi, CSRF/origin, peran dan kepemilikan, hashing/sesi, isolasi bookmark, kuota bersamaan, pendaftaran ganda, tautan meeting, waktu absensi, evaluasi dan penerbitan sertifikat, akses PDF, verifikasi publik, pencabutan/audit, rate limit, cookie, dan CSP production. Database tes berada dalam memori.

## Browser aplikasi lokal

`scripts/browser/review-dashboard.js`: **27 pemeriksaan berhasil**.

- Pencarian, filter bidang, detail program, navigasi bulan/tanggal, reset kalender.
- Validasi login kosong dan pesan kegagalan login. HTTP 401 pada skenario login salah memang diharapkan.
- Skip link, fokus setelah dialog, menu ponsel, Escape, dan navigasi.
- Tema terang/gelap; reduced motion menghentikan animasi.
- Lebar 320, 390, 768, 1024, 1440 px tanpa overflow horizontal halaman.
- Axe WCAG 2 A/AA, 2.1 AA, dan 2.2 AA: **0 pelanggaran otomatis** pada beranda desktop, gelap, dan ponsel.
- Tidak ada JavaScript error yang tidak tertangani atau request gagal pada run final.

## Browser preview statis

`scripts/browser/review-preview.js`: **22 pemeriksaan berhasil** pada build lokal port 3002.

- Penanda preview, enam topik seed, logo/aset, pencarian, katalog, empty state, dan dialog.
- Form akun/minat tidak mengumpulkan data pribadi. CTA dialog bekerja juga ketika berada pada route yang sama.
- Lima ukuran layar tanpa overflow horizontal.
- Tidak ada request `/api`, mutasi server, HTTP error, JavaScript error, atau request gagal.
- Lima scan axe pada katalog, Belajarku, Sertifikat, Tentang, dan Penggunaan data: **0 pelanggaran otomatis**. Animasi dihentikan saat scan untuk menilai warna akhir yang benar.

Screenshot desktop, ponsel, tablet, dan gelap telah diperiksa secara visual. Perbaikan mencakup kontras angka/panel, label pencarian pada mobile/tablet, teks navigasi, dan penutupan dialog preview pada route yang sama.

## Pengukuran lokal

Satu run Chrome desktop 1440 x 1000, build preview teroptimasi, cache dikosongkan, tanpa throttling CPU/network, setelah animasi masuk selesai:

| Pengamatan | Hasil |
| --- | --- |
| LCP tercatat | 48 ms |
| Jumlah layout shift tanpa input | 0,067 |
| Transfer resource | sekitar 166 KB |
| JavaScript preview | sekitar 294 KB, 90 KB gzip |
| CSS | sekitar 70 KB, 15 KB gzip |

Ini pengamatan singkat pada localhost, bukan skor Lighthouse, Core Web Vitals lapangan, atau tolok ukur perangkat pengguna. Jaringan dan perangkat nyata belum diukur.

## Publikasi dan batas pemeriksaan

Preview menggunakan GitHub Pages pada branch `gh-pages`; source aplikasi lengkap pada `main`. Build mengekspor seed dari SQLite dalam memori dan tidak mengunggah database lokal, `.env`, akun, atau artefak tes.

Alamat publik https://nassrudin.github.io/nexivo-preview/ telah dibuka dengan Chrome dan diperiksa ulang menggunakan skrip preview yang sama: **22 pemeriksaan lulus**, lima scan axe bersih, seluruh aset berhasil dimuat dari subfolder repository, dan tidak ada request backend/mutasi, HTTP error, atau JavaScript error. Log lokal: `artifacts/pages-online-review.log`.

Publikasi backend, Supabase, email, pembayaran, dan database production belum dilakukan. Pembaca layar manual, Safari/iOS, perangkat fisik, beban trafik, serta audit keamanan menyeluruh belum diuji. Hasil axe bukan sertifikasi aksesibilitas; tes lokal bukan jaminan keamanan menyeluruh.

Artefak lokal diabaikan Git: `artifacts/dashboard-review.log`, `pages-review.log`, `pages-performance.log`, serta screenshot `nexivo-studio-*` dan `nexivo-pages-*`.
