"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TransferRow } from "@/lib/types/database";

export interface TransferFormState {
  status: "idle" | "error";
  message?: string;
}

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

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function saveTransfer(
  transferId: string | null,
  _prevState: TransferFormState,
  formData: FormData
): Promise<TransferFormState> {
  const routeName = String(formData.get("route_name") ?? "").trim();
  if (!routeName) return { status: "error", message: "Route name is required." };

  const payload = {
    route_name: routeName,
    transfer_type: String(formData.get("transfer_type") ?? "other") as TransferRow["transfer_type"],
    description: String(formData.get("description") ?? "").trim() || null,
    image_url: String(formData.get("image_url") ?? "").trim() || null,
    is_active: formData.get("is_active") === "on",
  };

  try {
    const supabase = await getClient();

    if (transferId) {
      const { error } = await supabase.from("transfers").update(payload).eq("id", transferId);
      if (error) return { status: "error", message: error.message };
    } else {
      const slug = `${slugify(routeName)}-${Date.now().toString(36)}`;
      const { error } = await supabase.from("transfers").insert({ ...payload, slug });
      if (error) return { status: "error", message: error.message };
    }

    revalidatePath("/admin/transfers");
    redirect("/admin/transfers");
  } catch (err: any) {
    if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("[saveTransfer] Error:", err);
    return { status: "error", message: err?.message || "Failed to save transfer" };
  }
}

export async function deleteTransfer(id: string) {
  try {
    const supabase = await getClient();
    await supabase.from("transfers").delete().eq("id", id);
    revalidatePath("/admin/transfers");
  } catch (err) {
    console.error("[deleteTransfer] Error:", err);
  }
}

export async function toggleTransferActive(id: string, isActive: boolean) {
  try {
    const supabase = await getClient();
    await supabase.from("transfers").update({ is_active: isActive }).eq("id", id);
    revalidatePath("/admin/transfers");
  } catch (err) {
    console.error("[toggleTransferActive] Error:", err);
  }
}
