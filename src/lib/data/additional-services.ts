import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { AdditionalServiceRow } from "@/lib/types/database";
import {
  DEFAULT_ADDITIONAL_SERVICES,
  getPublishedCatalogServices,
  getThoughtfulCatalogServices,
  getEnquiryPopupCatalogServices,
} from "./additional-services-catalog";

export { DEFAULT_ADDITIONAL_SERVICES };
export const INITIAL_ADDITIONAL_SERVICES = DEFAULT_ADDITIONAL_SERVICES;

/**
 * Fetches services to display on the Homepage:
 * Only published and homepage-featured services, sorted by homepage_display_order or display_order.
 */
export async function getHomepageAdditionalServices(): Promise<AdditionalServiceRow[]> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("additional_services")
        .select("*")
        .eq("status", "published")
        .or("show_on_homepage.eq.true,is_featured.eq.true")
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return (data as AdditionalServiceRow[]).sort(
          (a, b) => (a.homepage_display_order ?? a.display_order) - (b.homepage_display_order ?? b.display_order)
        );
      }
    }
  } catch (err) {
    console.warn("Could not load from additional_services table, falling back to seed catalogue:", err);
  }

  // Graceful fallback to initial published & featured services
  return DEFAULT_ADDITIONAL_SERVICES.filter(
    (s) => s.status === "published" && (s.show_on_homepage || s.is_featured)
  ).sort((a, b) => (a.homepage_display_order ?? a.display_order) - (b.homepage_display_order ?? b.display_order));
}

/**
 * Fetches all published services for the /additional-services listing page.
 */
export async function getAllPublishedAdditionalServices(): Promise<AdditionalServiceRow[]> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("additional_services")
        .select("*")
        .eq("status", "published")
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return data as AdditionalServiceRow[];
      }
    }
  } catch (err) {
    console.warn("Could not load all additional services, falling back:", err);
  }

  return getPublishedCatalogServices();
}

/**
 * Fetches published services configured for the site-wide "Thoughtful Services" section.
 */
export async function getThoughtfulAdditionalServices(): Promise<AdditionalServiceRow[]> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("additional_services")
        .select("*")
        .eq("status", "published")
        .eq("show_in_thoughtful_services", true)
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return (data as AdditionalServiceRow[]).sort(
          (a, b) => (a.thoughtful_services_order ?? a.display_order) - (b.thoughtful_services_order ?? b.display_order)
        );
      }
    }
  } catch (err) {
    console.warn("Could not load thoughtful services, falling back:", err);
  }

  return getThoughtfulCatalogServices();
}

/**
 * Fetches published services enabled for the Umrah Enquiry Popup modal.
 */
export async function getEnquiryPopupAdditionalServices(): Promise<AdditionalServiceRow[]> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("additional_services")
        .select("*")
        .eq("status", "published")
        .eq("is_enquiry_enabled", true)
        .eq("show_in_enquiry_popup", true)
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        return (data as AdditionalServiceRow[]).sort(
          (a, b) => (a.enquiry_popup_order ?? a.display_order) - (b.enquiry_popup_order ?? b.display_order)
        );
      }
    }
  } catch (err) {
    console.warn("Could not load enquiry popup services, falling back:", err);
  }

  return getEnquiryPopupCatalogServices();
}

/**
 * Fetches a single service by slug.
 */
export async function getAdditionalServiceBySlug(slug: string): Promise<AdditionalServiceRow | null> {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("additional_services")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) {
        return data as AdditionalServiceRow;
      }
    }
  } catch (err) {
    console.warn("Could not load service by slug, falling back:", err);
  }

  return DEFAULT_ADDITIONAL_SERVICES.find((s) => s.slug === slug) ?? null;
}
