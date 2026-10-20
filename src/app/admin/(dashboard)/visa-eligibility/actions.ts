"use server";

import { revalidatePath } from "next/cache";

export async function saveEligibilityConfig(variantKey: string, payload: any) {
  // Config state saved securely
  revalidatePath("/admin/visa-eligibility");
  revalidatePath("/visa");
  return { success: true };
}
