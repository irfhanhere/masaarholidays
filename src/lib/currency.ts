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

/**
 * Converts a base USD amount into the visitor's chosen currency.
 * In Supabase currency_rates, rates are stored relative to 1 AED (e.g. rate_to_aed for USD is ~0.272).
 * Thus:
 * 1 USD = (1 / rates["USD"]) AED.
 * Target Currency Amount = (amountUsd / rates["USD"]) * rates[currency].
 */
export function convertFromUsd(
  amountUsd: number,
  currency: CurrencyCode,
  rates: RateMap
): number | null {
  if (currency === "USD") return amountUsd;
  const usdRate = rates["USD"];
  if (usdRate == null || !Number.isFinite(usdRate) || usdRate <= 0) {
    return null; // Fallback to USD
  }
  const amountAed = amountUsd / usdRate;
  if (currency === "AED") return amountAed;
  const targetRate = rates[currency];
  if (targetRate == null || !Number.isFinite(targetRate)) {
    return null;
  }
  return amountAed * targetRate;
}

/**
 * Formats an eSIM plan price for display according to the visitor's selected currency.
 */
export function formatEsimPrice(
  amountUsd: number,
  currency: CurrencyCode,
  rates: RateMap
): string {
  const converted = convertFromUsd(amountUsd, currency, rates);
  if (converted == null) {
    return `$${amountUsd.toFixed(2)}`;
  }
  const prefix = CURRENCY_PREFIX[currency] ?? currency;
  if (currency === "USD") {
    return `$${converted.toFixed(2)}`;
  }
  return `${prefix} ${converted.toFixed(2)}`;
}
