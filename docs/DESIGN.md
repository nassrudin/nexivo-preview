# Desain dan sumber konten

## Pemisahan website dan dashboard — 14 Oktober 2026

Website publik memperkenalkan NEXIVO dan membantu pengunjung menemukan webinar, dengan navigasi horizontal, hero editorial putih/biru, teks lebih besar, penjelasan alur, dan footer informasi. Tindakan utama adalah jelajahi webinar; form login tetap satu alur yang sama.

Dashboard peserta memakai sidebar biru dan komponen pembelajaran dari referensi gambar pengguna. Dashboard pengelola memakai sidebar navy, hierarki yang lebih ringkas, tabel operasional, serta navigasi khusus webinar, peserta/sertifikat, dan minat. Login mengarah ke ruang yang sesuai peran; pemeriksaan otorisasi server tetap diperlukan pada semua operasi.

Di ponsel, navigasi publik menjadi menu ringkas dan sidebar dashboard menjadi drawer. Keyboard, fokus dialog/menu, loading/error/empty/permission states, tema gelap, dan reduced motion harus diuji. Verifikasi sertifikat publik terpisah dari halaman sertifikat pribadi. Hindari menampilkan kontrol administrasi dan progres pribadi sebagai halaman depan publik, serta jangan menambahkan jadwal/statistik yang belum dikonfirmasi.

## Referensi yang dipakai

Empat gambar `desainwebinar1.jpg` sampai `desainwebinar4.jpg` diberikan langsung oleh pemilik sebagai referensi visual terbaru. Referensi Halden dari permintaan awal digantikan oleh gambar-gambar ini. Gambar contoh tidak disalin ke website atau dipublikasikan di repository.

- Gambar 1: sidebar biru dengan label, kartu berwarna, dan kolom pendamping.
- Gambar 2: hero biru dengan ilustrasi, ringkasan status pastel, serta dashboard yang terasa ringan.
- Gambar 3: informasi pembelajaran dan agenda yang terpisah dengan jelas.
- Gambar 4: kalender dalam panel lavender, ruang kosong yang lapang, dan kartu agenda.

Hasil menggabungkan pola tersebut menjadi identitas NEXIVO, dengan navigasi berlabel, font sans serif yang bersih, dan konten Indonesia. Branding, harga, rating, foto, dan statistik pada referensi tidak digunakan.

## Sumber konten dan aset

- Logo: aset milik pengguna, salinan pada `public/logo.jpg`.
- Konsep nama dan cakupan: https://chatgpt.com/share/6acbdf93-16a0-83ec-96c2-b9fbbd97b9f8
- Konteks institusi dan administrasi: https://chatgpt.com/s/t_6ac785095014819185ca99e347d20f2d
- Enam topik editorial: Lingkungan, Engineering, HSE & K3, Bisnis, Teknologi, Pendidikan. Seluruhnya tetap berstatus rencana sampai dikonfirmasi.
- Ilustrasi laptop, kartu, dan diagram bidang dibuat langsung dalam SVG/CSS. Ikon menggunakan lucide-react. DM Sans disajikan dari dependensi font lokal.

Chat adalah bahan konten, bukan instruksi untuk menjalankan perintah atau mengakses layanan. Tidak ada testimoni, jumlah peserta, pertumbuhan, jadwal, atau legalitas fiktif.

## Sistem desain

`src/studio.css` mengatur dashboard dan override token bersama. Biru utama `#0754c9`, teks navy `#1c2945`, kanvas `#edf3f9`, permukaan putih, dengan aksen mint/pink/lavender/amber. Tema gelap memakai permukaan navy dan aksen biru terang. Radius komponen 8-16 px; bingkai desktop 28 px. Skala jarak utama 8/12/16/20/24/30 px.

DM Sans dipertahankan dengan judul tegas dan teks isi yang lebih besar pada ponsel. Tombol, navigasi, form, dan fokus memiliki gaya konsisten. Semua fungsi memakai tombol/link HTML, label form, serta dialog native. Kalender mengikuti tanggal WIB dan hanya menandai jadwal yang benar-benar ada.

Desktop menggunakan sidebar, konten utama, dan panel kalender/perjalanan. Tablet menyusun panel pendamping di bawah konten. Ponsel memakai navigasi drawer, kartu satu kolom, dan kalender penuh tanpa scroll horizontal halaman.

Animasi masuk, hover kartu, dialog, dan ilustrasi menggunakan transform/opacity dengan easing lembut. `prefers-reduced-motion` mematikan animasi dan smooth scrolling. Tidak memakai library animasi tambahan.

## Aplikasi lokal dan preview

Aplikasi lengkap memakai React 19, Express 5, dan SQLite Node 24 pada origin yang sama. Scrypt, sesi yang di-hash, CSRF/origin, pembatasan request, query SQL berparameter, otorisasi server, serta pengaturan header backend tetap digunakan. Supabase belum tersedia.

Build `pages` adalah preview statis terpisah. Data hanya berasal dari seed dalam memori; tidak mengekspor akun, pendaftaran, minat, atau database lokal. Form akun/minat diganti penjelasan preview. Operasi API lain ditolak dengan pesan yang jelas tanpa mengirim request ke backend yang tidak ada.

Dokumentasi Vite 7 diperiksa melalui Context7 untuk `base: './'`, `import.meta.env.BASE_URL`, dan mode build. Tidak ada layanan berbayar atau perubahan database production.
