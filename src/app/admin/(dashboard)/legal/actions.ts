"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LegalPageKey } from "@/lib/types/database";

async function getClient() {
  try {
    return createAdminClient();
  } catch {
    // Admin client unavailable — fall back to session-based client
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return supabase;
  } catch {
    // ignore
  }

  return createClient();
}

const PATH_BY_KEY: Record<LegalPageKey, string> = {
  privacy_policy: "/privacy-policy",
  terms_conditions: "/terms-conditions",
  cookie_policy: "/cookie-preferences",
  accessibility: "/accessibility",
};

export async function updateLegalPage(key: LegalPageKey, title: string, content: string) {
  try {
    const supabase = await getClient();
    const { error } = await supabase
      .from("legal_pages")
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (error) console.error("[updateLegalPage] Error:", error.message);

    revalidatePath("/admin/legal");
    revalidatePath(PATH_BY_KEY[key]);
  } catch (err) {
    console.error("[updateLegalPage] Unexpected error:", err);
  }
}
