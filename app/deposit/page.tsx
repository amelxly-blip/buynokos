'use client';

import React, { useState } from 'react';
import { QrCode, ShieldCheck, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { formatRupiah } from '@/lib/pricing';

const PRESET_AMOUNTS = [10000, 20000, 50000, 100000, 200000];

export default function DepositPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(20000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [invoice, setInvoice] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const currentAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;

  const handleCreateQRIS = async () => {
    if (currentAmount < 5000) {
      alert('Minimal isi saldo adalah Rp 5.000');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/deposit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: currentAmount }),
      });
      const data = await res.json();
      if (data.success) {
        setInvoice(data.data);
      } else {
        alert(data.message || 'Gagal membuat QRIS');
      }
    } catch {
      alert('Gagal membuat tagihan QRIS');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!invoice) return;
    setIsSimulating(true);

    try {
      const res = await fetch('/api/deposit/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositId: invoice.depositId,
          order_id: invoice.depositId,
          status: 'Dibayar',
        }),
      });
      const data = await res.json();

      if (data.success) {
        alert(`Pembayaran QRIS berhasil! Saldo Rp ${invoice.amount.toLocaleString('id-ID')} telah ditambahkan.`);
        window.dispatchEvent(
          new CustomEvent('balance_updated', { detail: { balance: data.newBalance } })
        );
        window.location.href = '/';
      } else {
        alert(data.message || 'Gagal memproses simulasi');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white">Isi Saldo Akun (QRIS Instan)</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Dapat dibayar menggunakan semua aplikasi bank & e-wallet di Indonesia
        </p>
      </div>

      {!invoice ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-card border border-surface-border space-y-6">
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-3">
              Pilih Nominal Deposit:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-3 px-4 rounded-xl border text-sm font-mono font-bold transition-all ${
                    selectedAmount === amt && !customAmount
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'bg-surface hover:bg-surface-hover border-surface-border text-zinc-300'
                  }`}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-2">
              Atau Masukkan Nominal Sendiri:
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">
                Rp
              </span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Minimal 5000"
                className="w-full bg-surface border border-surface-border rounded-xl pl-12 pr-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-surface-border text-xs space-y-2">
            <div className="flex justify-between text-zinc-400">
              <span>Metode Pembayaran:</span>
              <span className="font-semibold text-white">QRIS Dinamis 24 Jam</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Biaya Transaksi:</span>
              <span className="font-semibold text-emerald-400">Rp 0 (Gratis)</span>
            </div>
            <div className="flex justify-between text-zinc-200 font-bold pt-2 border-t border-surface-border/50 text-sm">
              <span>Total Bayar:</span>
              <span className="font-mono text-emerald-400 text-base">
                {formatRupiah(currentAmount)}
              </span>
            </div>
          </div>

          <button
            onClick={handleCreateQRIS}
            disabled={isLoading || currentAmount < 5000}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Buat Kode QRIS Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-card border border-surface-border text-center space-y-4">
          <h3 className="font-bold text-lg text-white">Scan QRIS Ini</h3>
          <p className="text-xs text-zinc-400">
            Gunakan aplikasi BCA, Mandiri, Dana, GoPay, OVO, atau ShopeePay
          </p>

          <div className="p-4 bg-white rounded-2xl inline-block shadow-2xl my-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={invoice.qrUrl}
              alt="QRIS Code"
              className="w-60 h-60 object-contain mx-auto"
            />
          </div>

          <div className="p-4 rounded-xl bg-surface border border-surface-border text-center">
            <span className="text-xs text-zinc-400 block mb-1">Total Pembayaran Persis:</span>
            <div className="text-2xl font-mono font-black text-emerald-400">
              {formatRupiah(invoice.totalPay)}
            </div>
            <p className="text-[11px] text-amber-400 mt-1">
              *Harap transfer tepat hingga 2 digit terakhir agar server otomatis mendeteksi deposit Anda.
            </p>
          </div>

          <div className="pt-4 border-t border-surface-border/50">
            <button
              onClick={handleSimulatePayment}
              disabled={isSimulating}
              className="w-full py-3 rounded-xl bg-surface-hover hover:bg-surface border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center space-x-2"
            >
              {isSimulating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Simulasikan Pembayaran Sukses (Testing Mode)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
