import { PricingRule } from '@/types';

// Default pricing config: 35% margin, minimum price Rp 1.500
export const DEFAULT_PRICING_RULE: PricingRule = {
  markupPercent: 35,
  fixedMarkupIdr: 500,
  minPriceIdr: 1500,
};

/**
 * Calculates selling price from wholesale cost (in IDR) using markup rules.
 * Automatically rounds up to the nearest Rp 100 for clean Indonesian rupiah pricing.
 */
export function calculateSellingPrice(
  costIdr: number,
  rule: PricingRule = DEFAULT_PRICING_RULE
): { finalPrice: number; profit: number } {
  const percentAdded = (costIdr * rule.markupPercent) / 100;
  const rawPrice = costIdr + percentAdded + rule.fixedMarkupIdr;
  
  // Round up to nearest 100
  let finalPrice = Math.ceil(rawPrice / 100) * 100;
  if (finalPrice < rule.minPriceIdr) {
    finalPrice = rule.minPriceIdr;
  }

  const profit = Math.max(0, finalPrice - costIdr);
  return { finalPrice, profit };
}

/**
 * Converts RUB (SMS-Activate base currency) to IDR.
 * Approx 1 RUB = ~175 IDR.
 */
export function convertRubToIdr(rubCost: number, rate: number = 180): number {
  return Math.round(rubCost * rate);
}

/**
 * Formats a number to Indonesian Rupiah currency string (e.g. Rp 4.500)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
