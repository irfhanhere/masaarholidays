"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { type RateMap } from "@/lib/currency";
import type { CurrencyCode } from "@/lib/types/database";

const STORAGE_KEY = "masaar-currency";

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  rates: RateMap;
  ratesLoaded: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

/**
 * Fetches `currency_rates` once (public RLS read, see 0001_init.sql) and
 * holds the visitor's chosen display currency — AED stays the source of
 * truth everywhere prices are stored/quoted; this only affects what's
 * rendered. Selection persists per-browser via localStorage (not synced
 * anywhere), same "per-viewer convenience" pattern as the rest of the
 * site's client-only state.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("AED");
  const [rates, setRates] = useState<RateMap>({});
  const [ratesLoaded, setRatesLoaded] = useState(false);

  useEffect(() => {
    // Deliberately post-mount, not a lazy useState initializer: reading
    // localStorage during the initial render would return the stored
    // currency on the client's first pass but "AED" on the server (no
    // window there), causing a hydration mismatch. Rendering AED first
    // and correcting after mount is the hydration-safe version of this.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setCurrencyState(stored as CurrencyCode);
    } catch {
      // localStorage unavailable — stay on the AED default.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("currency_rates").select("currency_code, rate_to_aed");
        if (error) throw error;
        if (cancelled) return;
        const map: RateMap = {};
        for (const row of data ?? []) map[row.currency_code] = row.rate_to_aed;
        setRates(map);
      } catch (err) {
        console.error("CurrencyProvider: failed to load currency_rates", err);
        // Leave rates empty — convertFromAed() returns null for every
        // non-AED currency, so callers fall back to AED automatically.
      } finally {
        if (!cancelled) setRatesLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function setCurrency(next: CurrencyCode) {
    setCurrencyState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  const value = useMemo(
    () => ({ currency, setCurrency, rates, ratesLoaded }),
    [currency, rates, ratesLoaded]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency() must be used within <CurrencyProvider>");
  }
  return ctx;
}
