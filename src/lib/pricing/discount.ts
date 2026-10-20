/**
 * Centralized, trusted pricing discount calculation rules for Masaar Holidays.
 *
 * Requirements:
 * - Visa Services: 5% reduction on customer-facing prices (discounted = original * 0.95).
 * - Transport Services: 0% reduction (preserved at standard canonical rate card).
 * - eSIM Services: 0% reduction (preserved at standard canonical catalog).
 *
 * Guarantees:
 * - Calculations are pure, idempotent, and executed on the trusted server.
 * - Re-visiting checkout, retrying payment, or page reloads never compound discounts.
 * - Rounding is standard financial 2-decimal rounding.
 */

export const SERVICE_DISCOUNT_RATES = {
  visa: 0.05, // 5% reduction on customer-facing price
  transport: 0.0,
  esim: 0.0,
} as const;

export type ServiceTypeForDiscount = keyof typeof SERVICE_DISCOUNT_RATES;

export interface ServiceDiscountSummary {
  originalAmount: number;
  discountRate: number;
  discountPercent: number;
  discountAmount: number;
  discountedAmount: number;
  savingsAmount: number;
  formattedOriginal: string;
  formattedDiscounted: string;
  formattedSavings: string;
  currency: string;
  isDiscounted: boolean;
}

/**
 * Calculates discount for any service with strict 2-decimal rounding.
 */
export function calculateServiceDiscount(
  originalAmount: number,
  serviceType: ServiceTypeForDiscount,
  currency = "USD"
): ServiceDiscountSummary {
  const safeOriginal = Math.max(0, Number(originalAmount) || 0);
  const discountRate = SERVICE_DISCOUNT_RATES[serviceType] || 0;
  const discountPercent = Math.round(discountRate * 100);

  // Discount amount = original * rate, rounded to cents
  const discountAmount = Math.round(safeOriginal * discountRate * 100) / 100;
  const discountedAmount = Math.round((safeOriginal - discountAmount) * 100) / 100;

  return {
    originalAmount: safeOriginal,
    discountRate,
    discountPercent,
    discountAmount,
    discountedAmount,
    savingsAmount: discountAmount,
    formattedOriginal: safeOriginal.toFixed(2),
    formattedDiscounted: discountedAmount.toFixed(2),
    formattedSavings: discountAmount.toFixed(2),
    currency,
    isDiscounted: discountPercent > 0 && discountAmount > 0,
  };
}

/**
 * Convenience helper specifically for Visa products.
 */
export function getVisaDiscountedPrice(originalPriceUsd: number) {
  return calculateServiceDiscount(originalPriceUsd, "visa", "USD");
}
