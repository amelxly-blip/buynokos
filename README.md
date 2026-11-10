# 🚀 BuyNokos - Platform Jual Nomor Virtual OTP Otomatis 24 Jam

Aplikasi web modern berbasis **Next.js 15 (App Router)**, **Tailwind CSS (Dark Obsidian Glassmorphism)**, **Cloudflare Workers (OpenNext Edge)**, dan **Supabase Realtime Database** untuk bisnis penjualan nomor virtual (nokos / SMS OTP verification) secara 100% autopilot tanpa campur tangan admin.

---

## ✨ Fitur Unggulan

- **Autopilot 24 Jam**: Penarikan nomor virtual dan penerimaan kode OTP berjalan secara *real-time* langsung dari server modem pool provider.
- **Garansi Auto-Refund 100%**: Jika nomor diblokir oleh WhatsApp atau SMS tidak kunjung sampai dalam 20 menit, pembeli dapat menekan tombol *Batalkan* dan saldo akan kembali 100% ke akun secara instan tanpa potongan.
- **Auto-Markup Margin Engine**: Tidak perlu mengedit ribuan harga nomor secara manual! Cukup tentukan persentase keuntungan (misal +35%) di menu Admin, maka seluruh ratusan kombinasi negara dan aplikasi otomatis mengikuti rumus harga secara dinamis.
- **QRIS Dinamis Otomatis**: Integrasi pembayaran QRIS via Tokopay / Pakasir / Tripay lengkap dengan webhook verifikasi otomatis dan mode simulasi testing.
- **Edge Runtime Ready**: Ringan dan ultra cepat, siap di-deploy ke Cloudflare Workers / Cloudflare Pages via `@opennextjs/cloudflare`.

---

## 🛠️ Arsitektur Sistem

```text
  [ Pembeli ] ──(Pilih Negara & Aplikasi)──> [ Web BuyNokos ]
       │                                            │
       │ (1. Bayar via QRIS)                        │ (2. Request Nomor Baru)
       ▼                                            ▼
[ Payment Gateway ] ──(Webhook Instan)──> [ SMS Provider (SMS-Activate) ]
  (Tokopay/Pakasir)                                 │
                                                    │ (3. Nomor HP + Order ID)
                                                    ▼
[ Layar Pembeli ] <──(Polling OTP 3 Detik)── [ Backend API / Supabase ]
       │
       └─── [ SMS Masuk! Kode OTP Muncul Otomatis di Layar ]
```

---

## 📋 Langkah-Langkah Setup Lengkap

### LANGKAH 1: Setup Database di Supabase (Gratis)

1. Buka [https://supabase.com](https://supabase.com) dan login dengan akun GitHub kamu.
2. Buat proyek baru (**New project**):
   - **Name**: `buynokos`
   - **Region**: Pilih **Singapore (ap-southeast-1)** agar koneksi dari Indonesia sangat kencang.
3. Setelah database aktif, klik menu **SQL Editor** (`>_` di sidebar kiri).
4. Klik **New query**, lalu copy dan paste seluruh isi file [`supabase/schema.sql`](./supabase/schema.sql).
5. Klik **Run**. Seluruh tabel (`profiles`, `orders`, `deposits`, `settings`), fungsi *Atomic Auto-Refund*, dan *Realtime publication* akan langsung aktif!
6. Buka **Project Settings** -> **API**, lalu catat:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`

---

### LANGKAH 2: Setup SMS Provider (SMS-Activate / 5sim)

1. Daftar di penyedia SMS global [https://sms-activate.org](https://sms-activate.org).
2. Isi saldo modal awal (misal $2 – $5 via Crypto / Virtual Card / E-wallet).
3. Buka menu profil -> **API Settings** dan salin **API Key** Anda.
4. Masukkan API Key tersebut ke environment variable:
   ```env
   SMS_ACTIVATE_API_KEY=kunci_api_sms_activate_kamu
   ```
*(Catatan: Tanpa API key pun, aplikasi otomatis berjalan dalam **Sandbox Testing Mode** dengan nomor virtual simulasi dan SMS OTP dummy setelah 8 detik).*

---

### LANGKAH 3: Setup Payment Gateway QRIS (Tokopay / Pakasir / Tripay)

Pilih salah satu gateway QRIS favorit di Indonesia:

#### Opsi A: Tokopay (Paling Populer & Mudah)
1. Daftar di [https://tokopay.id](https://tokopay.id).
2. Masuk ke menu **Pengaturan API** dan salin `Merchant ID` & `Secret Key`.
3. Set Webhook URL di dashboard Tokopay ke:
   `https://domain-kamu.workers.dev/api/deposit/webhook`
4. Masukkan ke file `.env`:
   ```env
   PAYMENT_GATEWAY_PROVIDER=tokopay
   TOKOPAY_MERCHANT_ID=...
   TOKOPAY_SECRET_KEY=...
   ```

#### Opsi B: Pakasir
1. Daftar di [https://pakasir.com](https://pakasir.com).
2. Salin `API Key` dan atur Webhook URL ke `https://domain-kamu.workers.dev/api/deposit/webhook`.
3. Masukkan ke file `.env`:
   ```env
   PAYMENT_GATEWAY_PROVIDER=pakasir
   PAKASIR_API_KEY=...
   ```

*(Untuk keperluan testing awal, biarkan `PAYMENT_GATEWAY_PROVIDER=sandbox`. Kamu bisa mengklik tombol "Simulasikan Pembayaran Sukses" langsung di modal pembayaran tanpa keluar uang sepeser pun).*

---

### LANGKAH 4: Deploy ke Cloudflare Workers / Cloudflare Pages

Proyek ini sudah dilengkapi konfigurasi `@opennextjs/cloudflare` dan `wrangler.jsonc`.

#### Cara 1: Deploy Otomatis via Cloudflare Dashboard (Direkomendasikan)
1. Buka [https://dash.cloudflare.com](https://dash.cloudflare.com).
2. Masuk ke **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Pilih repository GitHub: `amelxly-blip/buynokos`.
4. Pilih preset **Next.js** (atau Framework preset **None / Custom**):
   - **Build command**: `npx @opennextjs/cloudflare build`
   - **Build output directory**: `.open-next/assets`
5. Di menu **Environment Variables**, masukkan variabel dari file `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SMS_ACTIVATE_API_KEY`
   - `PAYMENT_GATEWAY_PROVIDER`
6. Klik **Save and Deploy**. Website Anda akan langsung online dengan domain gratis `.workers.dev` atau `.pages.dev`!

#### Cara 2: Deploy Cepat via Terminal (Wrangler CLI)
```bash
# Login ke Cloudflare
npx wrangler login

# Build & Deploy
npm run deploy
```

---

## 💻 Menjalankan di Lokal (Development)

```bash
# 1. Clone repository
git clone https://github.com/amelxly-blip/buynokos.git
cd buynokos

# 2. Install dependencies
npm install

# 3. Buat file .env.local
cp .env.example .env.local

# 4. Jalankan server lokal
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## ⚙️ Pengaturan Auto-Markup Keuntungan

Buka halaman `/admin` di website Anda untuk mengatur margin profit:
- **Persentase Margin**: Menaikkan modal provider secara proporsional (default: +35%).
- **Fixed Fee**: Tambahan biaya tetap per nomor (misal Rp 500).
- **Harga Minimal**: Membatasi harga agar tidak dijual di bawah angka tertentu (misal minimal Rp 1.500).

Semua kalkulasi otomatis dibulatkan ke ratusan terdekat (*auto round up*) agar nominal harga rapi dan pas di mata pembeli.

---

## 📄 Lisensi

MIT License. Dibuat dengan bangga untuk komunitas digital marketer & developer Indonesia.
