"use client";

import { convertFromAed, convertFromUsd, formatCurrency } from "@/lib/currency";
import type { CurrencyCode } from "@/lib/types/database";
import { useCurrency } from "./CurrencyProvider";

export interface PriceProps {
  amountAed?: number | null;
  amountUsd?: number | null;
  amount?: number | null;
  baseCurrency?: CurrencyCode;
  className?: string;
  decimals?: number;
}

/**
 * Renders one price, converted from its base currency value into the
 * visitor's selected currency. Falls back to base currency when there's
 * no rate available.
 */
export function Price({
  amountAed,
  amountUsd,
  amount,
  baseCurrency = "AED",
  className,
  decimals,
}: PriceProps) {
  const { currency, rates, ratesLoaded } = useCurrency();

  let effectiveBase: CurrencyCode = baseCurrency;
  let rawAmount: number = 0;

  if (amountAed != null) {
    effectiveBase = "AED";
    rawAmount = Number(amountAed);
  } else if (amountUsd != null) {
    effectiveBase = "USD";
    rawAmount = Number(amountUsd);
  } else if (amount != null) {
    rawAmount = Number(amount);
  }

  if (isNaN(rawAmount) || rawAmount === 0) {
    return <span className={className}>{formatCurrency(0, currency, decimals)}</span>;
  }

  let converted: number | null = null;
  if (effectiveBase === "AED") {
    converted = convertFromAed(rawAmount, currency, rates);
  } else if (effectiveBase === "USD") {
    converted = convertFromUsd(rawAmount, currency, rates);
  } else if (effectiveBase === currency) {
    converted = rawAmount;
  } else {
    const baseRate = rates[effectiveBase];
    if (baseRate && baseRate > 0) {
      const amountInAed = rawAmount / baseRate;
      converted = convertFromAed(amountInAed, currency, rates);
    }
  }

  if (converted != null) {
    return <span className={className}>{formatCurrency(converted, currency, decimals)}</span>;
  }

  return (
    <span className={className}>
      {formatCurrency(rawAmount, effectiveBase, decimals)}
      {ratesLoaded && currency !== effectiveBase && (
        <span className="ml-1 text-[0.7em] font-normal italic text-masaar-black/40">
          (rate unavailable)
        </span>
      )}
    </span>
  );
}
