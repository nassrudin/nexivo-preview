# Verifikasi pemisahan website dan dashboard

Diperiksa 14 Oktober 2026 (WIB), Node 24.21.0, Windows, Chrome melalui Playwright CLI.

## Kode dan backend

### Audit keterbacaan font

Ukuran diperiksa dari `getComputedStyle` pada render Chrome desktop 1440 px dan ponsel 390 px, menggunakan database review terisolasi:

| Teks fungsional | Sebelum | Sesudah pada ukuran browser standar |
| --- | --- | --- |
| Deskripsi kartu dashboard | 13 px | 16 px |
| Status program dashboard | 10 px | 14 px |
| Jadwal pada kartu dashboard | 11 px | 14 px |
| Keterangan ringkasan pada ponsel | 8 px | 14 px |
| Navigasi sidebar | 13 px | 15 px |
| Header / isi tabel admin | 11 / 13 px | 14 / 15 px |
| Status / jadwal kartu publik | 11 / 12 px | 14 / 14 px |

Ukuran bersama memakai rem; label dekoratif memakai 12 px. Ringkasan status ponsel disusun satu kolom untuk mengakomodasi teks yang lebih besar. Peninjauan screenshot desktop dan ponsel dilakukan setelah perubahan. Log audit lokal: `artifacts/fonts-before.log`, `artifacts/fonts-after.log`; pengujian browser sesudah perubahan: `artifacts/typography-review.log`.

- ESLint dan TypeScript strict: lulus.
- Build aplikasi lengkap dan build preview Pages: lulus.
- Tes HTTP/keamanan: 13 lulus, 0 gagal. Validasi, autentikasi, CSRF/origin, peran/kepemilikan, kuota, absensi, sertifikat, rate limit, cookie, dan CSP tetap diperiksa.
- Server development memakai WebSocket HMR pada port HTTP yang sama; handshake browser pada port 3014 terverifikasi. Uji bentrok startup sebelumnya mengonfirmasi exit 1 dengan pesan port yang jelas tanpa pesan siap yang keliru.

## Browser aplikasi lengkap

`scripts/browser/review-dashboard.js`: **43 pemeriksaan lulus** pada database terisolasi `artifacts/interface-review.sqlite`, port 3014.

- Website publik memakai navigasi horizontal, dashboard peserta memakai sidebar pembelajaran, dan dashboard admin memakai sidebar/manajemen terpisah.
- Login peserta mengarah ke `#dashboard`; admin ke `#admin`. Kembali ke website publik mempertahankan sesi, logout mengakhiri sesi dan kembali ke website.
- Tamu dan peserta tidak dapat melihat tabel admin; request admin oleh peserta ditolak server dengan HTTP 403 yang memang diharapkan.
- Filter dari bidang publik membuka katalog yang sesuai. Verifikasi publik tidak menampilkan daftar sertifikat pribadi.
- Menu webinar, peserta/sertifikat, dan minat membuka view tersendiri. Form pembuatan webinar dan keadaan kosong nyata diperiksa.
- Navigasi keyboard, fokus setelah perpindahan layout, menu mobile, penguncian Tab dalam drawer, Escape/pengembalian fokus, serta reduced motion diperiksa.
- Website publik, dashboard peserta, dan admin diuji pada 320, 390, 768, 1024, 1440 px: tidak ada overflow horizontal halaman. Tabel admin dapat digulir dan difokuskan lewat keyboard.
- **10 scan axe bersih**: publik terang/gelap/ponsel, peserta terang/gelap, admin terang/gelap/ponsel, dialog pembuatan, dan menu mobile terbuka. WCAG 2 A/AA, 2.1 AA, dan 2.2 AA.
- Tidak ada JavaScript error yang tidak tertangani atau request jaringan gagal pada run final.

## Preview statis

`scripts/browser/review-preview.js`: **35 pemeriksaan lulus**, **9 scan axe bersih** pada build lokal port 3002.

Website publik, pencarian/filter/katalog, keadaan kosong, dialog penjelasan preview, verifikasi, dashboard peserta, dan permission state admin diperiksa. Tiga area diuji pada lima ukuran layar. Logo dan aset menggunakan base relatif. Tidak ada request API backend, mutasi, pengumpulan formulir data pribadi, HTTP error, runtime error, atau request gagal.

Build memakai seed database dalam memori, tidak mengekspor akun, minat, pendaftaran, atau database lokal. Preview admin tidak membuka data atau kontrol manajemen yang memerlukan autentikasi.

Alamat publik https://nassrudin.github.io/nexivo-preview/ telah diperiksa ulang dengan Chrome setelah publikasi: **35 pemeriksaan lulus**, sembilan scan axe bersih, dan seluruh aset berhasil dimuat dari subfolder repository. Tidak ada request API backend/mutasi, HTTP error, atau JavaScript error. Log lokal: `artifacts/interface-online-review.log`.

## Peninjauan visual

Screenshot desktop dan ponsel untuk publik/peserta/admin telah diperiksa. Perbaikan mencakup orbit ilustrasi yang melampaui layar kecil, fokus tabel yang dapat digulir, keterbacaan, latar panel, serta fokus menu mobile. Artefak lokal `artifacts/nexivo-public-*`, `nexivo-participant-*`, `nexivo-management-*`, dan `nexivo-pages-public-*` diabaikan Git.

## Batas pemeriksaan

Tidak mengubah database pengguna atau production. Backend/email/pembayaran/Supabase belum dipublikasikan. Safari/iOS, pembaca layar manual, perangkat fisik, beban trafik, audit keamanan menyeluruh, dan performa lapangan belum diuji. Hasil axe bukan sertifikasi aksesibilitas. Angka performa dari desain sebelumnya tidak digunakan sebagai hasil versi ini.
