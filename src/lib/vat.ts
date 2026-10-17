/**
 * VAT Configuration and Calculation Helper (UAE Tax Compliance)
 *
 * UAE standard VAT rate is 5%.
 * Consumer prices displayed on the store and checkout are VAT-inclusive when enabled.
 * Feature switch: ESIM_VAT_ENABLED ("true" | "false", defaults to false).
 */

export function isEsimVatEnabled(): boolean {
  const envVal = process.env.ESIM_VAT_ENABLED;
  if (!envVal) return false;
  return envVal.trim().toLowerCase() === "true";
}

export function getEsimVatPct(): number {
  const envVal = process.env.ESIM_VAT_PCT?.trim();
  if (!envVal) return 5;
  const parsed = parseFloat(envVal);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 5;
}

export function getVatTrn(): string | null {
  return process.env.VAT_TRN?.trim() || null;
}

/**
 * Calculates net amount and VAT component from a VAT-inclusive total in minor units.
 * Formula:
 * Net = Total / (1 + vatRate/100)
 * VAT = Total - Net
 */
export function calculateVatMinor(
  totalMinor: number,
  vatPct: number = getEsimVatPct()
): { netMinor: number; vatMinor: number; vatPct: number } {
  if (totalMinor <= 0 || vatPct <= 0) {
    return { netMinor: totalMinor, vatMinor: 0, vatPct: 0 };
  }
  const netMinor = Math.round(totalMinor / (1 + vatPct / 100));
  const vatMinor = totalMinor - netMinor;
  return { netMinor, vatMinor, vatPct };
}
