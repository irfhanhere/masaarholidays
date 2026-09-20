"use server";

import { createClient } from "@/lib/supabase/server";

export interface SubmitHajjInterestState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function submitHajjInterest(
  _prevState: SubmitHajjInterestState,
  formData: FormData
): Promise<SubmitHajjInterestState> {
  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const tier = String(formData.get("tier") ?? "").trim();

  if (!name || !contact || !tier) {
    return { status: "error", message: "Please fill in your name, contact number and preferred package tier." };
  }

  // The form always sends "{country code}{national number}" (e.g. "+971501234567") —
  // built from a country-code dropdown + digits-only field, so a bare/missing "+"
  // here means the request bypassed the UI rather than a genuine local number.
  if (!/^\+[1-9]\d{6,14}$/.test(contact)) {
    return {
      status: "error",
      message: "Please enter a valid phone number with country code (e.g. +971 5X XXX XXXX).",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("enquiries").insert({
    name,
    phone: contact,
    email: email || null,
    enquiry_type: "Hajj",
    message: `2027 Hajj Packages — preferred tier: ${tier}`,
    page_source: "Hajj 2027 Register Interest",
  });

  if (error) {
    console.error("submitHajjInterest", error.message);
    return {
      status: "error",
      message: "Something went wrong sending your details — please try WhatsApp instead.",
    };
  }

  return { status: "success", message: "Thank you — our team will reach out with current Hajj availability." };
}
