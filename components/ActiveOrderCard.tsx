'use client';

import React, { useState, useEffect } from 'react';
import { NokosOrder } from '@/types';
import { Copy, Check, Clock, RefreshCw, XCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { formatRupiah } from '@/lib/pricing';

interface ActiveOrderCardProps {
  order: NokosOrder;
  onOrderUpdated?: (order: NokosOrder) => void;
  onOrderCancelled?: (orderId: string, refundedAmount: number) => void;
}

export default function ActiveOrderCard({
  order,
  onOrderUpdated,
  onOrderCancelled,
}: ActiveOrderCardProps) {
  const [currentOrder, setCurrentOrder] = useState<NokosOrder>(order);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('20:00');
  const [isCancelling, setIsCancelling] = useState(false);

  // Countdown timer logic
  useEffect(() => {
    const target = new Date(currentOrder.expiresAt).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentOrder.expiresAt]);

  // Live SMS Poller: checks every 3 seconds if status is PENDING_SMS
  useEffect(() => {
    if (currentOrder.status !== 'PENDING_SMS') return;

    const poller = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/order/${currentOrder.id}/status?providerOrderId=${currentOrder.providerOrderId}&createdAt=${currentOrder.createdAt}`
        );
        const data = await res.json();

        if (data.success && data.status === 'RECEIVED' && data.code) {
          const updated: NokosOrder = {
            ...currentOrder,
            status: 'SMS_RECEIVED',
            otpCode: data.code,
            fullSms: data.smsText,
          };
          setCurrentOrder(updated);
          onOrderUpdated?.(updated);
          clearInterval(poller);
        } else if (data.status === 'CANCELLED') {
          const updated: NokosOrder = { ...currentOrder, status: 'CANCELLED' };
          setCurrentOrder(updated);
          clearInterval(poller);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(poller);
  }, [currentOrder, onOrderUpdated]);

  const copyToClipboard = (text: string, type: 'number' | 'otp') => {
    navigator.clipboard.writeText(text);
    if (type === 'number') {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    } else {
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Batalkan pesanan nomor ini? Saldo Anda akan dikembalikan 100% secara instan.')) {
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/order/${currentOrder.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerOrderId: currentOrder.providerOrderId }),
      });
      const data = await res.json();

      if (data.success) {
        const cancelled: NokosOrder = { ...currentOrder, status: 'CANCELLED' };
        setCurrentOrder(cancelled);
        onOrderCancelled?.(currentOrder.id, currentOrder.price);

        // Notify app balance update
        if (data.newBalance !== undefined) {
          window.dispatchEvent(
            new CustomEvent('balance_updated', { detail: { balance: data.newBalance } })
          );
        }
      } else {
        alert(data.message || 'Gagal membatalkan nomor');
      }
    } catch {
      alert('Terjadi kesalahan koneksi saat membatalkan');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        currentOrder.status === 'SMS_RECEIVED'
          ? 'bg-gradient-to-b from-emerald-950/40 to-surface-card border-emerald-500/50 shadow-xl shadow-emerald-500/10'
          : currentOrder.status === 'CANCELLED'
          ? 'bg-surface-card/60 border-zinc-800 opacity-70'
          : 'bg-surface-card border-surface-border'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-border/40">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-sm text-white">{currentOrder.serviceName}</span>
          <span className="text-xs text-zinc-400">({currentOrder.countryName})</span>
        </div>

        {/* Status Pill */}
        <div className="flex items-center space-x-2">
          {currentOrder.status === 'PENDING_SMS' && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Menunggu SMS...</span>
            </div>
          )}
          {currentOrder.status === 'SMS_RECEIVED' && (
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SMS Masuk!</span>
            </div>
          )}
          {currentOrder.status === 'CANCELLED' && (
            <div className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs">
              Dibatalkan (Refund)
            </div>
          )}
        </div>
      </div>

      {/* Phone Number Display */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/80 p-3.5 rounded-xl border border-surface-border">
        <div>
          <span className="text-[11px] text-zinc-400 block mb-0.5">Nomor Virtual Anda:</span>
          <div className="font-mono text-xl font-bold text-emerald-400 tracking-wider">
            +{currentOrder.phoneNumber}
          </div>
        </div>

        <button
          onClick={() => copyToClipboard(`+${currentOrder.phoneNumber}`, 'number')}
          className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-surface-card hover:bg-surface-hover border border-surface-border text-xs font-semibold text-white transition-colors"
        >
          {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedNumber ? 'Tersalin!' : 'Salin Nomor'}</span>
        </button>
      </div>

      {/* OTP Display Box (Appears when SMS received) */}
      {currentOrder.status === 'SMS_RECEIVED' && currentOrder.otpCode && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-center animate-fade-in">
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block mb-1">
            Kode Verifikasi OTP:
          </span>
          <div className="font-mono text-3xl font-extrabold text-white tracking-widest my-2 selection:bg-emerald-500 selection:text-black">
            {currentOrder.otpCode}
          </div>
          <p className="text-xs text-zinc-400 mb-3">{currentOrder.fullSms}</p>

          <button
            onClick={() => copyToClipboard(currentOrder.otpCode!, 'otp')}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            {copiedOtp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedOtp ? 'Kode OTP Tersalin!' : 'Salin Kode OTP'}</span>
          </button>
        </div>
      )}

      {/* Bottom Actions & Countdown */}
      <div className="mt-4 pt-3 border-t border-surface-border/40 flex items-center justify-between text-xs">
        {/* Countdown */}
        <div className="flex items-center space-x-1.5 text-zinc-400 font-mono">
          <Clock className="w-4 h-4 text-zinc-400" />
          <span>Sisa Waktu: <strong className="text-white">{timeLeft}</strong></span>
        </div>

        {/* Cancel button if still waiting */}
        {currentOrder.status === 'PENDING_SMS' && (
          <button
            onClick={handleCancelOrder}
            disabled={isCancelling}
            className="flex items-center space-x-1 text-red-400 hover:text-red-300 font-medium py-1 px-2.5 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {isCancelling ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            <span>Batalkan (Auto-Refund)</span>
          </button>
        )}

        {currentOrder.status === 'SMS_RECEIVED' && (
          <span className="text-emerald-400 font-medium text-[11px]">
            Verifikasi Selesai · {formatRupiah(currentOrder.price)}
          </span>
        )}
      </div>
    </div>
  );
}
