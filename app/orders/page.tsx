'use client';

import React, { useState, useEffect } from 'react';
import { NokosOrder } from '@/types';
import { History, Copy, Check, CheckCircle2, XCircle, Clock, Smartphone } from 'lucide-react';
import { formatRupiah } from '@/lib/pricing';

export default function OrdersPage() {
  const [orders, setOrders] = useState<NokosOrder[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('buynokos_active_orders');
    if (saved) {
      try {
        setOrders(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-2.5 rounded-xl bg-surface-card border border-surface-border text-emerald-400">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Riwayat Pemesanan Nokos</h1>
          <p className="text-xs text-zinc-400">Daftar nomor virtual dan kode OTP yang pernah Anda sewa</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-card border border-surface-border">
          <Smartphone className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">Belum Ada Riwayat Order</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Anda belum pernah memesan nomor. Silakan kembali ke beranda untuk memilih layanan WhatsApp, Telegram, dll.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="p-4 rounded-2xl bg-surface-card border border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-surface border border-surface-border text-xl">
                  📱
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{o.serviceName}</span>
                    <span className="text-xs text-zinc-400">({o.countryName})</span>
                  </div>
                  <div className="font-mono text-sm font-semibold text-emerald-400 mt-0.5">
                    +{o.phoneNumber}
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    {new Date(o.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* OTP Code Box */}
              <div className="flex items-center space-x-4">
                {o.otpCode ? (
                  <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                    <span className="text-xs text-emerald-400 font-medium">OTP:</span>
                    <span className="font-mono font-black text-white text-base tracking-wider">
                      {o.otpCode}
                    </span>
                    <button
                      onClick={() => copyCode(o.otpCode!, o.id)}
                      className="p-1 rounded text-zinc-400 hover:text-white"
                      title="Salin Kode"
                    >
                      {copiedId === o.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 italic">Tidak ada SMS masuk</div>
                )}

                {/* Status Badge */}
                <div>
                  {o.status === 'SMS_RECEIVED' && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Berhasil</span>
                    </span>
                  )}
                  {o.status === 'CANCELLED' && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Dibatalkan (Refund)</span>
                    </span>
                  )}
                  {o.status === 'PENDING_SMS' && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Menunggu SMS</span>
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-zinc-200">
                    {formatRupiah(o.price)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
