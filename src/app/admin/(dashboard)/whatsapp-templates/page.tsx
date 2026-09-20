import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { WhatsAppTemplateRow } from "@/lib/types/database";
import { WhatsAppTemplateEditorClient } from "./WhatsAppTemplateEditorClient";

export const metadata: Metadata = { title: "WhatsApp Templates | Masaar Admin", robots: { index: false } };

export default async function WhatsAppTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const requestedKey = (await searchParams).key || "packageEnquiry";
  let templates: WhatsAppTemplateRow[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("whatsapp_templates").select("*").order("display_order");
    templates = data ?? [];
  }

  return <WhatsAppTemplateEditorClient templates={templates} activeKey={requestedKey} />;
}
