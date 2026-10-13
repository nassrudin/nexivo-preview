# NEXIVO

Website webinar **Next Generation Virtual Learning & Knowledge**. Website publik, dashboard peserta, dan dashboard pengelola terpisah, memakai React + TypeScript + Vite dengan backend Express dan SQLite lokal.

**Preview online:** https://nassrudin.github.io/nexivo-preview/

Preview GitHub Pages hanya untuk meninjau desain dan enam topik rencana. Pembuatan akun, bookmark, penyimpanan minat, pendaftaran, administrasi, dan sertifikat nyata memerlukan backend. Formulir data pribadi tidak ditampilkan pada preview statis.

## Halaman dan akses

| Area | Alamat lokal | Fungsi |
| --- | --- | --- |
| Website publik | `http://127.0.0.1:3000/#beranda` | Pengenalan NEXIVO, bidang, katalog webinar, dan informasi |
| Verifikasi publik | `http://127.0.0.1:3000/#verifikasi` | Memeriksa status dokumen tanpa membuka sertifikat pribadi |
| Dashboard peserta | `http://127.0.0.1:3000/#dashboard` | Ringkasan belajar, simpanan, pendaftaran, dan sertifikat |
| Dashboard pengelola | `http://127.0.0.1:3000/#admin` | Ringkasan operasional dan manajemen kegiatan |

Login dari website publik mengarahkan peserta ke dashboard belajar dan admin ke area pengelola. Menu pengelola memiliki halaman `#admin/webinar`, `#admin/peserta`, dan `#admin/minat`. Link **Website publik** kembali ke halaman depan tanpa mengakhiri sesi. **Keluar akun** mengakhiri sesi dan kembali ke website publik. Otorisasi admin tetap diperiksa pada server.

Preview GitHub Pages menampilkan website publik dan demo dashboard peserta di `#dashboard`. Data admin tetap memerlukan login dan backend lokal; preview tidak membuka akses pengelolaan atau mengekspor data pengguna.

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

Tes HTTP menggunakan database dalam memori. Pemeriksaan browser memakai akun peserta/admin contoh pada database terisolasi. Siapkan dan jalankan di terminal tersendiri:

```powershell
node --import tsx scripts/prepare-interface-review.ts
$env:PORT = '3014'
$env:APP_URL = 'http://127.0.0.1:3014'
$env:DATABASE_PATH = './artifacts/interface-review.sqlite'
npm.cmd run dev
```

Di terminal kedua:

```powershell
playwright-cli.cmd -s=nexivo-interface open http://127.0.0.1:3014 --browser=chrome
playwright-cli.cmd -s=nexivo-interface run-code --filename=scripts/browser/review-dashboard.js
```

Skrip memeriksa pemisahan layout, redirect login sesuai peran, pembatasan admin, halaman manajemen, navigasi, fokus/menu keyboard, mode gelap, reduced motion, lima ukuran layar, console/network, serta axe. Gunakan database review ini, bukan database pengguna nyata. Untuk aplikasi utama, gunakan terminal baru agar environment review tidak terbawa.

Skrip `scripts/browser/review-preview.js` memeriksa preview statis pada server port 3002 atau alamat GitHub Pages yang sedang terbuka. Preview tidak mengirim request backend atau mutasi data.

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
