'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Wallet, PlusCircle, Smartphone, History, BookOpen, Settings } from 'lucide-react';
import { formatRupiah } from '@/lib/pricing';
import DepositModal from './DepositModal';

export default function Navbar() {
  const pathname = usePathname();
  const [balance, setBalance] = useState<number>(50000);
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  useEffect(() => {
    // Sync balance from localStorage or API
    const saved = localStorage.getItem('buynokos_balance');
    if (saved) {
      setBalance(Number(saved));
    }

    const handleBalanceUpdate = (e: any) => {
      if (e.detail?.balance !== undefined) {
        setBalance(e.detail.balance);
        localStorage.setItem('buynokos_balance', String(e.detail.balance));
      }
    };

    window.addEventListener('balance_updated', handleBalanceUpdate);
    return () => window.removeEventListener('balance_updated', handleBalanceUpdate);
  }, []);

  const navLinks = [
    { label: 'Beli Nokos', href: '/', icon: Smartphone },
    { label: 'Riwayat Order', href: '/orders', icon: History },
    { label: 'Cara Pakai', href: '/guide', icon: BookOpen },
    { label: 'Admin', href: '/admin', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">BuyNokos</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  24 JAM
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 -mt-0.5">SMS OTP Autopilot</span>
            </div>
          </Link>

          {/* Navigation Items (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Balance & Deposit Button */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-surface-card border border-surface-border px-3 py-1.5 rounded-xl">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-zinc-400 leading-none">Saldo</span>
                <span className="text-sm font-mono font-bold text-white leading-tight">
                  {formatRupiah(balance)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsDepositOpen(true)}
              className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-black px-3.5 py-2 rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Isi Saldo (QRIS)</span>
              <span className="sm:hidden">Topup</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex border-t border-surface-border/50 px-2 py-1 justify-around bg-surface/50">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`py-1.5 px-3 rounded-lg text-xs flex flex-col items-center gap-1 ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-zinc-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Deposit Modal */}
      {isDepositOpen && (
        <DepositModal
          isOpen={isDepositOpen}
          onClose={() => setIsDepositOpen(false)}
          onSuccess={(newBal) => {
            setBalance(newBal);
            localStorage.setItem('buynokos_balance', String(newBal));
          }}
        />
      )}
    </>
  );
}
