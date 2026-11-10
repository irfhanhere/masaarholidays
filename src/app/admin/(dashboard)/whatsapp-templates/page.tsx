import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { WhatsAppTemplateRow } from "@/lib/types/database";
import { INITIAL_WHATSAPP_TEMPLATES } from "@/lib/whatsapp-templates";
import { getAllPublishedAdditionalServices } from "@/lib/data/additional-services";
import { WhatsAppTemplateEditorClient } from "./WhatsAppTemplateEditorClient";

export const metadata: Metadata = { title: "WhatsApp Templates | Masaar Admin", robots: { index: false } };

export default async function WhatsAppTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const requestedKey = (await searchParams).key || "umrahGuideEnquiry";
  let templates: WhatsAppTemplateRow[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.from("whatsapp_templates").select("*").order("display_order");
      templates = data ?? [];
    } catch (err) {
      console.error("[WhatsAppTemplatesPage] Failed to fetch whatsapp_templates:", err);
    }
  }

  // Merge in any initial seed templates that may not yet exist in the DB
  const existingKeys = new Set(templates.map((t) => t.key));
  const mergedTemplates = [...templates];
  for (const initTmpl of INITIAL_WHATSAPP_TEMPLATES) {
    if (!existingKeys.has(initTmpl.key)) {
      mergedTemplates.push(initTmpl);
    }
  }
  mergedTemplates.sort((a, b) => a.display_order - b.display_order);

  // Fetch published additional services for service assignment dropdown
  let publishedServices: { id: string; name: string; slug: string; category: string }[] = [];
  try {
    const rawServices = await getAllPublishedAdditionalServices();
    publishedServices = rawServices.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      category: s.category,
    }));
  } catch (err) {
    console.error("[WhatsAppTemplatesPage] Failed to fetch published services:", err);
  }

  return (
    <WhatsAppTemplateEditorClient
      templates={mergedTemplates}
      activeKey={requestedKey}
      publishedServices={publishedServices}
    />
  );
}
