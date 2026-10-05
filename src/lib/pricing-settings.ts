/**
 * Supplier currency conversion & markup settings.
 * Sourced from Saudi Riyal (SAR) supplier rate sheets (e.g. Asfar Al Safwah).
 * Peg: SAR 3.75 = 1 USD, AED 3.6725 = 1 USD -> 1 SAR = ~0.979 AED.
 */
export const SUPPLIER_PRICING_CONFIG = {
  SAR_TO_AED_RATE: 0.979,
  DEFAULT_MARKUP_PERCENT: 10,
} as const;

/**
 * Converts a supplier net SAR rate to the public AED sell price
 * applying the pegged SAR->AED exchange rate and company markup.
 */
export function convertSarToAedSellPrice(
  netSar: number | null | undefined,
  markupPercent: number = SUPPLIER_PRICING_CONFIG.DEFAULT_MARKUP_PERCENT,
  sarToAedRate: number = SUPPLIER_PRICING_CONFIG.SAR_TO_AED_RATE
): number | null {
  if (netSar == null || isNaN(netSar)) return null;
  const netAed = netSar * sarToAedRate;
  const sellAed = netAed * (1 + markupPercent / 100);
  return Math.round(sellAed);
}
