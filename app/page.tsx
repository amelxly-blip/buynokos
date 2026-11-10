'use client';

import React, { useState, useEffect } from 'react';
import { POPULAR_SERVICES, POPULAR_COUNTRIES } from '@/lib/sms-provider';
import { ServiceItem, CountryItem, NokosOrder } from '@/types';
import ServiceCard from '@/components/ServiceCard';
import CountrySelect from '@/components/CountrySelect';
import ActiveOrderCard from '@/components/ActiveOrderCard';
import { formatRupiah } from '@/lib/pricing';
import { ShoppingCart, ShieldCheck, Zap, RefreshCw, Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [services] = useState<ServiceItem[]>(POPULAR_SERVICES);
  const [selectedService, setSelectedService] = useState<ServiceItem>(POPULAR_SERVICES[0]);
  const [countries, setCountries] = useState<CountryItem[]>(POPULAR_COUNTRIES);
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(POPULAR_COUNTRIES[0]);
  const [activeOrders, setActiveOrders] = useState<NokosOrder[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);

  // Load existing orders from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('buynokos_active_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActiveOrders(parsed);
      } catch {}
    }
  }, []);

  // Save active orders on update
  const saveOrders = (orders: NokosOrder[]) => {
    setActiveOrders(orders);
    localStorage.setItem('buynokos_active_orders', JSON.stringify(orders));
  };

  // Fetch updated prices when service changes
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(`/api/services?service=${selectedService.code}`);
        const data = await res.json();
        if (data.success && data.countries?.length > 0) {
          setCountries(data.countries);
          // Keep current selected country or pick first
          const found = data.countries.find((c: CountryItem) => c.id === selectedCountry.id);
          if (found) setSelectedCountry(found);
          else setSelectedCountry(data.countries[0]);
        }
      } catch (err) {
        console.error('Failed to load prices:', err);
      }
    };
    fetchPrices();
  }, [selectedService]);

  // Order action
  const handleOrderNumber = async () => {
    setIsOrdering(true);
    try {
      const res = await fetch('/api/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceCode: selectedService.code,
          countryId: selectedCountry.id,
        }),
      });

      const data = await res.json();

      if (data.success && data.order) {
        const updated = [data.order, ...activeOrders];
        saveOrders(updated);

        // Update balance state
        if (data.remainingBalance !== undefined) {
          window.dispatchEvent(
            new CustomEvent('balance_updated', { detail: { balance: data.remainingBalance } })
          );
        }
      } else {
        alert(data.message || 'Gagal memesan nomor. Pastikan saldo Anda mencukupi.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi saat memesan nomor');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleOrderUpdated = (updatedOrder: NokosOrder) => {
    const updated = activeOrders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    saveOrders(updated);
  };

  const handleOrderCancelled = (orderId: string) => {
    const updated = activeOrders.map((o) =>
      o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o
    );
    saveOrders(updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/40 via-surface-card to-surface-card border border-surface-border p-6 sm:p-10 mb-10">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistem Otomatis 100% Autopilot & Tanpa Admin</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Beli Nomor Virtual OTP <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Instan Dalam Hitungan Detik
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Pilih aplikasi dan negara tujuan Anda, dapatkan nomor HP virtual secara langsung, dan terima kode SMS verifikasi secara live dengan jaminan <strong>100% refund saldo otomatis</strong> jika kode tidak sampai.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-zinc-300">
            <div className="flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Nomor Ditarik Live dari Server</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Auto-Refund 100% Jika Batal</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>QRIS 24 Jam Nonstop</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Orders Section (Show if user has active numbers) */}
      {activeOrders.filter((o) => o.status === 'PENDING_SMS' || o.status === 'SMS_RECEIVED').length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h2 className="text-lg font-bold text-white">Nomor Sedang Aktif (Menunggu SMS)</h2>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              {activeOrders.filter((o) => o.status === 'PENDING_SMS').length} menunggu kode
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders
              .filter((o) => o.status === 'PENDING_SMS' || o.status === 'SMS_RECEIVED')
              .map((order) => (
                <ActiveOrderCard
                  key={order.id}
                  order={order}
                  onOrderUpdated={handleOrderUpdated}
                  onOrderCancelled={handleOrderCancelled}
                />
              ))}
          </div>
        </section>
      )}

      {/* Step-by-Step Purchase Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 1. Service Selection */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="font-bold text-base text-white">Pilih Aplikasi / Layanan</h2>
            </div>
            <span className="text-xs text-zinc-400">Tersedia {services.length} Layanan</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedService.id === service.id}
                onSelect={(s) => setSelectedService(s)}
              />
            ))}
          </div>
        </div>

        {/* Right Column: 2. Country & Checkout Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="font-bold text-base text-white">Pilih Negara</h2>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              {selectedCountry.flag} {selectedCountry.name}
            </span>
          </div>

          {/* Country Picker */}
          <CountrySelect
            countries={countries}
            selectedCountry={selectedCountry}
            onSelectCountry={(c) => setSelectedCountry(c)}
          />

          {/* Checkout Action Card */}
          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <span className="text-xs text-zinc-400">Total Harga Sewa:</span>
              <span className="font-mono text-2xl font-black text-emerald-400">
                {formatRupiah(selectedCountry.finalPriceIdr)}
              </span>
            </div>

            <div className="text-xs text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Layanan:</span>
                <span className="font-medium text-white">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Negara:</span>
                <span className="font-medium text-white">
                  {selectedCountry.flag} {selectedCountry.name} ({selectedCountry.prefix})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Durasi Sewa:</span>
                <span className="font-medium text-white">20 Menit (Auto-Refund)</span>
              </div>
            </div>

            <button
              onClick={handleOrderNumber}
              disabled={isOrdering || selectedCountry.stock <= 0}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isOrdering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sedang Menghubungi Server Provider...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Beli Nomor {selectedService.name} Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-zinc-500 text-center">
              *Saldo otomatis dipotong dan langsung dikembalikan jika nomor Anda batalkan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
