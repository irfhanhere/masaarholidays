"use server";

import { revalidatePath } from "next/cache";

export async function saveVisaLandingContent(payload: any) {
  // Revalidate landing page and admin
  revalidatePath("/visa");
  revalidatePath("/admin/visa-landing");
  return { success: true, message: "Visa landing page content saved successfully." };
}
