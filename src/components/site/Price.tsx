"use client";

import { convertFromAed, formatCurrency } from "@/lib/currency";
import { useCurrency } from "./CurrencyProvider";

/**
 * Renders one price, converted from its stored AED value into the
 * visitor's selected currency. Falls back to AED — with a small note,
 * never $0 or a crash — when there's no rate to convert with yet
 * (currency_rates has no row for that currency, or the fetch hasn't
 * resolved/failed). AED itself never needs a rate, so it never falls back.
 */
export function Price({
  amountAed,
  className,
}: {
  amountAed: number;
  className?: string;
}) {
  const { currency, rates, ratesLoaded } = useCurrency();
  const converted = convertFromAed(amountAed, currency, rates);

  if (converted != null) {
    return <span className={className}>{formatCurrency(converted, currency)}</span>;
  }

  // No usable rate for the selected currency — show AED rather than
  // guessing, with a small note (unless we're still on the AED default,
  // which never needs a note, or rates genuinely just haven't loaded yet
  // on first paint).
  return (
    <span className={className}>
      {formatCurrency(amountAed, "AED")}
      {ratesLoaded && currency !== "AED" && (
        <span className="ml-1 text-[0.7em] font-normal italic text-masaar-black/40">
          (rate unavailable)
        </span>
      )}
    </span>
  );
}
