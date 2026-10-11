# Hasil verifikasi lokal

Pemulihan desain sebelum perubahan terakhir: source UI dipulihkan dari riwayat berkas, termasuk font DM Sans, token warna, layout dashboard, navigasi, kartu, dan form. Lint, typecheck, serta build lulus setelah pemulihan. `.tools/review-restore.js` berhasil menjalankan 15 pemeriksaan: font, pencarian, filter, detail, keyboard/fokus, tema, dan responsivitas pada 320/390/768/1024/1440 px. Dua scan axe menghasilkan 0 pelanggaran otomatis; tidak ada JavaScript error yang tidak tertangani atau request gagal pada run ini. Screenshot `artifacts/nexivo-restored-desktop.png` dan `artifacts/nexivo-restored-mobile.png` diperiksa. Hasil pengujian implementasi awal di bawah dipertahankan sebagai catatan sebelumnya; backend dan data pengguna tidak diubah oleh pemulihan desain.

Pemeriksaan dilakukan 12 Oktober 2026 (WIB), pada Windows dengan Node 24.21.0 dan Chrome melalui Playwright CLI. Database utama dan database pengujian browser terpisah. Tidak menghubungkan layanan berbayar atau database production.

## Kode dan build

| Pemeriksaan | Hasil |
| --- | --- |
| ESLint | Lulus, tanpa error atau warning |
| TypeScript strict / `typecheck` | Lulus; build juga menjalankan `tsc --noEmit` |
| Tes HTTP dan keamanan | 13 lulus, 0 gagal |
| Build Vite | Lulus; frontend build dilayani bersama API saat review |
| npm audit saat instalasi | 0 kerentanan dilaporkan; bukan jaminan untuk versi mendatang |

Tes memeriksa validasi input, persetujuan, origin/CSRF, pembatasan peran, hashing kata sandi/token sesi, isolasi bookmark/pendaftaran, kuota saat permintaan bersamaan, pendaftaran ganda, tautan meeting yang menyerupai domain resmi, jendela akses/absensi, minimum durasi kehadiran, persyaratan evaluasi dan persetujuan pengelola, penerbitan sertifikat idempotent, PDF milik peserta, data publik yang disingkat, pencabutan/audit, penolakan sertifikat berbayar, logout, sesi kedaluwarsa, login gagal/rate limit, ukuran JSON, serta header/cookie production.

## Browser

- `.tools/review-ui.js`: **22 pemeriksaan berhasil**. Pencarian/filter/reset, empty state, akun baru, persistensi setelah reload, bookmark, profil, logout/login, formulir invalid, login salah, pencatatan minat, verifikasi dokumen tidak ditemukan, menu mobile, dan pemeriksaan console/request.
- `.tools/review-admin.js`: **12 pemeriksaan berhasil**. Pembuatan webinar dari formulir, validasi domain meeting di server, pendaftaran peserta, gagal akses ruang/absensi sebelum waktunya, akses pengelola ditolak untuk peserta, kontrol sertifikat sebelum syarat terpenuhi, daftar minat, serta teks nama yang berisi payload HTML tetap ditampilkan sebagai teks.
- `.tools/review-certificate.js`: **7 pemeriksaan berhasil**. Evaluasi peserta, persetujuan admin, penerbitan sertifikat, unduh PDF pemilik, verifikasi anonim, nama disingkat, dan pencabutan. Timestamp kehadiran merupakan fixture simulasi pada database review.
- `.tools/review-evaluation.js`: **1 pemeriksaan berhasil**: pemuatan kembali rating dan refleksi tersimpan untuk pemiliknya. Total alur browser di atas: **42 pemeriksaan**.
- Tidak ditemukan error JavaScript yang tidak tertangani pada alur yang diperiksa. HTTP 400/401/404/409 pada skenario negatif adalah hasil yang diharapkan dan ditampilkan melalui UI.
- Lebar **320, 390, 768, 1024, 1440 px** diperiksa; tidak ditemukan overflow horizontal halaman. Tabel admin memakai scroll di dalam kontainer pada mobile.
- Keyboard: skip link, fokus main setelah navigasi, pencarian, Escape, dan pengembalian fokus dialog diperiksa. Dialog menggunakan elemen native.
- Axe WCAG 2 A/AA dan WCAG 2.1 AA: **0 pelanggaran otomatis pada 6 tampilan**: beranda terang, katalog terang, dialog pendaftaran akun, beranda gelap, katalog mobile, dashboard pengelola. Ini bukan sertifikasi aksesibilitas; pembaca layar dan perangkat nyata belum diuji.

Screenshot diperiksa secara visual: desktop, mobile, katalog, tema gelap, dashboard pengelola, Belajarku, dan verifikasi sertifikat. Perbaikan hasil pemeriksaan mencakup fokus navigasi yang semula menggeser heading di bawah header, jeda animasi pada reduced motion, akses tema gelap mobile, serta keterbacaan teks kecil. Folder data dan artefak tes dikecualikan dari watcher Vite untuk mencegah crash Windows ketika file PDF/SQLite terkunci. Setelah perbaikan, file PDF uji dikunci secara eksklusif; server tetap merespons HTTP 200. Pemeriksaan terakhir pada server utama juga mengonfirmasi render beranda, API 200, enam rencana program, dan tidak ada overflow mobile.

Artefak pada `artifacts/` (lokal, diabaikan Git):

- `nexivo-desktop.png`, `nexivo-mobile.png`
- `nexivo-program.png`, `nexivo-mobile-program.png`, `nexivo-dark.png`
- `nexivo-admin.png`, `nexivo-admin-mobile.png`, `nexivo-belajarku.png`
- `nexivo-verification.png`, `nexivo-review-certificate.pdf`
- Screenshot referensi untuk analisis; tidak digunakan sebagai aset website.

## Pengukuran performa

`.tools/review-performance.js`, Chrome desktop, build hasil optimasi pada localhost, cache browser dikosongkan, tanpa throttling CPU/network:

| Pengukuran satu run | Hasil |
| --- | --- |
| LCP | 108 ms |
| Layout shift tercatat (CLS) | 0,029 |
| Durasi navigasi | 30 ms |
| Transfer resource | sekitar 396 KB |
| JavaScript build | sekitar 289 KB; sekitar 88 KB gzip menurut Vite |
| CSS build | sekitar 42 KB; sekitar 9,4 KB gzip menurut Vite |

LCP/CLS di atas merupakan pengamatan lokal, bukan skor Lighthouse atau hasil perangkat mobile/jaringan internet. Observer CLS menjumlahkan pergeseran tanpa interaksi pada run singkat ini; tidak menggantikan pengukuran lapangan. Hosting produksi perlu mengaktifkan kompresi/cache yang sesuai dan mengukur ulang dengan trafik nyata.

## Belum diverifikasi / perlu keputusan sebelum peluncuran

HTTPS dan reverse proxy nyata, backup/restore, load test, multi-instance/rate limit terpusat, Firefox/Safari, perangkat mobile dan pembaca layar nyata, audit keamanan menyeluruh, pengiriman email, pemulihan akun, identitas/retensi pengelola data, serta pembatalan/perubahan acara belum diuji/diimplementasikan sebagai operasional production.

Supabase, pembayaran, API Zoom/Meet, dan email otomatis tidak diaktifkan. Sertifikat berbayar ditolak. QR dan unduhan PDF diuji sebagai fungsi; tata letak PDF dengan nama sangat panjang atau karakter di luar font Latin memerlukan peninjauan lebih lanjut. Status legalitas, akreditasi, jadwal nyata, dan narasumber tetap perlu konfirmasi pengelola.
