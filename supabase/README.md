# Panduan Setup Database Supabase untuk BuyNokos

Ikuti langkah cepat berikut untuk mengaktifkan database BuyNokos di Supabase (100% Gratis):

### 1. Bikin Project Supabase
1. Kunjungi [https://supabase.com](https://supabase.com) dan login dengan akun GitHub kamu.
2. Klik tombol **"New project"**.
3. Isi kolom:
   - **Name**: `buynokos` (atau sesuai keinginan)
   - **Database Password**: buat password yang kuat dan catat
   - **Region**: Pilih **Singapore (ap-southeast-1)** agar latensi ke Indonesia paling kencang (<30ms).
4. Klik **"Create new project"** dan tunggu sekitar 1-2 menit hingga provisioning selesai.

---

### 2. Eksekusi Script SQL Schema
1. Di dashboard Supabase kamu, buka menu **SQL Editor** (ikon terminal `>_` di sidebar kiri).
2. Klik **"New query"**.
3. Buka dan copy seluruh isi file [`schema.sql`](./schema.sql).
4. Paste ke dalam query box di Supabase, lalu klik tombol **"Run"** (atau tekan `Ctrl + Enter`).
5. Akan muncul notifikasi hijau: `Success. No rows returned`.
   *(Semua tabel `profiles`, `orders`, `deposits`, `settings`, fungsi Auto-Refund, dan Realtime sudah otomatis aktif!)*

---

### 3. Mengambil API Keys
1. Buka menu **Project Settings** (ikon roda gigi di kiri bawah).
2. Pilih submenu **API**.
3. Salin 3 nilai penting berikut:
   - **Project URL** (misal: `https://abcdefghijkl.supabase.co`) $\rightarrow$ masukkan ke `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** (kunci panjang) $\rightarrow$ masukkan ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (klik reveal key) $\rightarrow$ masukkan ke `SUPABASE_SERVICE_ROLE_KEY` (rahasia server)

Selesai! Database Supabase kamu sudah siap 100% melayani transaksi pembelian nokos dan auto-refund!
