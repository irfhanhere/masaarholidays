"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit-logger";
import {
  type HomepageCmsSettings,
  getHomepageCmsSettings,
} from "@/lib/data/homepage-cms";

const CMS_STORAGE_KEY = "cms_homepage_settings";

/**
 * Save homepage CMS settings from Admin.
 */
export async function saveHomepageCmsSettingsAction(
  settings: Partial<HomepageCmsSettings>
): Promise<{ success: boolean; message: string; data?: HomepageCmsSettings }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized: Administrator sign-in required." };
    }

    // Merge with current settings to prevent losing untouched fields
    const current = await getHomepageCmsSettings();
    const updated: HomepageCmsSettings = {
      ...current,
      ...settings,
    };

    // Validate internal destination URL
    if (updated.explore_more_button_url && !updated.explore_more_button_url.startsWith("/")) {
      return {
        success: false,
        message: "Button destination must be a valid internal path starting with / (e.g. /umrah).",
      };
    }

    if (isSupabaseConfigured()) {
      // Try writing to homepage_cms table
      await (supabase as any).from("homepage_cms").upsert(
        {
          id: 1,
          ...updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      // Always sync to legal_pages backup record to guarantee instant persistence
      await (supabase as any).from("legal_pages").upsert({
        key: CMS_STORAGE_KEY,
        title: "CMS Homepage Settings",
        content: JSON.stringify(updated),
        updated_at: new Date().toISOString(),
      });

      // Record administrative audit log
      await logAdminAction({
        adminEmail: user.email || "admin@masaarholidays.com",
        adminUserId: user.id,
        action: "UPDATE_HOMEPAGE_CMS",
        resourceType: "homepage_cms",
        resourceId: "1",
        details: {
          tamara_enabled: updated.tamara_enabled,
          featured_package_slug: updated.featured_package_slug,
          best_selling_slug: updated.best_selling_slug,
        },
      });

      // Revalidate public homepage and admin
      try {
        revalidatePath("/");
        revalidatePath("/admin/homepage");
      } catch {}

      return {
        success: true,
        message: "Homepage content settings successfully saved and published.",
        data: updated,
      };
    }

    return {
      success: true,
      message: "Homepage content saved (local preview mode).",
      data: updated,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to save homepage settings" };
  }
}
