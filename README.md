# NEXIVO

Website webinar **Next Generation Virtual Learning & Knowledge**. Dashboard React + TypeScript + Vite dengan backend Express dan SQLite lokal.

**Preview online:** https://nassrudin.github.io/nexivo-preview/

Preview GitHub Pages hanya untuk meninjau desain dan enam topik rencana. Pembuatan akun, bookmark, penyimpanan minat, pendaftaran, administrasi, dan sertifikat nyata memerlukan backend. Formulir data pribadi tidak ditampilkan pada preview statis.

## Menjalankan aplikasi lengkap

Gunakan Node.js **24 atau lebih baru**. Di terminal PowerShell pada folder proyek:

```powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
```

Buka http://127.0.0.1:3000. Gunakan origin yang sama dengan `APP_URL` agar pemeriksaan CSRF bekerja. Database otomatis dibuat di `data/nexivo.sqlite`. Tidak memerlukan Supabase atau API key. Keenam topik awal diberi label **Dalam persiapan**; jadwal, narasumber, dan harga tidak direkayasa.

Untuk build lokal:

```powershell
npm.cmd run build
npm.cmd run preview
```

Hentikan server development sebelum menjalankan preview pada port yang sama. `npm.cmd start` untuk production membutuhkan origin HTTPS dan reverse proxy yang disiapkan terpisah. Backend production belum dipublikasikan.

## Environment

| Nama | Default / fungsi |
| --- | --- |
| `HOST` | `127.0.0.1` |
| `PORT` | `3000` |
| `APP_URL` | `http://127.0.0.1:3000`; harus sama dengan origin frontend |
| `DATABASE_PATH` | `./data/nexivo.sqlite` |
| `NEXIVO_ADMIN_EMAIL` | Hanya saat membuat pengelola |
| `NEXIVO_ADMIN_PASSWORD` | Hanya saat membuat pengelola, minimal 16 karakter |

`.env`, database, artefak pengujian, dan build diabaikan Git. Tidak ada akun admin atau kata sandi bawaan. Untuk membuat pengelola, isi environment di terminal, lalu jalankan `npm.cmd run admin:create`. Email harus belum digunakan. Gunakan `Read-Host -AsSecureString` untuk memasukkan kata sandi tanpa menuliskannya ke riwayat perintah.

## Build GitHub Pages

```powershell
npm.cmd run build:pages
node node_modules/vite/bin/vite.js preview --outDir dist-pages --host 127.0.0.1 --port 3002
```

Buka http://127.0.0.1:3002. Mode `pages` menggunakan aset relatif agar berjalan di subfolder repository. Topik preview diekspor dari seed database dalam memori, **bukan database pengguna lokal**. Tidak ada request ke `/api` pada preview.

Source ada di branch `main`. Hasil `dist-pages/` dipublikasikan pada branch `gh-pages`, dengan `.nojekyll`; GitHub Pages menggunakan branch tersebut sebagai sumber. Tidak membutuhkan layanan berbayar atau workflow dengan secret.

## Pemeriksaan

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build:pages
```

Tes HTTP menggunakan database dalam memori. Setelah server lokal berjalan pada port 3000, verifikasi dashboard dengan Playwright CLI:

```powershell
New-Item -ItemType Directory -Force artifacts | Out-Null
playwright-cli.cmd -s=nexivo-review open http://127.0.0.1:3000 --browser=chrome
playwright-cli.cmd -s=nexivo-review run-code --filename=scripts/browser/review-dashboard.js
```

Pemeriksaan browser mencakup pencarian, filter, detail, kalender, form invalid/login gagal, keyboard/fokus, tema, reduced motion, lima ukuran layar, console/network, serta axe. Jalankan pada database review dengan enam topik awal; tidak ada pembuatan akun atau acara nyata oleh skrip dashboard. Skrip preview statis dapat dijalankan dengan `scripts/browser/review-preview.js` pada server port 3002.

Lihat [keputusan desain](docs/DESIGN.md) dan [hasil verifikasi](docs/VERIFICATION.md).

## Alur backend lokal

Pengelola membuat webinar dengan jadwal WIB, narasumber, kuota, tautan Zoom/Meet, kode kehadiran, dan ketentuan sertifikat. Peserta mendaftar, mengikuti kegiatan, mencatat absensi masuk/akhir, dan mengisi evaluasi. Pengelola memvalidasi kehadiran sebelum menerbitkan sertifikat gratis sesuai syarat. PDF hanya dapat diunduh pemilik/admin; verifikasi publik menyamarkan nama. Pencabutan sertifikat dicatat dengan alasan.

Pendaftaran ganda, kuota, waktu akses, otorisasi, dan validasi diperiksa server. Absensi kode tetap membutuhkan verifikasi pengelola; bukan integrasi otomatis dengan kehadiran Zoom/Meet.

## Keterbatasan

- Backend, database, dan pendaftaran nyata belum dihosting; GitHub Pages melayani preview statis.
- Supabase belum terhubung karena proyek belum tersedia.
- Email verifikasi/reset kata sandi, email otomatis, payment gateway, rekaman, dan upload belum tersedia. Sertifikat berbayar ditolak server.
- Perubahan/pembatalan acara terdaftar, kebijakan retensi, dan operasional layanan publik perlu dilengkapi sebelum peluncuran nyata.
- Legalitas, akreditasi, tanggal acara, narasumber, harga, dan kontak pengelola data harus dikonfirmasi pemilik.
- Hosting backend memerlukan HTTPS, backup, pemantauan, dan pembatasan request sesuai arsitektur. Pengujian ini bukan audit keamanan menyeluruh atau jaminan bebas celah.
