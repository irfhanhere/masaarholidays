"use client";

import { CURRENCIES } from "@/lib/currency";
import type { CurrencyCode } from "@/lib/types/database";
import { useCurrency } from "./CurrencyProvider";

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <label className="inline-flex items-center">
      <span className="sr-only">Currency</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        className="h-10 rounded-md border border-black/15 bg-white px-3 text-sm font-medium text-masaar-black"
      >
        {CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </label>
  );
}
