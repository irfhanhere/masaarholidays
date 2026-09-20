import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { LegalPageRow } from "@/lib/types/database";
import { LegalManager } from "./LegalManager";

export const metadata: Metadata = { title: "Legal & Cookies | Masaar Admin", robots: { index: false } };

async function getData(): Promise<LegalPageRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("legal_pages").select("*").order("key");
  if (error) {
    console.error("admin legal getData", error.message);
    return [];
  }
  return data ?? [];
}

export default async function AdminLegalPage() {
  const pages = await getData();
  return <LegalManager pages={pages} />;
}
