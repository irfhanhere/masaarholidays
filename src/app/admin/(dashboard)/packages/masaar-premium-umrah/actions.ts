"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { PremiumPackage } from "@/lib/types/premium-package";
import { DEFAULT_PREMIUM_PACKAGE } from "@/lib/data/premium-package-catalog";

export async function saveMasaarPremiumPackageAction(
  payload: Partial<PremiumPackage>
): Promise<{ success: boolean; message: string; data?: PremiumPackage }> {
  try {
    const updatedData: PremiumPackage = {
      ...DEFAULT_PREMIUM_PACKAGE,
      ...payload,
      slug: "masaar-premium-umrah",
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supabase = await createClient();

      const { data, error } = await (supabase as any)
        .from("premium_umrah_packages")
        .upsert(
          {
            slug: "masaar-premium-umrah",
            title: updatedData.title,
            short_description: updatedData.short_description,
            full_description: updatedData.full_description,
            duration_days: updatedData.duration_days,
            duration_nights: updatedData.duration_nights,
            status: updatedData.status,
            is_featured: updatedData.is_featured,
            show_on_homepage: updatedData.show_on_homepage,
            show_on_umrah_page: updatedData.show_on_umrah_page,
            display_order: updatedData.display_order,
            featured_image: updatedData.featured_image,
            seo_title: updatedData.seo_title,
            meta_description: updatedData.meta_description,
            canonical_url: updatedData.canonical_url,
            hotels: updatedData.hotels,
            inclusions: updatedData.inclusions,
            addons: updatedData.addons,
            transport: updatedData.transport,
            pricing: updatedData.pricing,
            itinerary: updatedData.itinerary,
            updated_at: updatedData.updated_at,
          },
          { onConflict: "slug" }
        )
        .select()
        .single();

      if (error) {
        console.error("Error saving premium umrah package to Supabase:", error);
        return { success: false, message: error.message };
      }
    }

    // Revalidate public and admin pages
    try {
      revalidatePath("/");
      revalidatePath("/umrah");
      revalidatePath("/umrah/masaar-premium-umrah");
      revalidatePath("/admin/packages");
      revalidatePath("/admin/packages/masaar-premium-umrah");
    } catch {
      // Ignored outside Next.js request lifecycle (e.g. testing)
    }

    return {
      success: true,
      message: "Masaar Premium Umrah Package successfully updated and published across the website.",
      data: updatedData,
    };
  } catch (err: any) {
    console.error("Action failed:", err);
    return { success: false, message: err?.message || "Failed to update package" };
  }
}
