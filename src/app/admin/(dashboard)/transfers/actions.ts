"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TransferRow } from "@/lib/types/database";

export interface TransferFormState {
  status: "idle" | "error";
  message?: string;
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

  // vehicle_type/vehicle_capacity/price_from_aed are no longer editable
  // here — per-vehicle pricing moved to the Rate Card
  // (transfer_route_rates, admin-only). Not touched on save, so existing
  // values just sit unused rather than being wiped.
  const payload = {
    route_name: routeName,
    transfer_type: String(formData.get("transfer_type") ?? "other") as TransferRow["transfer_type"],
    description: String(formData.get("description") ?? "").trim() || null,
    image_url: String(formData.get("image_url") ?? "").trim() || null,
    is_active: formData.get("is_active") === "on",
  };

  const supabase = await createClient();

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
}

export async function deleteTransfer(id: string) {
  const supabase = await createClient();
  await supabase.from("transfers").delete().eq("id", id);
  revalidatePath("/admin/transfers");
}

export async function toggleTransferActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("transfers").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/transfers");
}
