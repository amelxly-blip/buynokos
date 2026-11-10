'use client';

import React, { useState } from 'react';
import { CountryItem } from '@/types';
import { formatRupiah } from '@/lib/pricing';
import { Search, Globe } from 'lucide-react';

interface CountrySelectProps {
  countries: CountryItem[];
  selectedCountry: CountryItem;
  onSelectCountry: (country: CountryItem) => void;
}

export default function CountrySelect({
  countries,
  selectedCountry,
  onSelectCountry,
}: CountrySelectProps) {
  const [search, setSearch] = useState('');

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.prefix.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari negara (Indonesia, USA, Rusia, +62...)"
          className="w-full bg-surface-card border border-surface-border rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
      </div>

      {/* Country List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
        {filteredCountries.map((c) => {
          const isSelected = selectedCountry.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelectCountry(c)}
              className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
                  : 'bg-surface-card hover:bg-surface-hover border-surface-border text-zinc-300'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="text-xl flex-shrink-0">{c.flag}</span>
                <div className="truncate">
                  <div className="font-semibold text-xs text-white truncate">{c.name}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {c.prefix} · {c.stock.toLocaleString('id-ID')} stok
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-xs font-mono font-bold text-emerald-400">
                  {formatRupiah(c.finalPriceIdr)}
                </div>
              </div>
            </button>
          );
        })}

        {filteredCountries.length === 0 && (
          <div className="col-span-full py-8 text-center text-zinc-500 text-sm">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Tidak ada negara yang cocok dengan &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
