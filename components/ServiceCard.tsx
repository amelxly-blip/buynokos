'use client';

import React from 'react';
import { ServiceItem } from '@/types';
import { formatRupiah } from '@/lib/pricing';

interface ServiceCardProps {
  service: ServiceItem;
  isSelected: boolean;
  onSelect: (service: ServiceItem) => void;
}

export default function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
  return (
    <button
      onClick={() => onSelect(service)}
      className={`relative p-3.5 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between ${
        isSelected
          ? 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
          : 'bg-surface-card hover:bg-surface-hover border-surface-border'
      }`}
    >
      {/* Badge if available */}
      {service.badge && (
        <span className="absolute top-2.5 right-2.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
          {service.badge}
        </span>
      )}

      <div className="flex items-center space-x-2.5 mb-2">
        <span className="text-2xl p-1 rounded-lg bg-surface/80 border border-surface-border">
          {service.icon}
        </span>
        <div>
          <h3 className="font-semibold text-sm text-white leading-snug">{service.name}</h3>
          <span className="text-[11px] text-zinc-400">{service.category}</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-surface-border/40 flex items-center justify-between text-xs">
        <span className="text-zinc-400">Mulai</span>
        <span className="font-mono font-bold text-emerald-400">
          {formatRupiah(service.minPrice)}
        </span>
      </div>
    </button>
  );
}
