"use server";

import { createClient } from "@/lib/supabase/server";

export interface SubmitEnquiryState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function submitEnquiry(
  _prevState: SubmitEnquiryState,
  formData: FormData
): Promise<SubmitEnquiryState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const enquiryType = String(formData.get("enquiry_type") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !phone || !enquiryType) {
    return { status: "error", message: "Please fill in your name, phone and enquiry type." };
  }

  // The form always sends "{country code}{national number}" (e.g. "+971501234567") —
  // built from a country-code dropdown + digits-only field, so a bare/missing "+"
  // here means the request bypassed the UI rather than a genuine local number.
  if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
    return {
      status: "error",
      message: "Please enter a valid phone number with country code (e.g. +971 5X XXX XXXX).",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("enquiries").insert({
    name,
    phone,
    email: email || null,
    enquiry_type: enquiryType,
    message: message || null,
    page_source: "Contact Page",
  });

  if (error) {
    console.error("submitEnquiry", error.message);
    return {
      status: "error",
      message: "Something went wrong sending your enquiry — please try WhatsApp instead.",
    };
  }

  return { status: "success", message: "Thank you — our team will get back to you shortly." };
}
