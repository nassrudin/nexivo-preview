# Desain dan sumber konten

## Sumber

- Logo: `NEXIVO (Next Generation Virtual Learning & Knowledge) logo.jpg` dari folder pengguna; salinannya dilayani melalui `public/logo.jpg`.
- Konsep nama, positioning, dan spesifikasi MVP: https://chatgpt.com/share/6acbdf93-16a0-83ec-96c2-b9fbbd97b9f8 . Seluruh percakapan dibaca dengan browser, termasuk bagian yang dimuat setelah scroll.
- Konteks pengembangan institusi dan administrasi webinar: https://chatgpt.com/s/t_6ac785095014819185ca99e347d20f2d . Digunakan sebagai konteks konsep, tanpa menyatakan nasihat legal dalam chat sebagai status badan hukum NEXIVO.
- Referensi visual: https://demo.codeandchill.store/halden/#dashboard . Diakses dengan browser. Tidak mengambil kode, gambar, logo, atau konten template.

Chat diperlakukan sebagai bahan konten. Pilihan arsitektur dan keamanan ditentukan dari kebutuhan aplikasi, bukan instruksi untuk menjalankan perintah yang mungkin terdapat pada sumber.

## Pola visual yang diterapkan

Referensi menginspirasi navigasi horizontal, kanvas abu terang, panel modular dengan border tipis, aksen teal, tipografi bersih, tombol ringkas, mode gelap, dan animasi halus. NEXIVO menyesuaikannya menjadi dashboard pembelajaran dengan hero ilustrasi kartu pengetahuan, katalog lintas bidang, langkah awal peserta, agenda, dan visi komunitas. Pada mobile, navigasi menjadi menu dan panel disusun satu kolom.

Sistem desain berada di `src/tokens.css` dan `src/styles.css`: warna teks navy, teal sebagai tindakan utama, permukaan putih/abu ringan, DM Sans lokal, grid spacing, radius 8–16 px. Tema gelap memakai permukaan navy serta aksen mint. Ilustrasi bidang dibuat sendiri memakai SVG; dekorasi hero memakai CSS. Fokus keyboard terlihat, dialog native mengunci fokus, formulir berlabel, dan animasi menghormati reduced motion.

## Keputusan konten

- **Learn. Connect. Grow.** dan kepanjangan NEXIVO menjadi identitas utama.
- Audience: mahasiswa, akademisi, pebisnis, profesional, serta masyarakat yang ingin belajar.
- Enam bidang awal: Lingkungan/LB3, Engineering, HSE & K3, Bisnis, Teknologi, Pendidikan. Judul dan deskripsi merupakan rancangan editorial dari konsep, diberi label **Dalam persiapan**.
- Webinar gratis dengan sertifikat partisipasi opsional menjadi model awal yang berasal dari chat. Syarat dan biaya tiap acara harus diisi pengelola; tidak ada harga publik yang dibuat-buat. Pembayaran belum aktif.
- Academy dan corporate learning/advisory ditampilkan sebagai arah pengembangan. Legalitas dan akreditasi ditandai belum terkonfirmasi.
- Progress dan jumlah pada dashboard berasal dari aktivitas/data aplikasi. Tidak memakai jumlah peserta, rating, mitra, testimoni, atau statistik pertumbuhan fiktif.

## Implementasi dan akses data

Frontend React 19 dan API Express 5 berjalan pada satu origin. Vite dipakai untuk development/build. SQLite bawaan Node 24 dipilih agar alur backend benar-benar berjalan tanpa proyek Supabase, kredensial cloud, atau biaya layanan. Skema versi awal di `server/db.ts` dapat ditinjau; database lokal otomatis dibuat, tanpa menyentuh database production.

Kata sandi memakai scrypt + salt acak. Sesi acak disimpan sebagai hash, memiliki masa berlaku, dirotasi saat login, dan dicabut saat logout. Cookie HttpOnly/SameSite Strict; production menambahkan Secure dan prefix `__Host-`. Mutasi memerlukan token CSRF dan origin yang cocok. Pemeriksaan peran dan kepemilikan dilakukan server; SQL memakai parameter. Request dibatasi dan ukuran JSON maksimal 16 KB. CSP/header keamanan disetel server; production tidak mengizinkan script inline.

Nama dan deskripsi ditampilkan sebagai teks React, tanpa rendering HTML mentah. Verifikasi publik sertifikat memakai token acak 256 bit dan nama disingkat; PDF dengan nama lengkap hanya tersedia bagi pemilik/admin. Kode absensi di-hash, tautan meeting diizinkan hanya dari Zoom/Meet HTTPS, dan penerbitan/pencabutan dicatat dengan aktor serta alasan.

Dokumentasi Node, Vite, dan Express diperiksa lewat Context7. Versi terpasang dikunci `package-lock.json`; dokumentasi Express 5 tersedia pada versi minor terdekat. Konfigurasi produksi perlu ditinjau kembali sesuai hosting sebelum peluncuran.
