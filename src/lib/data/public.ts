import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  HotelRow,
  PackageType,
  PackageRow,
  TestimonialRow,
  TransferRow,
  VisaDocumentContextKey,
  VisaTypeRow,
} from "@/lib/types/database";

/**
 * Server-side reads for the public site. Every function here degrades to
 * an empty result instead of throwing when Supabase isn't connected yet
 * (fresh checkout of this scaffold, no .env.local) — see
 * lib/supabase/env.ts#isSupabaseConfigured. Once real content exists,
 * these are what render it; there is no invented placeholder data behind
 * them.
 */

export async function getPublishedPackages(type: PackageType): Promise<PackageRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("type", type)
    .eq("show_on_website", true)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) {
    console.error("getPublishedPackages", error.message);
    return [];
  }
  return data ?? [];
}

export async function getActiveHotels(city?: "Makkah" | "Madinah"): Promise<HotelRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let query = supabase.from("hotels").select("*").eq("is_active", true);
  if (city) query = query.eq("city", city);
  const { data, error } = await query.order("display_order", { ascending: true });
  if (error) {
    console.error("getActiveHotels", error.message);
    return [];
  }
  return data ?? [];
}

export async function getActiveTransfers(): Promise<TransferRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transfers")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) {
    console.error("getActiveTransfers", error.message);
    return [];
  }
  return data ?? [];
}

export async function getPublishedTestimonials(limit?: number): Promise<TestimonialRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let query = supabase
    .from("testimonials")
    .select("*")
    .eq("status", "published")
    .order("display_order", { ascending: true });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) {
    console.error("getPublishedTestimonials", error.message);
    return [];
  }
  return data ?? [];
}

export async function getActiveVisaTypes(): Promise<VisaTypeRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visa_types")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) {
    console.error("getActiveVisaTypes", error.message);
    return [];
  }
  return data ?? [];
}

export async function getVisaDocumentContext(contextKey: VisaDocumentContextKey) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: context, error: contextError } = await supabase
    .from("visa_document_contexts")
    .select("*")
    .eq("context_key", contextKey)
    .maybeSingle();
  if (contextError || !context) {
    if (contextError) console.error("getVisaDocumentContext", contextError.message);
    return null;
  }
  const { data: documents, error: documentsError } = await supabase
    .from("visa_documents")
    .select("*")
    .eq("context_id", context.id)
    .order("display_order", { ascending: true });
  if (documentsError) {
    console.error("getVisaDocumentContext documents", documentsError.message);
  }
  return { context, documents: documents ?? [] };
}
