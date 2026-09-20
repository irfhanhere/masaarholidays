"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LegalPageKey } from "@/lib/types/database";

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

const PATH_BY_KEY: Record<LegalPageKey, string> = {
  privacy_policy: "/privacy-policy",
  terms_conditions: "/terms-conditions",
  cookie_policy: "/cookie-preferences",
  accessibility: "/accessibility",
};

export async function updateLegalPage(key: LegalPageKey, title: string, content: string) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("legal_pages")
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/legal");
  revalidatePath(PATH_BY_KEY[key]);
}
