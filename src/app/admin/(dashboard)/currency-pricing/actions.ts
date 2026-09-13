"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CurrencyCode } from "@/lib/types/database";

const EDITABLE: CurrencyCode[] = ["INR", "USD", "EUR", "GBP", "SAR"];

export async function updateExchangeRates(formData: FormData) {
  const supabase = await createClient();

  await Promise.all(
    EDITABLE.map((code) => {
      const value = formData.get(`rate_${code}`);
      if (value == null || value === "") return Promise.resolve();
      const rate = Number(value);
      if (Number.isNaN(rate) || rate <= 0) return Promise.resolve();
      return supabase.from("currency_rates").update({ rate_to_aed: rate }).eq("currency_code", code);
    })
  );

  revalidatePath("/admin/currency-pricing");
}
