"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCustomer, saveTraveller } from "@/lib/data/customers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createCustomerAction(formData: FormData) {
  try {
    const fullName = formData.get("fullName") as string;
    const email = (formData.get("email") as string) || null;
    const phone = formData.get("phone") as string;
    const whatsapp = (formData.get("whatsapp") as string) || null;
    const country = (formData.get("country") as string) || "United Arab Emirates";
    const nationality = (formData.get("nationality") as string) || null;
    const address = (formData.get("address") as string) || null;
    const customerType = (formData.get("customerType") as any) || "individual";
    const customerSource = (formData.get("customerSource") as any) || "website";
    const internalNotes = (formData.get("internalNotes") as string) || null;

    if (!fullName || !phone) {
      return { success: false, error: "Full name and phone are required." };
    }

    const customer = await getOrCreateCustomer({
      fullName,
      email,
      phone,
      whatsapp,
      country,
      nationality,
      address,
      customerType,
      customerSource,
      internalNotes,
    });

    revalidatePath("/admin/customers");
    return { success: true, customerId: customer.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create customer" };
  }
}

export async function addTravellerAction(customerId: string, formData: FormData) {
  try {
    const fullName = formData.get("fullName") as string;
    const dateOfBirth = (formData.get("dateOfBirth") as string) || null;
    const nationality = (formData.get("nationality") as string) || null;
    const passportNumber = (formData.get("passportNumber") as string) || null;
    const passportExpiry = (formData.get("passportExpiry") as string) || null;
    const gender = (formData.get("gender") as any) || null;
    const notes = (formData.get("notes") as string) || null;

    if (!fullName) {
      return { success: false, error: "Traveller full name is required." };
    }

    const traveller = await saveTraveller({
      customerId,
      fullName,
      dateOfBirth,
      nationality,
      passportNumber,
      passportExpiry,
      gender,
      notes,
    });

    revalidatePath(`/admin/customers/${customerId}`);
    return { success: true, travellerId: traveller?.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add traveller" };
  }
}
