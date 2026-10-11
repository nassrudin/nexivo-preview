# NEXIVO

Website webinar **Next Generation Virtual Learning & Knowledge**. Implementasi lokal untuk ditinjau: React + TypeScript + Vite, API Express, serta database SQLite persisten. Logo memakai aset yang diberikan. Font DM Sans disajikan lokal; ilustrasi dibuat dengan SVG/CSS.

## Menjalankan

Gunakan **Node.js 24 atau lebih baru**. Dari folder proyek, jalankan di terminal VS Code:

```powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
```

Buka **http://127.0.0.1:3000**. Jangan mengganti alamat menjadi `localhost` tanpa menyesuaikan `APP_URL`: origin harus sama untuk perlindungan CSRF. Hentikan server dengan `Ctrl+C`. Perubahan frontend langsung muncul; perubahan backend memerlukan restart server.

Database dibuat otomatis di `data/nexivo.sqlite`. Tidak memerlukan Supabase, API key, atau akun cloud. Keenam program awal adalah **rencana topik**, bukan pengumuman acara nyata. Akun, bookmark, minat, dan pendaftaran yang dibuat pengguna benar-benar disimpan.

Untuk memeriksa build hasil optimasi, hentikan server development terlebih dahulu:

```powershell
npm.cmd run build
npm.cmd run preview
```

`preview` melayani frontend build dan API lokal. Mode ini menggunakan cookie development dan hanya untuk peninjauan lokal. `npm.cmd start` menggunakan pengaturan production, memerlukan `APP_URL` HTTPS yang sesuai origin publik, serta reverse proxy HTTPS yang disiapkan terpisah. Proyek ini belum dipublikasikan.

## Environment

`.env` dibaca oleh perintah dev, preview, start, dan admin:create. Nilai environment terminal memiliki prioritas. `.env`, database, dan artefak pengujian diabaikan Git.

| Nama | Default / fungsi |
| --- | --- |
| `HOST` | `127.0.0.1`, hanya menerima koneksi lokal |
| `PORT` | `3000` |
| `APP_URL` | `http://127.0.0.1:3000`, origin CSRF dan alamat QR sertifikat |
| `DATABASE_PATH` | `./data/nexivo.sqlite` |
| `NEXIVO_ADMIN_EMAIL` | Hanya diperlukan saat membuat pengelola |
| `NEXIVO_ADMIN_PASSWORD` | Hanya saat membuat pengelola; minimal 16 karakter |

## Membuat pengelola

Tidak ada akun admin atau kata sandi default pada database aplikasi utama. Jalankan berikut di terminal PowerShell; kata sandi diminta secara tersembunyi dan tidak ditulis sebagai perintah:

```powershell
$env:NEXIVO_ADMIN_EMAIL = Read-Host 'Email pengelola'
$nexivoSecurePassword = Read-Host 'Kata sandi (minimal 16 karakter)' -AsSecureString
$env:NEXIVO_ADMIN_PASSWORD = [Net.NetworkCredential]::new('', $nexivoSecurePassword).Password
try {
  npm.cmd run admin:create
} finally {
  Remove-Item Env:NEXIVO_ADMIN_EMAIL, Env:NEXIVO_ADMIN_PASSWORD -ErrorAction SilentlyContinue
  $nexivoSecurePassword.Dispose()
}
```

Masuk dengan akun tersebut, lalu pilih **Pengelola**. Email harus belum digunakan; perintah ini tidak menaikkan hak akses akun peserta yang sudah ada.

## Alur kegiatan

1. Pengelola membuat webinar dengan tanggal WIB, narasumber terkonfirmasi, kuota, tautan Zoom/Google Meet, kode kehadiran, dan ketentuan sertifikat. Pilih status **Publikasikan** untuk membuka pendaftaran sebelum sesi dimulai.
2. Peserta mendaftar melalui katalog. Server memeriksa persetujuan, kepemilikan akun, kuota, dan pendaftaran ganda. Kegiatan tampil di **Belajarku**.
3. Ruang webinar tersedia bagi peserta terdaftar mulai 15 menit sebelum sesi hingga waktu selesai. Peserta mengisi kode absensi masuk, mencatat absensi akhir, lalu mengisi evaluasi.
4. Setelah kegiatan selesai, pengelola memeriksa catatan platform webinar dan memvalidasi kehadiran dengan alasan. Server menghitung durasi di dalam interval kegiatan.
5. Sertifikat gratis dapat diterbitkan jika peserta memilih sertifikat, memenuhi minimum durasi, mendapat persetujuan pengelola, dan menyelesaikan evaluasi. Unduhan PDF hanya untuk pemilik/admin. QR membuka verifikasi publik dengan nama disingkat.
6. Pencabutan sertifikat memerlukan alasan dan tercatat pada audit. Status publik diperbarui; dokumen yang dicabut tidak dapat diunduh kembali dari aplikasi.

Absensi kode merupakan pencatatan peserta, bukan bukti otomatis kehadiran di Zoom/Meet. Validasi pengelola tetap diperlukan. Acara yang sudah dimulai menutup pendaftaran; status kartu menyesuaikan waktu. Tautan ruang dan kode kehadiran tidak ditampilkan di API katalog publik.

## Pemeriksaan

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Tes backend menggunakan database dalam memori dan waktu terkontrol. Untuk mengulang pemeriksaan browser dengan Playwright CLI yang telah dipasang:

```powershell
npx.cmd tsx scripts/prepare-review.ts
$env:PORT = '3001'
$env:APP_URL = 'http://127.0.0.1:3001'
$env:DATABASE_PATH = './artifacts/browser-review.sqlite'
npm.cmd run preview
```

Di terminal kedua:

```powershell
playwright-cli.cmd -s=nexivo-review open http://127.0.0.1:3001 --browser=chrome
playwright-cli.cmd -s=nexivo-review run-code --filename=.tools/review-ui.js
playwright-cli.cmd -s=nexivo-review run-code --filename=.tools/review-admin.js
playwright-cli.cmd -s=nexivo-review close
```

`review-ui` dijalankan lebih dahulu pada database dengan enam program awal. `review-admin` menambahkan satu acara khusus pengujian, sehingga uji jumlah katalog awal perlu memakai database pengujian baru jika diulang. Jalankan CLI dari root proyek agar path axe dan screenshot dapat ditemukan.

Untuk meninjau alur sertifikat, jalankan `npx.cmd tsx scripts/prepare-certificate-review.ts` di terminal terpisah, lalu `.tools/review-certificate.js` melalui `run-code`. Fixture ini membuat waktu kehadiran simulasi pada acara selesai. Aturan durasi/waktu diuji terpisah oleh tes HTTP, bukan dengan menunggu webinar nyata. `.tools/review-evaluation.js` memeriksa pemuatan kembali evaluasi yang tersimpan.

Fixture review hanya menulis `artifacts/browser-review.sqlite` dan menggunakan akun contoh khusus tes. Jangan gunakan file itu sebagai `DATABASE_PATH` untuk layanan nyata. Setelah menghentikan server review, gunakan terminal baru untuk menjalankan aplikasi utama agar environment pengujian tidak terbawa.

Lihat [hasil verifikasi](docs/VERIFICATION.md) dan [keputusan desain serta sumber konten](docs/DESIGN.md).

## Batas versi ini

- Supabase belum terhubung karena belum ada proyek. Penyimpanan lokal berjalan dengan SQLite; tidak ada migration atau RLS Supabase yang diklaim sudah diterapkan.
- Email verifikasi, reset kata sandi, email otomatis, payment gateway, API Zoom/Meet, rekaman, dan unggahan file belum tersedia. Penerbitan sertifikat berbayar ditolak server.
- Pengelola dapat membuat kegiatan baru, memeriksa peserta/minat, serta memvalidasi dan menerbitkan/mencabut sertifikat. Perubahan atau pembatalan kegiatan yang sudah dibuat belum memiliki alur operasional; diperlukan sebelum menerima pendaftaran publik.
- Badan hukum, akreditasi, harga, tanggal acara nyata, narasumber, kebijakan retensi, dan kontak pengelola data perlu dikonfirmasi. Tidak ada statistik pemasaran atau testimoni fiktif.
- SQLite dan pembatasan request dalam memori cocok untuk satu proses server lokal. Sebelum trafik publik, siapkan hosting HTTPS, backup/restore, pemantauan, pengiriman email/pemulihan akun, kebijakan data, serta pembatasan request yang sesuai arsitektur hosting.
- Pengujian lokal bukan audit keamanan menyeluruh atau jaminan bebas celah. Tidak ada publikasi, perubahan database production, atau pembelian layanan.
