"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PublishStatus } from "@/lib/types/database";

export interface TestimonialFormState {
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

export async function saveTestimonial(
  testimonialId: string | null,
  _prevState: TestimonialFormState,
  formData: FormData
): Promise<TestimonialFormState> {
  const customerName = String(formData.get("customer_name") ?? "").trim();
  const testimonialText = String(formData.get("testimonial_text") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 5);
  const consentGiven = formData.get("consent_given") === "on";
  const status = String(formData.get("status") ?? "draft") as PublishStatus;

  if (!customerName || !testimonialText) {
    return { status: "error", message: "Customer name and testimonial text are required." };
  }
  if (status === "published" && !consentGiven) {
    return {
      status: "error",
      message: "Consent must be confirmed before a testimonial can be published.",
    };
  }

  const payload = {
    customer_name: customerName,
    location: String(formData.get("location") ?? "").trim() || null,
    rating,
    testimonial_text: testimonialText,
    service: String(formData.get("service") ?? "General"),
    status,
    is_featured: formData.get("is_featured") === "on",
    consent_given: consentGiven,
    consent_notes: String(formData.get("consent_notes") ?? "").trim() || null,
  };

  try {
    const supabase = await getClient();

    if (testimonialId) {
      const { error } = await supabase.from("testimonials").update(payload).eq("id", testimonialId);
      if (error) return { status: "error", message: error.message };
    } else {
      const { error } = await supabase.from("testimonials").insert(payload);
      if (error) return { status: "error", message: error.message };
    }

    revalidatePath("/admin/testimonials");
    redirect("/admin/testimonials");
  } catch (err: any) {
    if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    console.error("[saveTestimonial] Error:", err);
    return { status: "error", message: err?.message || "Failed to save testimonial" };
  }
}

export async function deleteTestimonial(id: string) {
  try {
    const supabase = await getClient();
    await supabase.from("testimonials").delete().eq("id", id);
    revalidatePath("/admin/testimonials");
  } catch (err) {
    console.error("[deleteTestimonial] Error:", err);
  }
}

export async function setTestimonialStatus(id: string, status: PublishStatus) {
  try {
    const supabase = await getClient();
    // DB constraint (testimonials_consent_required_to_publish) rejects
    // publishing without consent — swallow that specific failure rather
    // than crashing the list page; editing the row surfaces the reason.
    const { error } = await supabase.from("testimonials").update({ status }).eq("id", id);
    if (error) console.error("setTestimonialStatus", error.message);
    revalidatePath("/admin/testimonials");
  } catch (err) {
    console.error("[setTestimonialStatus] Error:", err);
  }
}
