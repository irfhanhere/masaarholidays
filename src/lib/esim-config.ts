/**
 * eSIM Catalogue Configuration
 *
 * Configurable list of supported eSIM destinations synced into the database.
 */

export interface EsimDestination {
  iso: string;
  name: string;
  flag: string;
  featured: boolean;
  enabled: boolean;
}

export const ESIM_DESTINATIONS: EsimDestination[] = [
  { iso: "SA", name: "Saudi Arabia", flag: "🇸🇦", featured: true, enabled: true },
  { iso: "AE", name: "United Arab Emirates", flag: "🇦🇪", featured: true, enabled: true },
  { iso: "QA", name: "Qatar", flag: "🇶🇦", featured: false, enabled: true },
  { iso: "OM", name: "Oman", flag: "🇴🇲", featured: false, enabled: true },
  { iso: "BH", name: "Bahrain", flag: "🇧🇭", featured: false, enabled: true },
  { iso: "KW", name: "Kuwait", flag: "🇰🇼", featured: false, enabled: true },
  { iso: "TR", name: "Turkey", flag: "🇹🇷", featured: false, enabled: true },
  { iso: "EG", name: "Egypt", flag: "🇪🇬", featured: false, enabled: true },
  { iso: "JO", name: "Jordan", flag: "🇯🇴", featured: false, enabled: true },
];

export function getEnabledDestinations(): EsimDestination[] {
  return ESIM_DESTINATIONS.filter((d) => d.enabled);
}

export function getFeaturedDestinations(): EsimDestination[] {
  return ESIM_DESTINATIONS.filter((d) => d.enabled && d.featured);
}

export function getDestinationByIso(iso: string | null | undefined): EsimDestination | undefined {
  if (!iso) return undefined;
  return ESIM_DESTINATIONS.find((d) => d.iso.toUpperCase() === iso.toUpperCase() && d.enabled);
}

export interface EsimSyncConfig {
  countries: string[];
  regions: string[];
}

export const ESIM_CONFIG: EsimSyncConfig = {
  get countries() {
    return ESIM_DESTINATIONS.filter((d) => d.enabled).map((d) => d.iso);
  },
  regions: [],
};

/**
 * Returns the configured markup percentage (default 0).
 * Read from ESIM_MARKUP_PCT env variable.
 */
export function getEsimMarkupPct(): number {
  const envVal = process.env.ESIM_MARKUP_PCT?.trim();
  if (!envVal) return 0;
  const parsed = parseFloat(envVal);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Computes the customer sale price in USD from retail_price and markup percentage.
 * Formula: retail_price * (1 + ESIM_MARKUP_PCT/100), rounded to 2 decimal places.
 */
export function calculateSalePriceUsd(retailPrice: number, markupPct = getEsimMarkupPct()): number {
  const multiplied = retailPrice * (1 + markupPct / 100);
  return Math.round(multiplied * 100) / 100;
}
