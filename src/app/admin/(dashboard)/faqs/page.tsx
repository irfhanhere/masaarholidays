import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { FALLBACK_FAQS } from "@/lib/data/fallback-faqs";
import type { FaqRow } from "@/lib/types/database";
import { FaqsClient } from "./FaqsClient";

export const metadata: Metadata = {
  title: "Manage FAQs | Masaar Admin",
  robots: { index: false },
};

export default async function AdminFaqsPage() {
  let faqs: FaqRow[] = FALLBACK_FAQS;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        faqs = data;
      }
    } catch (err) {
      console.warn("AdminFaqsPage error, using fallback seed:", err);
    }
  }

  return <FaqsClient initialFaqs={faqs} />;
}
