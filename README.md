# Dapur Kita — fondasi toko online

Fondasi proyek Next.js + TypeScript + Tailwind CSS + Supabase untuk toko online makanan/minuman Indonesia. Antarmuka awal mencakup landing page, login/daftar berbasis Supabase Auth, dan halaman keranjang contoh dengan kalkulasi promo 5% saat total unit minimal 3.

## Status implementasi yang jujur

**Sudah disiapkan pada tahap awal:**
- Struktur proyek Next.js dan konfigurasi TypeScript/Tailwind.
- Beranda responsif dengan katalog visual contoh.
- Form login/daftar yang memakai Supabase Auth dan pesan verifikasi email.
- Halaman keranjang contoh dan fungsi hitung promo.
- SQL migration awal berisi tabel inti, indeks, enum status, trigger profil, kebijakan RLS awal, dan seed produk.
- `.env.example` tanpa secret asli.

**Belum siap produksi / perlu tahap lanjutan:**
- Katalog dan gambar harus diambil langsung dari database/storage; beranda saat ini masih menggunakan data contoh.
- Tombol tambah ke keranjang di katalog, checkout, alamat, pesanan, dashboard admin, upload foto, dan PDF struk belum diintegrasikan.
- Integrasi QRIS/GoPay/transfer melalui Midtrans/Xendit, webhook bertanda tangan, refund, dan COD belum dibuat atau diuji. Jangan menerima pembayaran nyata dari versi ini.
- SQL RLS perlu diuji secara menyeluruh; pembuatan order produksi harus dilakukan melalui fungsi server/database atomik yang menghitung ulang harga, diskon, dan stok.
- Migrasi belum menyiapkan bucket Storage; bucket dan kebijakannya perlu dibuat saat tahap storage.

## Menjalankan lokal

1. Pasang Node.js LTS (disarankan Node 20 atau lebih baru) dan npm.
2. Ekstrak folder proyek, buka terminal di folder `dapur-kita`.
3. Jalankan `npm install`.
4. Salin `.env.example` menjadi `.env.local`.
5. Buat proyek Supabase dan isi `NEXT_PUBLIC_SUPABASE_URL` serta `NEXT_PUBLIC_SUPABASE_ANON_KEY` di `.env.local`.
6. Di Supabase SQL Editor, jalankan isi `supabase/migrations/0001_initial_schema.sql`.
7. Di Supabase Authentication → URL Configuration, set Site URL ke `http://localhost:3000` dan tambahkan redirect URL `http://localhost:3000/auth/callback`.
8. Jalankan `npm run dev`, lalu buka `http://localhost:3000`.

Jika Supabase belum diisi, halaman beranda dan keranjang contoh bisa ditinjau, tetapi login/daftar akan meminta konfigurasi.

## Membuat admin dengan aman

1. Daftarkan akun melalui form dan verifikasi emailnya.
2. Cari UUID akun di Supabase Authentication → Users.
3. Jalankan query SQL admin yang dicontohkan di bagian akhir migration dengan UUID akun yang benar-benar telah diverifikasi.
4. Jangan pernah menyediakan fitur perubahan role admin untuk pelanggan di frontend.

## Catatan pembayaran

Gunakan sandbox/test mode terlebih dahulu. Secret key gateway dan service role Supabase hanya boleh berada pada environment server/deployment, tidak pada variabel `NEXT_PUBLIC_*`, repositori publik, atau browser. Pembayaran baru boleh dianggap lunas setelah webhook resmi diverifikasi di server.
