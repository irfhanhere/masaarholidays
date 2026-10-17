import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const ALLOWED_CHARGE_CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "INR"] as const;
export type AllowedChargeCurrency = (typeof ALLOWED_CHARGE_CURRENCIES)[number];

export const FLOATING_CURRENCIES = ["EUR", "GBP", "INR"] as const;
export type FloatingCurrency = (typeof FLOATING_CURRENCIES)[number];

export const PEGGED_CURRENCIES = ["AED", "SAR", "USD"] as const;
export type PeggedCurrency = (typeof PEGGED_CURRENCIES)[number];

// Configurable constants
export function getPeggedRate(currency: PeggedCurrency): number {
  if (currency === "USD") return 1.0;
  if (currency === "AED") {
    const envVal = process.env.ESIM_FX_AED_RATE?.trim();
    const parsed = envVal ? parseFloat(envVal) : 3.6725;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3.6725;
  }
  if (currency === "SAR") {
    const envVal = process.env.ESIM_FX_SAR_RATE?.trim();
    const parsed = envVal ? parseFloat(envVal) : 3.75;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3.75;
  }
  return 1.0;
}

export function getEsimFxBufferPct(): number {
  const envVal = process.env.ESIM_FX_BUFFER_PCT?.trim();
  const parsed = envVal ? parseFloat(envVal) : 2.0;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 2.0;
}

export const MAX_FX_STALENESS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// In-memory fallback rates in case table is empty or cold start
const DEFAULT_FALLBACK_RATES: Record<AllowedChargeCurrency, { rate: number; source: string }> = {
  AED: { rate: 3.6725, source: "pegged" },
  SAR: { rate: 3.75, source: "pegged" },
  USD: { rate: 1.0, source: "pegged" },
  EUR: { rate: 0.889517, source: "open.er-api.com" },
  GBP: { rate: 0.750839, source: "open.er-api.com" },
  INR: { rate: 95.111965, source: "open.er-api.com" },
};

export interface EsimFxQuote {
  currency: AllowedChargeCurrency;
  rawRate: number;
  bufferPct: number;
  effectiveRate: number;
  source: string;
  fetchedAt: string;
  isStale: boolean;
  staleMessage?: string;
}

export interface EsimChargeCalculation {
  chargeCurrency: AllowedChargeCurrency;
  salePriceUsd: number;
  quantity: number;
  totalUsd: number;
  rawFxRate: number;
  fxRate: number;
  bufferPct: number;
  fxRateAt: string;
  unitAmountFormatted: string;
  totalAmountFormatted: string;
  expectedAmountMinor: number;
  source: string;
}

/**
 * Validates whether a requested currency is on the allowed charge list.
 * Falls back to 'AED' if invalid or empty.
 */
export function normalizeChargeCurrency(curr?: string | null): AllowedChargeCurrency {
  if (!curr) return "AED";
  const upper = curr.trim().toUpperCase();
  if (ALLOWED_CHARGE_CURRENCIES.includes(upper as AllowedChargeCurrency)) {
    return upper as AllowedChargeCurrency;
  }
  return "AED";
}

/**
 * Retrieves the FX quote for a specific charge currency.
 * Applies pegged rates for AED/SAR/USD, and reads floating rates from esim_fx_rates table for EUR/GBP/INR.
 * Applies ESIM_FX_BUFFER_PCT to EUR, GBP, and INR only.
 * Enforces the 3-day staleness guard on floating currencies.
 */
export async function getEsimFxQuote(currency: AllowedChargeCurrency): Promise<EsimFxQuote> {
  const nowIso = new Date().toISOString();

  // 1. Pegged currencies: AED, SAR, USD (no buffer applied)
  if (currency === "USD") {
    return {
      currency: "USD",
      rawRate: 1.0,
      bufferPct: 0,
      effectiveRate: 1.0,
      source: "pegged",
      fetchedAt: nowIso,
      isStale: false,
    };
  }

  if (currency === "AED") {
    const rate = getPeggedRate("AED");
    return {
      currency: "AED",
      rawRate: rate,
      bufferPct: 0,
      effectiveRate: rate,
      source: "pegged",
      fetchedAt: nowIso,
      isStale: false,
    };
  }

  if (currency === "SAR") {
    const rate = getPeggedRate("SAR");
    return {
      currency: "SAR",
      rawRate: rate,
      bufferPct: 0,
      effectiveRate: rate,
      source: "pegged",
      fetchedAt: nowIso,
      isStale: false,
    };
  }

  // 2. Floating currencies: EUR, GBP, INR
  const bufferPct = getEsimFxBufferPct();
  const supabase = createAdminClient();

  let rawRate: number | null = null;
  let source = "initial";
  let fetchedAt = nowIso;
  let isStale = false;

  try {
    const { data: row, error } = await supabase
      .from("esim_fx_rates")
      .select("usd_rate, source, fetched_at")
      .eq("currency", currency)
      .maybeSingle();

    if (!error && row && row.usd_rate) {
      const parsedRate = Number(row.usd_rate);
      if (Number.isFinite(parsedRate) && parsedRate > 0) {
        rawRate = parsedRate;
        source = row.source || "db";
        fetchedAt = row.fetched_at || nowIso;

        // Check staleness guard: older than 3 days
        const ageMs = Date.now() - new Date(fetchedAt).getTime();
        if (ageMs > MAX_FX_STALENESS_MS) {
          isStale = true;
        }
      }
    }
  } catch (err) {
    console.warn(`[esim-fx] Failed reading esim_fx_rates for ${currency}:`, err);
  }

  // Fallback if not found in DB
  if (rawRate == null) {
    const fallback = DEFAULT_FALLBACK_RATES[currency];
    rawRate = fallback.rate;
    source = `${fallback.source}-fallback`;
    fetchedAt = nowIso;
    isStale = false;
  }

  // Apply buffer to floating currency only: rate * (1 + bufferPct / 100)
  const effectiveRate = Number((rawRate * (1 + bufferPct / 100)).toFixed(6));

  const staleMessage = isStale
    ? `Exchange rate for ${currency} is currently outdated or unavailable. Please choose AED or USD to complete your order.`
    : undefined;

  return {
    currency,
    rawRate,
    bufferPct,
    effectiveRate,
    source,
    fetchedAt,
    isStale,
    staleMessage,
  };
}

/**
 * Calculates the exact charge amount, rounded to 2 decimals, in minor units.
 * Throws an error if a floating currency rate is stale (>3 days).
 */
export async function calculateEsimCharge(
  salePriceUsd: number,
  quantity: number,
  currency: AllowedChargeCurrency
): Promise<EsimChargeCalculation> {
  const quote = await getEsimFxQuote(currency);

  if (quote.isStale) {
    throw new Error(
      quote.staleMessage ||
        `Exchange rate for ${currency} is currently unavailable. Please select AED or USD instead.`
    );
  }

  const totalUsd = salePriceUsd * quantity;
  // Calculate unit amount rounded to 2 decimals
  const unitAmount = Math.round(salePriceUsd * quote.effectiveRate * 100) / 100;
  // Total amount = unitAmount * quantity (or totalUsd * effectiveRate rounded)
  const totalAmount = Math.round(totalUsd * quote.effectiveRate * 100) / 100;
  const expectedAmountMinor = Math.round(totalAmount * 100);

  return {
    chargeCurrency: currency,
    salePriceUsd,
    quantity,
    totalUsd,
    rawFxRate: quote.rawRate,
    fxRate: quote.effectiveRate,
    bufferPct: quote.bufferPct,
    fxRateAt: quote.fetchedAt,
    unitAmountFormatted: unitAmount.toFixed(2),
    totalAmountFormatted: totalAmount.toFixed(2),
    expectedAmountMinor,
    source: quote.source,
  };
}

/**
 * Refreshes floating exchange rates from open.er-api.com (fallback: api.exchangerate-api.com).
 * Stores latest rates into the esim_fx_rates table.
 * Preserves the last good rate if the remote API fails.
 */
export async function refreshEsimFxRates(): Promise<{
  ok: boolean;
  source: string;
  fetchedAt: string;
  rates: Record<string, number>;
  error?: string;
}> {
  const nowIso = new Date().toISOString();
  let fetchedRates: Record<string, number> | null = null;
  let sourceName = "open.er-api.com";

  // 1. Primary: open.er-api.com (free, high reliability, no API key required)
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { "User-Agent": "MasaarHolidays-FX/1.0" },
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result === "success" && data.rates) {
        fetchedRates = {
          EUR: Number(data.rates.EUR),
          GBP: Number(data.rates.GBP),
          INR: Number(data.rates.INR),
        };
      }
    }
  } catch (primaryErr) {
    console.warn("[esim-fx] Primary rates API (open.er-api.com) failed, trying secondary fallback:", primaryErr);
  }

  // 2. Secondary fallback: api.exchangerate-api.com/v4/latest/USD
  if (!fetchedRates || !fetchedRates.EUR || !fetchedRates.GBP || !fetchedRates.INR) {
    try {
      sourceName = "api.exchangerate-api.com";
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
        headers: { "User-Agent": "MasaarHolidays-FX/1.0" },
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          fetchedRates = {
            EUR: Number(data.rates.EUR),
            GBP: Number(data.rates.GBP),
            INR: Number(data.rates.INR),
          };
        }
      }
    } catch (secondaryErr) {
      console.error("[esim-fx] Secondary rates API also failed:", secondaryErr);
    }
  }

  const supabase = createAdminClient();

  // If remote fetch failed completely, preserve existing good rates in DB
  if (!fetchedRates || !fetchedRates.EUR || !fetchedRates.GBP || !fetchedRates.INR) {
    console.warn("[esim-fx] Both upstream FX APIs failed. Retaining last good rates from DB.");
    return {
      ok: false,
      source: "retained-last-good",
      fetchedAt: nowIso,
      rates: {},
      error: "Upstream FX APIs unavailable; retained last good rates in database.",
    };
  }

  // Compile full set including pegged currencies
  const aedRate = getPeggedRate("AED");
  const sarRate = getPeggedRate("SAR");

  const fullRates: Array<{
    currency: AllowedChargeCurrency;
    usd_rate: number;
    source: string;
    fetched_at: string;
    updated_at: string;
  }> = [
    { currency: "AED", usd_rate: aedRate, source: "pegged", fetched_at: nowIso, updated_at: nowIso },
    { currency: "SAR", usd_rate: sarRate, source: "pegged", fetched_at: nowIso, updated_at: nowIso },
    { currency: "USD", usd_rate: 1.0, source: "pegged", fetched_at: nowIso, updated_at: nowIso },
    { currency: "EUR", usd_rate: fetchedRates.EUR, source: sourceName, fetched_at: nowIso, updated_at: nowIso },
    { currency: "GBP", usd_rate: fetchedRates.GBP, source: sourceName, fetched_at: nowIso, updated_at: nowIso },
    { currency: "INR", usd_rate: fetchedRates.INR, source: sourceName, fetched_at: nowIso, updated_at: nowIso },
  ];

  try {
    const { error: upsertErr } = await supabase
      .from("esim_fx_rates")
      .upsert(fullRates, { onConflict: "currency" });

    if (upsertErr) {
      console.error("[esim-fx] Database upsert into esim_fx_rates failed:", upsertErr);
      return {
        ok: false,
        source: sourceName,
        fetchedAt: nowIso,
        rates: fetchedRates,
        error: upsertErr.message,
      };
    }
  } catch (dbErr) {
    console.error("[esim-fx] Database error during FX upsert:", dbErr);
  }

  return {
    ok: true,
    source: sourceName,
    fetchedAt: nowIso,
    rates: {
      AED: aedRate,
      SAR: sarRate,
      USD: 1.0,
      EUR: fetchedRates.EUR,
      GBP: fetchedRates.GBP,
      INR: fetchedRates.INR,
    },
  };
}

/**
 * Returns a map of all allowed eSIM charge currencies with their current effective FX rates.
 */
export async function getAllEsimFxQuotes(): Promise<
  Record<AllowedChargeCurrency, { effectiveRate: number; rawRate: number; isStale: boolean }>
> {
  const map: Partial<
    Record<AllowedChargeCurrency, { effectiveRate: number; rawRate: number; isStale: boolean }>
  > = {};

  for (const curr of ALLOWED_CHARGE_CURRENCIES) {
    try {
      const q = await getEsimFxQuote(curr);
      map[curr] = {
        effectiveRate: q.effectiveRate,
        rawRate: q.rawRate,
        isStale: q.isStale,
      };
    } catch {
      map[curr] = {
        effectiveRate: DEFAULT_FALLBACK_RATES[curr].rate,
        rawRate: DEFAULT_FALLBACK_RATES[curr].rate,
        isStale: false,
      };
    }
  }

  return map as Record<
    AllowedChargeCurrency,
    { effectiveRate: number; rawRate: number; isStale: boolean }
  >;
}

