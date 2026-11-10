'use client';

import React, { useState, useEffect } from 'react';
import { Settings, DollarSign, TrendingUp, ShoppingBag, ShieldCheck, Save, CheckCircle2, Sliders } from 'lucide-react';
import { formatRupiah } from '@/lib/pricing';

export default function AdminPage() {
  const [markupPercent, setMarkupPercent] = useState<number>(35);
  const [fixedMarkup, setFixedMarkup] = useState<number>(500);
  const [minPrice, setMinPrice] = useState<number>(1500);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
  });

  useEffect(() => {
    // Fetch stats
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {});

    // Fetch current settings
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setMarkupPercent(data.settings.markupPercent || 35);
          setFixedMarkup(data.settings.fixedMarkupIdr || 500);
          setMinPrice(data.settings.minPriceIdr || 1500);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markupPercent,
          fixedMarkupIdr: fixedMarkup,
          minPriceIdr: minPrice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.message || 'Gagal menyimpan pengaturan');
      }
    } catch {
      alert('Gagal menghubungi server');
    } finally {
      setIsSaving(false);
    }
  };

  // Preview simulation calculation
  const sampleCost = 3000; // Modal Rp 3.000 (misal WA Indo)
  const previewRaw = sampleCost + (sampleCost * markupPercent) / 100 + fixedMarkup;
  const previewPrice = Math.max(minPrice, Math.ceil(previewRaw / 100) * 100);
  const previewProfit = previewPrice - sampleCost;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-2.5 rounded-xl bg-surface-card border border-surface-border text-emerald-400">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel & Auto-Markup</h1>
          <p className="text-xs text-zinc-400">
            Atur margin keuntungan otomatis tanpa perlu edit harga ribuan nomor satu per satu
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Total Pesanan</span>
            <ShoppingBag className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {stats.totalOrders.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-zinc-500">Seluruh nomor yang disewa</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">SMS Sukses</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {stats.completedOrders.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-zinc-500">Kode verifikasi terkirim</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Total Omset</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {formatRupiah(stats.totalRevenue)}
          </div>
          <span className="text-[11px] text-zinc-500">Total pembayaran user</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Keuntungan Bersih</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {formatRupiah(stats.totalProfit)}
          </div>
          <span className="text-[11px] text-zinc-500">Profit margin masuk kantong</span>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSaveSettings}
            className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-6"
          >
            <div className="flex items-center space-x-2 border-b border-surface-border/60 pb-4">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Rumus Auto-Markup Harga (Autopilot)
              </h2>
            </div>

            {/* Margin Percentage Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Persentase Keuntungan (Markup %):
                </label>
                <span className="font-mono font-extrabold text-emerald-400 text-sm">
                  +{markupPercent}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="150"
                step="5"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Setiap nomor apapun dari provider otomatis dinaikkan sebesar {markupPercent}%.
              </p>
            </div>

            {/* Fixed Markup Fee */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Biaya Tambahan Flat (Rp per nomor):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                  Rp
                </span>
                <input
                  type="number"
                  value={fixedMarkup}
                  onChange={(e) => setFixedMarkup(Number(e.target.value))}
                  className="w-full bg-surface border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Ditambahkan setelah persentase markup (misal Rp 500 sebagai biaya operasional).
              </p>
            </div>

            {/* Minimum Price */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Batas Harga Jual Minimal (Rp):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                  Rp
                </span>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-full bg-surface border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Mencegah nomor dijual terlalu murah jika provider sedang obral.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              {isSaving ? (
                <span>Menyimpan Pengaturan...</span>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Pengaturan Berhasil Disimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Aturan Markup Baru</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Simulator of Formula */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-surface-card border border-surface-border space-y-4">
            <h3 className="font-bold text-base text-white">Simulasi Perhitungan Live</h3>
            <p className="text-xs text-zinc-400">
              Berikut simulasi harga jual otomatis saat modal nomor dari provider adalah{' '}
              <strong className="text-white">Rp 3.000</strong> (contoh WhatsApp Indo):
            </p>

            <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Modal Provider:</span>
                <span className="font-mono text-zinc-200">{formatRupiah(sampleCost)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Markup Keuntungan (+{markupPercent}%):</span>
                <span className="font-mono text-emerald-400">
                  +{formatRupiah((sampleCost * markupPercent) / 100)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Biaya Flat Tambahan:</span>
                <span className="font-mono text-emerald-400">+{formatRupiah(fixedMarkup)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Pembulatan ke Ratusan:</span>
                <span className="font-mono text-sky-400">Auto Round</span>
              </div>

              <div className="pt-2 border-t border-surface-border/50 flex justify-between font-bold text-sm">
                <span className="text-white">Harga Tampil di Web:</span>
                <span className="font-mono text-emerald-400 text-base font-extrabold">
                  {formatRupiah(previewPrice)}
                </span>
              </div>

              <div className="flex justify-between text-xs font-semibold text-emerald-300">
                <span>Keuntungan Bersih Kamu:</span>
                <span className="font-mono">+{formatRupiah(previewProfit)} / nomor</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
              💡 <strong>Keunggulan Autopilot:</strong> Jika provider pusat menaikkan atau menurunkan harga modal mereka, harga di website kamu otomatis langsung menyesuaikan diri tanpa membuatmu tekor rugi!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
