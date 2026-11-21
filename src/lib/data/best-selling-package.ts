import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { PremiumPackage } from "@/lib/types/premium-package";
import { DEFAULT_BEST_SELLING_PACKAGE } from "./best-selling-package-catalog";

export { DEFAULT_BEST_SELLING_PACKAGE };

/**
 * Loads the active Masaar Best Selling Umrah Package from database if available,
 * falling back gracefully to the pre-populated default configuration.
 */
export async function getMasaarBestSellingPackage(): Promise<PremiumPackage> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await (supabase as any)
        .from("premium_umrah_packages")
        .select("*")
        .eq("slug", "masaar-best-selling-umrah")
        .single();

      if (!error && data) {
        return {
          id: data.id,
          slug: data.slug,
          title: data.title,
          short_description: data.short_description,
          full_description: data.full_description,
          duration_days: data.duration_days,
          duration_nights: data.duration_nights,
          status: data.status,
          is_featured: data.is_featured,
          show_on_homepage: data.show_on_homepage,
          show_on_umrah_page: data.show_on_umrah_page,
          display_order: data.display_order ?? 2,
          featured_image: data.featured_image || DEFAULT_BEST_SELLING_PACKAGE.featured_image,
          seo_title: data.seo_title || DEFAULT_BEST_SELLING_PACKAGE.seo_title,
          meta_description: data.meta_description || DEFAULT_BEST_SELLING_PACKAGE.meta_description,
          canonical_url: data.canonical_url || DEFAULT_BEST_SELLING_PACKAGE.canonical_url,
          social_image: data.social_image || DEFAULT_BEST_SELLING_PACKAGE.social_image,
          og_title: data.og_title || data.seo_title || DEFAULT_BEST_SELLING_PACKAGE.og_title,
          og_description: data.og_description || data.meta_description || DEFAULT_BEST_SELLING_PACKAGE.og_description,
          noindex: data.noindex !== undefined ? Boolean(data.noindex) : DEFAULT_BEST_SELLING_PACKAGE.noindex,
          nofollow: data.nofollow !== undefined ? Boolean(data.nofollow) : DEFAULT_BEST_SELLING_PACKAGE.nofollow,
          schema_enabled: data.schema_enabled !== undefined ? Boolean(data.schema_enabled) : DEFAULT_BEST_SELLING_PACKAGE.schema_enabled,
          breadcrumb_title: data.breadcrumb_title || DEFAULT_BEST_SELLING_PACKAGE.breadcrumb_title,
          hotels: Array.isArray(data.hotels) ? data.hotels : DEFAULT_BEST_SELLING_PACKAGE.hotels,
          inclusions: Array.isArray(data.inclusions) ? data.inclusions : DEFAULT_BEST_SELLING_PACKAGE.inclusions,
          addons: Array.isArray(data.addons) ? data.addons : DEFAULT_BEST_SELLING_PACKAGE.addons,
          transport: Array.isArray(data.transport) ? data.transport : DEFAULT_BEST_SELLING_PACKAGE.transport,
          pricing: Array.isArray(data.pricing) ? data.pricing : DEFAULT_BEST_SELLING_PACKAGE.pricing,
          itinerary: Array.isArray(data.itinerary) ? data.itinerary : DEFAULT_BEST_SELLING_PACKAGE.itinerary,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    }
  } catch (err) {
    console.warn("Could not load from premium_umrah_packages table, using default configuration:", err);
  }

  return DEFAULT_BEST_SELLING_PACKAGE;
}
