"use server";

import { revalidatePath } from "next/cache";
import { saveSupplier } from "@/lib/data/suppliers";

export async function createSupplierAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const category = formData.get("category") as any;
    const contactPerson = (formData.get("contactPerson") as string) || null;
    const email = (formData.get("email") as string) || null;
    const phone = (formData.get("phone") as string) || null;
    const address = (formData.get("address") as string) || null;
    const currency = (formData.get("currency") as string) || "AED";
    const paymentTerms = (formData.get("paymentTerms") as string) || null;
    const supplierReference = (formData.get("supplierReference") as string) || null;
    const internalNotes = (formData.get("internalNotes") as string) || null;

    if (!name || !category) {
      return { success: false, error: "Supplier name and category are required." };
    }

    const supplier = await saveSupplier({
      name,
      category,
      contact_person: contactPerson,
      email,
      phone,
      address,
      currency,
      payment_terms: paymentTerms,
      supplier_reference: supplierReference,
      internal_notes: internalNotes,
      is_active: true,
    });

    revalidatePath("/admin/suppliers");
    return { success: true, supplierId: supplier.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save supplier." };
  }
}
