import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { EnquiryRow } from "@/lib/types/database";
import { EnquiriesListClient } from "./EnquiriesListClient";

export const metadata: Metadata = { title: "Enquiries | Masaar Admin", robots: { index: false } };

async function getClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return supabase;
  }

  if (process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_AUTH_BYPASS === "true") {
    return createAdminClient();
  }

  return supabase;
}

export default async function AdminEnquiriesPage() {
  let enquiries: EnquiryRow[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await getClient();
    const { data } = await supabase.from("enquiries").select("*").order("received_at", { ascending: false });
    enquiries = data ?? [];
  }

  return <EnquiriesListClient enquiries={enquiries} />;
}
