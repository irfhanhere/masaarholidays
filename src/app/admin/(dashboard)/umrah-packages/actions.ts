"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit-logger";
import type { PremiumPackage } from "@/lib/types/premium-package";
import { DEFAULT_PREMIUM_PACKAGE } from "@/lib/data/premium-package-catalog";
import { DEFAULT_BEST_SELLING_PACKAGE } from "@/lib/data/best-selling-package-catalog";

/**
 * Fetch all Umrah packages stored in `premium_umrah_packages`.
 * Falls back to default catalog packages if database connection is unavailable.
 */
export async function getUmrahPackagesAction(): Promise<{
  success: boolean;
  packages: PremiumPackage[];
  error?: string;
}> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await (supabase as any)
        .from("premium_umrah_packages")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          success: true,
          packages: data.map((d: any) => ({
            id: d.id,
            slug: d.slug,
            title: d.title,
            short_description: d.short_description || "",
            full_description: d.full_description || "",
            duration_days: d.duration_days ?? 6,
            duration_nights: d.duration_nights ?? 5,
            status: d.status || "published",
            is_featured: Boolean(d.is_featured),
            show_on_homepage: Boolean(d.show_on_homepage),
            show_on_umrah_page: Boolean(d.show_on_umrah_page),
            display_order: d.display_order ?? 1,
            featured_image: d.featured_image || "/brand/banners/umrah.webp",
            seo_title: d.seo_title || d.title,
            meta_description: d.meta_description || d.short_description,
            canonical_url: d.canonical_url || "",
            hotels: Array.isArray(d.hotels) ? d.hotels : [],
            inclusions: Array.isArray(d.inclusions) ? d.inclusions : [],
            addons: Array.isArray(d.addons) ? d.addons : [],
            transport: Array.isArray(d.transport) ? d.transport : [],
            pricing: Array.isArray(d.pricing) ? d.pricing : [],
            itinerary: Array.isArray(d.itinerary) ? d.itinerary : [],
            package_badge: d.package_badge || (d.slug === "masaar-best-selling-umrah" ? "BEST SELLING" : "PREMIUM"),
            departure_country: d.departure_country || "UAE",
            currency: d.currency || "AED",
            category: d.category || "Umrah",
            social_image: d.social_image || d.featured_image || "/brand/banners/umrah.webp",
            og_title: d.og_title || d.seo_title || d.title,
            og_description: d.og_description || d.meta_description || d.short_description || "",
            noindex: d.noindex !== undefined ? Boolean(d.noindex) : false,
            nofollow: d.nofollow !== undefined ? Boolean(d.nofollow) : false,
            schema_enabled: d.schema_enabled !== undefined ? Boolean(d.schema_enabled) : true,
            breadcrumb_title: d.breadcrumb_title || d.title,
            created_at: d.created_at,
            updated_at: d.updated_at,
          })),
        };
      }
    }
  } catch (err: any) {
    console.warn("Could not query premium_umrah_packages table, using catalog fallback:", err?.message);
  }

  return {
    success: true,
    packages: [DEFAULT_PREMIUM_PACKAGE, DEFAULT_BEST_SELLING_PACKAGE],
  };
}

/**
 * Fetch a single package by its ID or slug.
 */
export async function getUmrahPackageByIdAction(idOrSlug: string): Promise<{
  success: boolean;
  package?: PremiumPackage;
  error?: string;
}> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

      const query = (supabase as any).from("premium_umrah_packages").select("*");
      const { data, error } = isUuid
        ? await query.eq("id", idOrSlug).maybeSingle()
        : await query.eq("slug", idOrSlug).maybeSingle();

      if (!error && data) {
        return {
          success: true,
          package: {
            id: data.id,
            slug: data.slug,
            title: data.title,
            short_description: data.short_description || "",
            full_description: data.full_description || "",
            duration_days: data.duration_days ?? 6,
            duration_nights: data.duration_nights ?? 5,
            status: data.status || "published",
            is_featured: Boolean(data.is_featured),
            show_on_homepage: Boolean(data.show_on_homepage),
            show_on_umrah_page: Boolean(data.show_on_umrah_page),
            display_order: data.display_order ?? 1,
            featured_image: data.featured_image || "/brand/banners/umrah.webp",
            seo_title: data.seo_title || data.title,
            meta_description: data.meta_description || data.short_description,
            canonical_url: data.canonical_url || "",
            hotels: Array.isArray(data.hotels) ? data.hotels : [],
            inclusions: Array.isArray(data.inclusions) ? data.inclusions : [],
            addons: Array.isArray(data.addons) ? data.addons : [],
            transport: Array.isArray(data.transport) ? data.transport : [],
            pricing: Array.isArray(data.pricing) ? data.pricing : [],
            itinerary: Array.isArray(data.itinerary) ? data.itinerary : [],
            package_badge: data.package_badge || (data.slug === "masaar-best-selling-umrah" ? "BEST SELLING" : "PREMIUM"),
            departure_country: data.departure_country || "UAE",
            currency: data.currency || "AED",
            category: data.category || "Umrah",
            social_image: data.social_image || data.featured_image || "/brand/banners/umrah.webp",
            og_title: data.og_title || data.seo_title || data.title,
            og_description: data.og_description || data.meta_description || data.short_description || "",
            noindex: data.noindex !== undefined ? Boolean(data.noindex) : false,
            nofollow: data.nofollow !== undefined ? Boolean(data.nofollow) : false,
            schema_enabled: data.schema_enabled !== undefined ? Boolean(data.schema_enabled) : true,
            breadcrumb_title: data.breadcrumb_title || data.title,
            created_at: data.created_at,
            updated_at: data.updated_at,
          },
        };
      }
    }
  } catch (err: any) {
    console.warn("Could not query package by id, checking defaults:", err?.message);
  }

  if (idOrSlug === "masaar-best-selling-umrah" || idOrSlug === "1aa5d09c-0779-4c09-a677-51bfa3f5dd32") {
    return { success: true, package: DEFAULT_BEST_SELLING_PACKAGE };
  }
  if (idOrSlug === "masaar-premium-umrah" || idOrSlug === "385ba8e5-0a65-4a1d-a274-44f3d76fbe9a") {
    return { success: true, package: DEFAULT_PREMIUM_PACKAGE };
  }

  return { success: false, error: "Package not found" };
}

/**
 * Save / Update an Umrah Package with complete admin validation and audit logging.
 */
export async function saveUmrahPackageAction(
  pkgData: Partial<PremiumPackage>
): Promise<{ success: boolean; message: string; data?: PremiumPackage }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Security Gate: Verify authenticated administrator
    if (!user) {
      return { success: false, message: "Unauthorized: You must be signed in as an administrator to save packages." };
    }

    // Required Field Validations
    if (!pkgData.title?.trim()) {
      return { success: false, message: "Package title is required." };
    }

    const slug = (pkgData.slug || pkgData.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      return { success: false, message: "A valid URL slug is required." };
    }

    const durationDays = Number(pkgData.duration_days) || 6;
    const durationNights = Number(pkgData.duration_nights) || 5;
    const now = new Date().toISOString();

    const recordToSave: any = {
      title: pkgData.title.trim(),
      slug,
      short_description: pkgData.short_description?.trim() || "",
      full_description: pkgData.full_description?.trim() || "",
      duration_days: durationDays,
      duration_nights: durationNights,
      status: pkgData.status || "published",
      is_featured: Boolean(pkgData.is_featured),
      show_on_homepage: Boolean(pkgData.show_on_homepage),
      show_on_umrah_page: Boolean(pkgData.show_on_umrah_page),
      display_order: Number(pkgData.display_order) || 1,
      featured_image: pkgData.featured_image || "/brand/banners/umrah.webp",
      social_image: pkgData.social_image || pkgData.featured_image || "/brand/banners/umrah.webp",
      seo_title: pkgData.seo_title?.trim() || `${pkgData.title} | Masaar Holidays`,
      meta_description: pkgData.meta_description?.trim() || pkgData.short_description?.trim() || "",
      canonical_url: pkgData.canonical_url?.trim() || `https://www.masaarholidays.com/umrah/${slug}`,
      hotels: Array.isArray(pkgData.hotels) ? pkgData.hotels : [],
      inclusions: Array.isArray(pkgData.inclusions) ? pkgData.inclusions : [],
      addons: Array.isArray(pkgData.addons) ? pkgData.addons : [],
      transport: Array.isArray(pkgData.transport) ? pkgData.transport : [],
      pricing: Array.isArray(pkgData.pricing) ? pkgData.pricing : [],
      itinerary: Array.isArray(pkgData.itinerary) ? pkgData.itinerary : [],
      package_badge: pkgData.package_badge || (slug === "masaar-best-selling-umrah" ? "BEST SELLING" : "PREMIUM"),
      departure_country: pkgData.departure_country || "UAE",
      currency: pkgData.currency || "AED",
      category: pkgData.category || "Umrah",
      updated_at: now,
    };

    if (pkgData.id) {
      recordToSave.id = pkgData.id;
    }

    if (isSupabaseConfigured()) {
      // First attempt full upsert with native SEO columns if supported
      const fullRecord = {
        ...recordToSave,
        og_title: pkgData.og_title?.trim() || pkgData.seo_title?.trim() || pkgData.title.trim(),
        og_description: pkgData.og_description?.trim() || pkgData.meta_description?.trim() || pkgData.short_description?.trim() || "",
        noindex: Boolean(pkgData.noindex),
        nofollow: Boolean(pkgData.nofollow),
        schema_enabled: pkgData.schema_enabled !== false,
        breadcrumb_title: pkgData.breadcrumb_title?.trim() || pkgData.title.trim(),
      };

      let { data, error } = await (supabase as any)
        .from("premium_umrah_packages")
        .upsert(fullRecord, { onConflict: "slug" })
        .select()
        .single();

      // If database reports missing column before migration 0105 runs, retry with standard record
      if (error && error.message?.includes("column")) {
        console.warn("Retrying package upsert with standard record columns:", error.message);
        const retry = await (supabase as any)
          .from("premium_umrah_packages")
          .upsert(recordToSave, { onConflict: "slug" })
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error("Supabase upsert package error:", error);
        return { success: false, message: `Database error: ${error.message}` };
      }

      // Record administrative audit log
      await logAdminAction({
        adminEmail: user.email || "admin@masaarholidays.com",
        adminUserId: user.id,
        action: pkgData.id ? "UPDATE_UMRAH_PACKAGE" : "CREATE_UMRAH_PACKAGE",
        resourceType: "premium_umrah_packages",
        resourceId: data.id,
        details: {
          slug: data.slug,
          title: data.title,
          status: data.status,
          pricing_count: data.pricing?.length || 0,
          show_on_homepage: data.show_on_homepage,
        },
      });

      // Invalidate relevant caches
      try {
        revalidatePath("/");
        revalidatePath("/umrah");
        revalidatePath(`/umrah/${slug}`);
        revalidatePath("/sitemap.xml");
        revalidatePath("/robots.txt");
        revalidatePath("/admin/umrah-packages");
        revalidatePath("/admin/homepage");
      } catch {
        // Ignored outside Next.js request lifecycle
      }

      return {
        success: true,
        message: `Package "${data.title}" saved successfully.`,
        data: {
          ...data,
          package_badge: pkgData.package_badge || (data.slug === "masaar-best-selling-umrah" ? "BEST SELLING" : "PREMIUM"),
        },
      };
    }

    return {
      success: true,
      message: "Package saved (local mode).",
      data: {
        ...(recordToSave as PremiumPackage),
        id: pkgData.id || `mock-${Date.now()}`,
      },
    };
  } catch (err: any) {
    console.error("saveUmrahPackageAction exception:", err);
    return { success: false, message: err?.message || "Failed to save package" };
  }
}

/**
 * Duplicate an existing Umrah Package with a copy slug as Draft.
 */
export async function duplicateUmrahPackageAction(
  sourceId: string
): Promise<{ success: boolean; message: string; newPackageId?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    const { success, package: source } = await getUmrahPackageByIdAction(sourceId);
    if (!success || !source) {
      return { success: false, message: "Source package could not be found to duplicate." };
    }

    const newSlug = `${source.slug}-copy-${Date.now().toString().slice(-4)}`;
    const clonedData = {
      ...source,
      id: undefined,
      title: `${source.title} (Copy)`,
      slug: newSlug,
      status: "draft" as const,
      is_featured: false,
      show_on_homepage: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const res = await saveUmrahPackageAction(clonedData);
    if (res.success && res.data) {
      await logAdminAction({
        adminEmail: user.email || "admin@masaarholidays.com",
        adminUserId: user.id,
        action: "DUPLICATE_UMRAH_PACKAGE",
        resourceType: "premium_umrah_packages",
        resourceId: res.data.id,
        details: { source_slug: source.slug, new_slug: newSlug },
      });

      return {
        success: true,
        message: `Package duplicated as "${clonedData.title}" (Draft).`,
        newPackageId: res.data.id,
      };
    }

    return { success: false, message: res.message || "Failed to duplicate package." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to duplicate package" };
  }
}

/**
 * Toggle publication status between published and draft.
 */
export async function togglePublishPackageAction(
  packageId: string,
  newStatus: "published" | "draft" | "archived"
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    const { data, error } = await (supabase as any)
      .from("premium_umrah_packages")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", packageId)
      .select("title, slug, status")
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    await logAdminAction({
      adminEmail: user.email || "admin@masaarholidays.com",
      adminUserId: user.id,
      action: `SET_STATUS_${newStatus.toUpperCase()}`,
      resourceType: "premium_umrah_packages",
      resourceId: packageId,
      details: { slug: data.slug, newStatus },
    });

    try {
      revalidatePath("/");
      revalidatePath("/umrah");
      revalidatePath(`/umrah/${data.slug}`);
      revalidatePath("/sitemap.xml");
      revalidatePath("/admin/umrah-packages");
    } catch {}

    return {
      success: true,
      message: `Package "${data.title}" status changed to ${newStatus}.`,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to update package status" };
  }
}

/**
 * Safely archive a package without deleting to preserve referential integrity.
 */
export async function archivePackageAction(packageId: string): Promise<{ success: boolean; message: string }> {
  return togglePublishPackageAction(packageId, "archived");
}
