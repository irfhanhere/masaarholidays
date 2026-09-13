import type { Metadata } from "next";
import { Card, PageHeader, PrimaryButton, inputClass } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { CurrencyRateRow } from "@/lib/types/database";
import { updateExchangeRates } from "./actions";

export const metadata: Metadata = { title: "Currency & Pricing | Masaar Admin", robots: { index: false } };

const CURRENCY_NAMES: Record<string, string> = {
  AED: "UAE Dirham (Base)",
  INR: "Indian Rupee",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  SAR: "Saudi Riyal",
};

export default async function CurrencyPricingPage() {
  let rates: CurrencyRateRow[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("currency_rates").select("*").order("currency_code");
    rates = data ?? [];
  }

  const lastUpdated = rates
    .filter((r) => !r.is_base)
    .map((r) => new Date(r.updated_at).getTime())
    .sort((a, b) => b - a)[0];

  return (
    <div>
      <PageHeader
        title="Currency & Pricing"
        description="All website prices are stored in AED and converted using the rates below."
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Currency & Pricing" }]}
      />

      <div className="mb-6 rounded-md bg-blue-50 p-4 text-sm text-blue-800">
        AED (UAE Dirham) is the base currency. All package, hotel and transfer prices are entered
        in AED and automatically converted to INR, USD, EUR, GBP and SAR using the rates below.
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 font-semibold text-masaar-black">Exchange Rates</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-masaar-black/50">
            <tr>
              <th className="pb-2">Currency</th>
              <th className="pb-2">Code</th>
              <th className="pb-2">Rate (to 1 AED)</th>
              <th className="pb-2">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rates.map((rate) => (
              <tr key={rate.currency_code}>
                <td className="py-2">{CURRENCY_NAMES[rate.currency_code] ?? rate.currency_code}</td>
                <td className="py-2 text-masaar-black/70">{rate.currency_code}</td>
                <td className="py-2 font-medium text-masaar-black">{Number(rate.rate_to_aed).toFixed(4)}</td>
                <td className="py-2 text-masaar-black/60">
                  {rate.is_base ? "—" : new Date(rate.updated_at).toLocaleString("en-GB")}
                </td>
              </tr>
            ))}
            {rates.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-masaar-black/50">
                  Connect Supabase to manage exchange rates (seeded by supabase/migrations/0001_init.sql).
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {lastUpdated && (
          <p className="mt-3 text-xs text-masaar-black/50">
            Last updated: {new Date(lastUpdated).toLocaleString("en-GB")}
          </p>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-masaar-black">Update Exchange Rates</h2>
        <p className="mb-4 text-sm text-masaar-black/60">
          Manual override — the primary method is the scheduled daily Supabase Edge Function pull
          from a free-tier FX API (brief Part 7).
        </p>
        <form action={updateExchangeRates} className="grid gap-4 sm:grid-cols-5">
          {(["INR", "USD", "EUR", "GBP", "SAR"] as const).map((code) => (
            <label key={code} className="block text-sm">
              <span className="mb-1 block font-medium text-masaar-black">{code} Rate</span>
              <input
                name={`rate_${code}`}
                type="number"
                step="0.0001"
                defaultValue={rates.find((r) => r.currency_code === code)?.rate_to_aed ?? ""}
                className={inputClass}
              />
            </label>
          ))}
          <div className="sm:col-span-5">
            <PrimaryButton type="submit">Update Rates</PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
