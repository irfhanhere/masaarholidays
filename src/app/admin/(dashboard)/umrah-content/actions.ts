"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { GuidedAssistanceFeature } from "@/lib/types/database";

export interface UmrahContentFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function saveUmrahContent(
  _prevState: UmrahContentFormState,
  formData: FormData
): Promise<UmrahContentFormState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Database is not configured (.env.local is missing).",
    };
  }

  const eyebrow = (formData.get("guided_assistance_eyebrow") as string)?.trim() || null;
  const heading = (formData.get("guided_assistance_heading") as string)?.trim() || null;
  const duration = (formData.get("guided_assistance_duration") as string)?.trim() || null;
  const description = (formData.get("guided_assistance_description") as string)?.trim() || null;
  const isActive = formData.get("is_active") === "true";

  // Build 3 features from form fields
  const features: GuidedAssistanceFeature[] = [];
  for (let i = 1; i <= 3; i++) {
    const title = (formData.get(`feature_${i}_title`) as string)?.trim();
    const desc = (formData.get(`feature_${i}_description`) as string)?.trim();
    if (title || desc) {
      features.push({
        title: title || "",
        description: desc || "",
      });
    }
  }

  // Parse badges from textarea (one per line)
  const badgesRaw = (formData.get("badges") as string) || "";
  const badges = badgesRaw
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("umrah_content").upsert(
      {
        id: 1,
        guided_assistance_eyebrow: eyebrow,
        guided_assistance_heading: heading,
        guided_assistance_duration: duration,
        guided_assistance_description: description,
        guided_assistance_features: features,
        guided_assistance_badges: badges,
        guided_assistance_whatsapp_template_key: "guidedUmrah",
        is_active: isActive,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("saveUmrahContent error:", error.message);
      return { status: "error", message: error.message };
    }

    revalidatePath("/umrah");
    revalidatePath("/admin/umrah-content");
    return { status: "success", message: "Umrah content saved successfully." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save Umrah content.";
    return { status: "error", message };
  }
}
