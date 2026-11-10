import React from 'react';
import { ShieldCheck, RefreshCw, Zap, Headphones } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-surface-border bg-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-black">
                BN
              </div>
              <span className="font-bold text-lg text-white">BuyNokos</span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Penyedia nomor virtual OTP otomatis 24 jam untuk verifikasi WhatsApp, Telegram, TikTok, dan aplikasi lainnya dengan garansi auto-refund jika SMS tidak masuk.
            </p>
          </div>

          {/* Value Props */}
          <div className="flex items-start space-x-3">
            <RefreshCw className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-sm text-white">100% Auto-Refund</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Jika SMS kode OTP tidak sampai dalam 20 menit atau Anda batalkan, saldo kembali 100% tanpa potongan.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Zap className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-sm text-white">QRIS Instan 24 Jam</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Topup saldo otomatis masuk dalam hitungan detik via BCA, Mandiri, BRI, BNI, Dana, OVO, GoPay, dan ShopeePay.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Headphones className="w-6 h-6 text-sky-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-sm text-white">Bantuan & Komunitas</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Punya pertanyaan atau butuh bantuan integrasi API? Hubungi tim support via WhatsApp atau Telegram.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-surface-border/50 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} BuyNokos. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span>Server: Cloudflare Workers Edge</span>
            <span>Database: Supabase Realtime</span>
            <span>Gateway: QRIS Terverifikasi</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
