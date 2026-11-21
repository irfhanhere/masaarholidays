import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface HomepageCmsSettings {
  // Tamara Highlight Section
  tamara_enabled: boolean;
  tamara_heading: string;
  tamara_subtitle: string;
  tamara_supporting_text: string;
  tamara_bg_style: "default" | "warm-ivory" | "white";
  tamara_logo_url: string;
  tamara_display_order: number;

  // Featured Package Section
  featured_package_enabled: boolean;
  featured_package_heading: string;
  featured_package_slug: string;

  // Best Selling Package Section
  best_selling_enabled: boolean;
  best_selling_heading: string;
  best_selling_description: string;
  best_selling_slug: string;

  // Explore More Umrah Packages Section
  explore_more_enabled: boolean;
  explore_more_heading: string;
  explore_more_description: string;
  explore_more_button_label: string;
  explore_more_button_url: string;

  // Section Ordering
  section_order: string[];
}

export const DEFAULT_HOMEPAGE_CMS_SETTINGS: HomepageCmsSettings = {
  // Tamara
  tamara_enabled: true,
  tamara_heading: "Flexible Payments with Tamara",
  tamara_subtitle:
    "Enjoy a convenient payment experience with Tamara. Choose Tamara at checkout when available.",
  tamara_supporting_text:
    "Select Tamara at checkout on supported travel services and complete your booking securely.",
  tamara_bg_style: "default",
  tamara_logo_url: "/brand/tamara-logo.svg",
  tamara_display_order: 2,

  // Featured Package
  featured_package_enabled: true,
  featured_package_heading: "Featured Umrah Packages",
  featured_package_slug: "masaar-premium-umrah",

  // Best Selling
  best_selling_enabled: true,
  best_selling_heading: "Masaar Best Selling Umrah Package",
  best_selling_description:
    "Our most sought-after Umrah journey featuring high-comfort hotels in Makkah and Madinah.",
  best_selling_slug: "masaar-best-selling-umrah",

  // Explore More
  explore_more_enabled: true,
  explore_more_heading: "Explore More Umrah Packages",
  explore_more_description:
    "Discover thoughtfully planned Umrah journeys designed around your comfort, accommodation preferences and travel needs.",
  explore_more_button_label: "Explore All Umrah Packages",
  explore_more_button_url: "/umrah",

  // Ordering
  section_order: [
    "hero",
    "tamara",
    "featured_umrah",
    "explore_more",
    "why_masaar",
    "additional_services",
    "private_trips",
    "testimonials",
    "cta",
  ],
};

const CMS_STORAGE_KEY = "cms_homepage_settings";

/**
 * Load authoritative homepage CMS settings from Supabase.
 */
export async function getHomepageCmsSettings(): Promise<HomepageCmsSettings> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();

      // Check primary singleton table first if present
      const { data: primaryData, error: primaryErr } = await (supabase as any)
        .from("homepage_cms")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (!primaryErr && primaryData) {
        return {
          ...DEFAULT_HOMEPAGE_CMS_SETTINGS,
          ...primaryData,
        };
      }

      // Fallback check in legal_pages singleton storage
      const { data: fallbackData } = await (supabase as any)
        .from("legal_pages")
        .select("content")
        .eq("key", CMS_STORAGE_KEY)
        .maybeSingle();

      if (fallbackData?.content) {
        try {
          const parsed = JSON.parse(fallbackData.content);
          return {
            ...DEFAULT_HOMEPAGE_CMS_SETTINGS,
            ...parsed,
          };
        } catch {}
      }
    }
  } catch (err: any) {
    console.warn("Could not read homepage CMS settings from database, using defaults:", err?.message);
  }

  return DEFAULT_HOMEPAGE_CMS_SETTINGS;
}
