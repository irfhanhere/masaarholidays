import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { VisaTypeRow } from "@/lib/types/database";
import { VisaServicesManager } from "./VisaServicesManager";

export const metadata: Metadata = {
  title: "Visa Services | Masaar Admin",
  robots: { index: false },
};

async function getVisaTypes(): Promise<VisaTypeRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("visa_types")
    .select("*")
    .order("display_order", { ascending: true });

  const list = data ?? [];

  // Ensure US Visa appears in admin if not yet in database
  if (!list.some((v) => v.slug === "us")) {
    list.push({
      id: "us-visa-type",
      slug: "us",
      name: "US Visa",
      service_mode: "online",
      category: "United States",
      price_range: "USD 160 – 250",
      description: "B1/B2 visitor visa assistance with guided application and interview preparation.",
      audience_text: "Travellers seeking tourist, business, or visitor visas to the United States.",
      hero_headline: "Apply for Your US Visa Online",
      hero_intro: "Get expert assistance for your US visa with guided DS-160 application, document verification, and interview preparation support.",
      hero_image_url: "/trips/package-detail-hero-3.webp",
      features: [],
      benefits: [],
      documents_intro: null,
      important_info_text: null,
      who_needs_this: [],
      cta_note: null,
      meta_title: "US Visa | Masaar Holidays",
      display_order: 3,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return list;
}

export default async function AdminVisaTypesPage() {
  const visaTypes = await getVisaTypes();

  return <VisaServicesManager initialVisaTypes={visaTypes} />;
}
