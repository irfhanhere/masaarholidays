"use client";

import { useState } from "react";
import type { CurrencyCode } from "@/lib/types/database";

const CURRENCIES: CurrencyCode[] = ["AED", "INR", "USD", "EUR", "GBP", "SAR"];

/**
 * UI only for now — selecting a currency doesn't yet convert displayed
 * prices. Wiring this up means reading `currency_rates` (client-side, RLS
 * allows public SELECT) and converting each AED price shown on the page;
 * left for the pass where real package/hotel pricing is entered.
 */
export function CurrencySwitcher() {
  const [value, setValue] = useState<CurrencyCode>("AED");

  return (
    <label className="inline-flex items-center">
      <span className="sr-only">Currency</span>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value as CurrencyCode)}
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
