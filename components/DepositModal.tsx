'use client';

import React, { useState } from 'react';
import { X, QrCode, CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { formatRupiah } from '@/lib/pricing';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

const PRESET_AMOUNTS = [10000, 25000, 50000, 100000];

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(25000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [invoice, setInvoice] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const currentAmount = customAmount ? parseInt(customAmount, 10) || 0 : selectedAmount;

  const handleCreateInvoice = async () => {
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
      alert('Gagal menghubungi server untuk pembuatan QRIS');
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
        onSuccess(data.newBalance);
        onClose();
      } else {
        alert(data.message || 'Gagal memproses simulasi');
      }
    } catch {
      alert('Terjadi kesalahan simulasi');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-surface-card border border-surface-border rounded-3xl p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!invoice ? (
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Isi Saldo QRIS Instan</h3>
                <p className="text-xs text-zinc-400">Otomatis terverifikasi 24 jam nonstop</p>
              </div>
            </div>

            {/* Presets */}
            <div className="mt-5 space-y-3">
              <label className="text-xs font-semibold text-zinc-400 block">
                Pilih Nominal Saldo:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
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

              {/* Custom amount */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  Atau Nominal Bebas (Min. Rp 5.000):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Contoh: 15000"
                    className="w-full bg-surface border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-3.5 rounded-xl bg-surface border border-surface-border text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Metode Pembayaran</span>
                <span className="font-semibold text-white">QRIS (Semua Bank & E-Wallet)</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Biaya Admin</span>
                <span className="font-semibold text-emerald-400">Rp 0 (Gratis)</span>
              </div>
              <div className="flex justify-between text-zinc-300 font-bold pt-1 border-t border-surface-border/50">
                <span>Total Bayar</span>
                <span className="font-mono text-emerald-400 text-sm">
                  {formatRupiah(currentAmount)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCreateInvoice}
              disabled={isLoading || currentAmount < 5000}
              className="mt-5 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Lanjutkan Pembayaran QRIS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* QR Code Invoice View */
          <div className="text-center">
            <h3 className="font-bold text-lg text-white">Scan QRIS untuk Membayar</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Buka BCA, Mandiri, Dana, GoPay, OVO, atau ShopeePay lalu scan QRIS di bawah:
            </p>

            {/* QR Image */}
            <div className="mt-4 p-4 bg-white rounded-2xl inline-block shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={invoice.qrUrl}
                alt="QRIS Payment"
                className="w-52 h-52 object-contain mx-auto"
              />
            </div>

            {/* Total Pay with Unique Code */}
            <div className="mt-4 p-3 rounded-xl bg-surface border border-surface-border">
              <span className="text-[11px] text-zinc-400 block">Total yang Harus Dibayar:</span>
              <div className="text-2xl font-mono font-extrabold text-emerald-400 tracking-wider">
                {formatRupiah(invoice.totalPay)}
              </div>
              <p className="text-[10px] text-amber-400 mt-1">
                *Harap transfer sesuai angka di atas (termasuk kode unik) agar saldo otomatis masuk.
              </p>
            </div>

            {/* Simulation button for developer testing */}
            <div className="mt-4 pt-3 border-t border-surface-border/60">
              <button
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="w-full py-2.5 rounded-xl bg-surface-hover hover:bg-surface border border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all"
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
    </div>
  );
}
