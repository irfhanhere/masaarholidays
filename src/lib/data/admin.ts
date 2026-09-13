import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { EnquiryRow } from "@/lib/types/database";

export interface DashboardStats {
  activeUmrahPackages: number;
  activeHajjPackages: number;
  hotels: number;
  transferRoutes: number;
  newEnquiries: number;
  currencyLastUpdated: string | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const empty: DashboardStats = {
    activeUmrahPackages: 0,
    activeHajjPackages: 0,
    hotels: 0,
    transferRoutes: 0,
    newEnquiries: 0,
    currencyLastUpdated: null,
  };
  if (!isSupabaseConfigured()) return empty;

  const supabase = await createClient();
  const [umrah, hajj, hotels, transfers, enquiries, currency] = await Promise.all([
    supabase.from("packages").select("id", { count: "exact", head: true }).eq("type", "umrah").eq("is_active", true),
    supabase.from("packages").select("id", { count: "exact", head: true }).eq("type", "hajj").eq("is_active", true),
    supabase.from("hotels").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("transfers").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("currency_rates").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return {
    activeUmrahPackages: umrah.count ?? 0,
    activeHajjPackages: hajj.count ?? 0,
    hotels: hotels.count ?? 0,
    transferRoutes: transfers.count ?? 0,
    newEnquiries: enquiries.count ?? 0,
    currencyLastUpdated: currency.data?.updated_at ?? null,
  };
}

export async function getRecentEnquiries(limit = 5): Promise<EnquiryRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getRecentEnquiries", error.message);
    return [];
  }
  return data ?? [];
}
