import React from 'react';
import { BookOpen, HelpCircle, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GuidePage() {
  const steps = [
    {
      step: '1',
      title: 'Isi Saldo Akun via QRIS',
      desc: 'Klik tombol "Isi Saldo (QRIS)" di pojok kanan atas. Masukkan nominal yang ingin Anda isi (misal Rp 10.000 atau Rp 20.000), lalu scan kode QRIS menggunakan m-Banking (BCA, Mandiri, BRI) atau E-Wallet (Dana, GoPay, OVO, ShopeePay). Saldo akan langsung masuk otomatis dalam hitungan detik.',
    },
    {
      step: '2',
      title: 'Pilih Layanan & Negara',
      desc: 'Di halaman beranda, pilih aplikasi yang ingin Anda verifikasi (misalnya WhatsApp, Telegram, atau TikTok). Kemudian tentukan negara nomor yang diinginkan (misal Indonesia +62 atau USA +1).',
    },
    {
      step: '3',
      title: 'Dapatkan Nomor Virtual',
      desc: 'Klik tombol "Beli Nomor Sekarang". Sistem server kami akan meminta 1 nomor virtual aktif ke penyedia modem pool pusat secara instan.',
    },
    {
      step: '4',
      title: 'Ketik Nomor ke Aplikasi & Tunggu SMS',
      desc: 'Salin nomor yang tampil di layar, lalu masukkan ke dalam aplikasi WhatsApp/Telegram Anda untuk meminta kode SMS verifikasi.',
    },
    {
      step: '5',
      title: 'Kode OTP Masuk Otomatis!',
      desc: 'Dalam 5–30 detik, kotak kode OTP di layar web akan otomatis berubah dan menampilkan 6-digit kode verifikasi Anda. Salin kodenya dan proses pendaftaran selesai!',
    },
  ];

  const faqs = [
    {
      q: 'Bagaimana jika kode SMS OTP tidak sampai?',
      a: 'Jangan panik! Anda punya waktu tunggu 20 menit. Jika nomor diblokir oleh WhatsApp atau SMS tidak kunjung sampai, cukup klik tombol "Batalkan (Auto-Refund)". Saldo Anda akan dikembalikan 100% secara utuh ke akun tanpa potongan biaya sepeser pun!',
    },
    {
      q: 'Apakah satu nomor bisa dipakai berulang kali?',
      a: 'Layanan ini adalah nomor sewa sekali pakai (Disposable Virtual Number). Nomor ini aktif selama 20 menit untuk menerima 1–2 kali SMS kode verifikasi pendaftaran akun baru.',
    },
    {
      q: 'Metode pembayaran apa saja yang didukung?',
      a: 'Kami mendukung QRIS Standar Bank Indonesia. Anda bisa membayar menggunakan BCA, Mandiri, BRI, BNI, Danamon, Seabank, Jago, Dana, GoPay, OVO, ShopeePay, LinkAja, dan dompet digital lainnya.',
    },
    {
      q: 'Apakah web ini melayani pesanan 24 jam?',
      a: 'Ya, seluruh sistem berjalan 100% otomatis (autopilot) melalui cloud edge serverless tanpa perlu menunggu admin online.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-12">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Panduan Pembelian & Tanya Jawab</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Pelajari cara menyewa nomor virtual OTP dan kebijakan garansi auto-refund
        </p>
      </div>

      {/* 5 Langkah Mudah */}
      <div className="mb-14">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>5 Langkah Mudah Membeli Nomor Nokos</span>
        </h2>

        <div className="space-y-4">
          {steps.map((s) => (
            <div
              key={s.step}
              className="p-5 rounded-2xl bg-surface-card border border-surface-border flex items-start space-x-4"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-black font-extrabold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                {s.step}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{s.title}</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-14">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-sky-400" />
          <span>Pertanyaan yang Sering Diajukan (FAQ)</span>
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-surface-card border border-surface-border">
              <h3 className="font-bold text-sm text-white mb-2">{faq.q}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 to-surface-card border border-emerald-500/30 text-center">
        <h3 className="text-xl font-bold text-white">Sudah Siap Mencoba?</h3>
        <p className="text-xs text-zinc-400 mt-1 mb-5">
          Pilih aplikasi Anda sekarang dan nikmati verifikasi SMS otomatis dalam hitungan detik.
        </p>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
        >
          <span>Mulai Sewa Nomor Sekarang</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
