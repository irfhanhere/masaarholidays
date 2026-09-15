import type { CurrencyCode } from "@/lib/types/database";

export const CURRENCIES: CurrencyCode[] = ["AED", "INR", "USD", "EUR", "GBP", "SAR"];

/**
 * How each currency is prefixed for display. AED/SAR use their code
 * (no single common glyph in this design system); the others use their
 * standard symbol, matching how prices are already written everywhere
 * else on the site (e.g. "AED 2,950").
 */
export const CURRENCY_PREFIX: Record<CurrencyCode, string> = {
  AED: "AED",
  SAR: "SAR",
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/** currency_code -> rate_to_aed (units of that currency per 1 AED). */
export type RateMap = Partial<Record<CurrencyCode, number>>;

/**
 * Converts a stored AED amount into the selected currency using
 * currency_rates.rate_to_aed (documented in the admin Currency & Pricing
 * screen as "Rate (to 1 AED)" — i.e. rate_to_aed units of that currency
 * equal 1 AED). Returns null when there's no rate to convert with (rates
 * still loading, fetch failed, or that currency has no row yet) so
 * callers can fall back to AED rather than showing $0 or crashing.
 */
export function convertFromAed(
  amountAed: number,
  currency: CurrencyCode,
  rates: RateMap
): number | null {
  if (currency === "AED") return amountAed;
  const rate = rates[currency];
  if (rate == null || !Number.isFinite(rate)) return null;
  return amountAed * rate;
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const rounded = Math.round(amount).toLocaleString();
  return `${CURRENCY_PREFIX[currency]} ${rounded}`;
}
