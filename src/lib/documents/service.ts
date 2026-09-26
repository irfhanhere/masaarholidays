import "server-only";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  DocumentItemRow,
  DocumentRow,
  DocumentType,
} from "@/lib/types/database";

export async function getDocumentDbClient() {
  // Prefer admin client (service role) when available — this is always the
  // case on Vercel/live. The service_role key is hardcoded as fallback in
  // env.ts so this path is reliable on all environments.
  try {
    return createAdminClient();
  } catch {
    // Admin client unavailable — fall back to session-based client
  }

  return createClient();
}

export interface CreateManualQuotationInput {
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_country?: string;
  journey_type?: any;
  travel_date?: string;
  return_date?: string;
  adults?: number;
  children?: number;
  infants?: number;
  origin?: string;
  destination?: string;
  special_requirements?: string;
  notes?: string;
  terms?: string;
  source_document_id?: string;
  future_crm_enquiry_id?: string;
  template_id?: string;
  valid_until?: string;
  items?: Array<{
    item_type: any;
    description: string;
    details?: string | null;
    quantity: number;
    unit_price_aed: number;
    discount_aed?: number;
    display_order?: number;
  }>;
}

export async function createManualQuotationCore(input: CreateManualQuotationInput): Promise<{ success: boolean; id?: string; shareToken?: string; error?: string }> {
  try {
    const supabase = await getDocumentDbClient();

    if (!input.client_name?.trim()) {
      return { success: false, error: "Client name is required." };
    }

    const { data: numberResult, error: numberError } = await supabase.rpc("generate_document_number", {
      p_document_type: "quotation",
    });
    // Fallback: generate a timestamp-based number if the RPC is unavailable (e.g. cold-start / RLS on live)
    const docNumber: string = numberResult
      ? (numberResult as string)
      : `MH-QT-${Date.now().toString().slice(-6)}`;
    if (numberError && !numberResult) {
      console.warn("[createManualQuotationCore] RPC fallback used:", numberError?.message, "=>", docNumber);
    }

    const { data: template } = await supabase
      .from("document_templates")
      .select("id")
      .eq("document_type", "quotation")
      .eq("is_default", true)
      .maybeSingle();

    const validUntilDate = input.valid_until || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split("T")[0];
    })();

    const { data: inserted, error } = await supabase
      .from("documents")
      .insert({
        document_type: "quotation",
        document_number: docNumber,
        status: "draft",
        client_name: input.client_name.trim(),
        client_email: input.client_email?.trim() || null,
        client_phone: input.client_phone?.trim() || null,
        client_country: input.client_country?.trim() || null,
        journey_type: input.journey_type || "umrah",
        travel_date: input.travel_date || null,
        return_date: input.return_date || null,
        adults: input.adults ?? 2,
        children: input.children ?? 0,
        infants: input.infants ?? 0,
        origin: input.origin?.trim() || "Dubai (DXB)",
        destination: input.destination?.trim() || "Jeddah (JED)",
        special_requirements: input.special_requirements?.trim() || null,
        notes: input.notes?.trim() || null,
        terms: input.terms?.trim() || null,
        valid_until: validUntilDate,
        template_id: input.template_id || template?.id || null,
        future_crm_enquiry_id: input.future_crm_enquiry_id || null,
        source_document_id: input.source_document_id || null,
        subtotal_aed: 0,
        discount_aed: 0,
        tax_aed: 0,
        total_aed: 0,
        amount_paid_aed: 0,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return { success: false, error: error?.message ?? "Failed to create quotation." };
    }

    // Insert items if provided
    if (input.items && input.items.length > 0) {
      let subtotal = 0;
      let discount = 0;
      const itemsToInsert = input.items.map((item, idx) => {
        const itemAmount = (item.quantity * item.unit_price_aed) - (item.discount_aed ?? 0);
        subtotal += item.quantity * item.unit_price_aed;
        discount += item.discount_aed ?? 0;
        return {
          document_id: inserted.id,
          item_type: item.item_type || "custom",
          description: item.description,
          details: item.details || null,
          quantity: item.quantity,
          unit_price_aed: item.unit_price_aed,
          discount_aed: item.discount_aed ?? 0,
          tax_aed: 0,
          amount_aed: itemAmount,
          display_order: item.display_order ?? idx,
        };
      });

      await supabase.from("document_items").insert(itemsToInsert);

      const tax = Math.round((subtotal - discount) * 0.05 * 100) / 100;
      const total = Math.round((subtotal - discount + tax) * 100) / 100;
      await supabase
        .from("documents")
        .update({ subtotal_aed: subtotal, discount_aed: discount, tax_aed: tax, total_aed: total })
        .eq("id", inserted.id);
    }

    // Automatically create a permanent share token so public link works immediately
    const token = randomBytes(16).toString("hex");
    await supabase.from("document_shares").insert({
      document_id: inserted.id,
      share_token: token,
    });

    return { success: true, id: inserted.id, shareToken: token };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create quotation." };
  }
}

export interface CreateManualInvoiceInput {
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_country?: string;
  due_date?: string;
}

export async function createManualInvoiceCore(input: CreateManualInvoiceInput): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await getDocumentDbClient();

    if (!input.client_name?.trim()) {
      return { success: false, error: "Client name is required." };
    }

    const { data: numberResult, error: numberError } = await supabase.rpc("generate_document_number", {
      p_document_type: "invoice",
    });
    if (numberError || !numberResult) {
      return { success: false, error: numberError?.message ?? "Failed to generate invoice number." };
    }

    const { data: template } = await supabase
      .from("document_templates")
      .select("id")
      .eq("document_type", "invoice")
      .eq("is_default", true)
      .maybeSingle();

    const { data: inserted, error } = await supabase
      .from("documents")
      .insert({
        document_type: "invoice",
        document_number: numberResult as string,
        status: "draft",
        client_name: input.client_name.trim(),
        client_email: input.client_email?.trim() || null,
        client_phone: input.client_phone?.trim() || null,
        client_country: input.client_country?.trim() || null,
        due_date: input.due_date || null,
        template_id: template?.id ?? null,
        subtotal_aed: 0,
        discount_aed: 0,
        tax_aed: 0,
        total_aed: 0,
        amount_paid_aed: 0,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return { success: false, error: error?.message ?? "Failed to create invoice." };
    }

    return { success: true, id: inserted.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create invoice." };
  }
}

export interface CreateManualReceiptInput {
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_country?: string;
  amount: number;
  payment_method: "bank_transfer" | "cash" | "card" | "other";
  payment_date: string;
  transaction_reference?: string;
  booking_reference?: string;
  source_document_id?: string;
  notes?: string;
}

export async function createManualReceiptCore(input: CreateManualReceiptInput): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await getDocumentDbClient();

    if (!input.client_name?.trim()) return { success: false, error: "Client name is required." };
    if (!(input.amount > 0)) return { success: false, error: "Receipt amount must be greater than zero." };

    const { data: numberResult, error: numberError } = await supabase.rpc("generate_document_number", { p_document_type: "receipt" });
    if (numberError || !numberResult) return { success: false, error: numberError?.message ?? "Failed to generate receipt number." };

    const { data: template } = await supabase.from("document_templates").select("id").eq("document_type", "receipt").eq("is_default", true).maybeSingle();

    if (input.source_document_id) {
      const { data: invoice } = await supabase.from("documents").select("*").eq("id", input.source_document_id).single<DocumentRow>();
      if (invoice) {
        const newAmountPaid = Math.round((Number(invoice.amount_paid_aed ?? 0) + input.amount) * 100) / 100;
        const newStatus = newAmountPaid >= Number(invoice.total_aed ?? 0) ? "paid" : "partially_paid";
        await supabase.from("documents").update({ amount_paid_aed: newAmountPaid, status: newStatus }).eq("id", invoice.id);
      }
    }

    const { data: receipt, error: receiptError } = await supabase
      .from("documents")
      .insert({
        document_type: "receipt",
        document_number: numberResult as string,
        status: "issued",
        client_name: input.client_name.trim(),
        client_email: input.client_email?.trim() || null,
        client_phone: input.client_phone?.trim() || null,
        client_country: input.client_country?.trim() || null,
        source_document_id: input.source_document_id || null,
        booking_reference: input.booking_reference?.trim() || null,
        total_aed: input.amount,
        subtotal_aed: input.amount,
        discount_aed: 0,
        tax_aed: 0,
        amount_paid_aed: 0,
        payment_method: input.payment_method,
        transaction_reference: input.transaction_reference?.trim() || null,
        payment_date: input.payment_date,
        notes: input.notes?.trim() || null,
        template_id: template?.id ?? null,
      })
      .select("id")
      .single();

    if (receiptError || !receipt) return { success: false, error: receiptError?.message ?? "Failed to create receipt." };

    return { success: true, id: receipt.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create receipt." };
  }
}

export interface CreateManualBookingVoucherInput {
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_country?: string;
  travel_date?: string;
  return_date?: string;
  adults?: number;
  children?: number;
  infants?: number;
  origin?: string;
  destination?: string;
  booking_reference?: string;
  special_requirements?: string;
  notes?: string;
  source_document_id?: string;
  makkah_hotel?: string;
  makkah_nights?: number;
  makkah_room?: string;
  madinah_hotel?: string;
  madinah_nights?: number;
  madinah_room?: string;
  transfer_vehicle?: string;
  transfer_route?: string;
  flight_airline?: string;
  flight_class?: string;
  flight_route?: string;
  include_visa?: boolean;
  visa_type?: string;
  include_ziyarat?: boolean;
  include_vip?: boolean;
  include_assistance?: boolean;
  custom_addons?: string;
}

export async function createManualBookingVoucherCore(input: CreateManualBookingVoucherInput): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await getDocumentDbClient();

    if (!input.client_name?.trim()) return { success: false, error: "Client name is required." };

    const { data: numberResult, error: numberError } = await supabase.rpc("generate_document_number", {
      p_document_type: "booking_voucher",
    });
    if (numberError || !numberResult) return { success: false, error: numberError?.message ?? "Failed to generate booking voucher number." };

    const { data: template } = await supabase
      .from("document_templates")
      .select("id")
      .eq("document_type", "booking_voucher")
      .eq("is_default", true)
      .maybeSingle();

    const seq = (numberResult as string).split("-").pop() || "0001";
    const bookingRef = input.booking_reference?.trim() || `MH-BKG-${seq}`;

    const { data: inserted, error } = await supabase
      .from("documents")
      .insert({
        document_type: "booking_voucher",
        document_number: numberResult as string,
        status: "confirmed",
        client_name: input.client_name.trim(),
        client_email: input.client_email?.trim() || null,
        client_phone: input.client_phone?.trim() || null,
        client_country: input.client_country?.trim() || null,
        travel_date: input.travel_date || null,
        return_date: input.return_date || null,
        adults: input.adults ?? 2,
        children: input.children ?? 0,
        infants: input.infants ?? 0,
        origin: input.origin?.trim() || null,
        destination: input.destination?.trim() || "Makkah & Madinah",
        booking_reference: bookingRef,
        special_requirements: input.special_requirements?.trim() || null,
        notes: input.notes?.trim() || null,
        source_document_id: input.source_document_id || null,
        template_id: template?.id ?? null,
        subtotal_aed: 0,
        discount_aed: 0,
        tax_aed: 0,
        total_aed: 0,
        amount_paid_aed: 0,
      })
      .select("id")
      .single();

    if (error || !inserted) return { success: false, error: error?.message ?? "Failed to create booking voucher." };

    const itemsToInsert: Array<{
      document_id: string;
      item_type: "hotel" | "transfer" | "flight" | "service" | "private_trip" | "custom";
      description: string;
      details: string | null;
      quantity: number;
      unit_price_aed: number;
      discount_aed: number;
      tax_aed: number;
      amount_aed: number;
      display_order: number;
    }> = [];
    let order = 0;

    if (input.makkah_hotel?.trim()) {
      itemsToInsert.push({
        document_id: inserted.id,
        item_type: "hotel",
        description: input.makkah_hotel.trim(),
        details: `${input.makkah_nights ?? 5} Nights — ${input.makkah_room?.trim() || "Twin Sharing"}`,
        quantity: input.makkah_nights ?? 5,
        unit_price_aed: 0,
        discount_aed: 0,
        tax_aed: 0,
        amount_aed: 0,
        display_order: order++,
      });
    }

    if (input.madinah_hotel?.trim()) {
      itemsToInsert.push({
        document_id: inserted.id,
        item_type: "hotel",
        description: input.madinah_hotel.trim(),
        details: `${input.madinah_nights ?? 5} Nights — ${input.madinah_room?.trim() || "Twin Sharing"}`,
        quantity: input.madinah_nights ?? 5,
        unit_price_aed: 0,
        discount_aed: 0,
        tax_aed: 0,
        amount_aed: 0,
        display_order: order++,
      });
    }

    if (input.transfer_vehicle?.trim()) {
      itemsToInsert.push({
        document_id: inserted.id,
        item_type: "transfer",
        description: input.transfer_vehicle.trim(),
        details: input.transfer_route?.trim() || "Airport – Makkah – Madinah – Airport",
        quantity: 1,
        unit_price_aed: 0,
        discount_aed: 0,
        tax_aed: 0,
        amount_aed: 0,
        display_order: order++,
      });
    }

    if (input.flight_airline?.trim()) {
      itemsToInsert.push({
        document_id: inserted.id,
        item_type: "flight",
        description: input.flight_airline.trim(),
        details: `${input.flight_class?.trim() || "Economy"} (${input.flight_route?.trim() || "DXB – JED – MED – DXB"})`,
        quantity: 1,
        unit_price_aed: 0,
        discount_aed: 0,
        tax_aed: 0,
        amount_aed: 0,
        display_order: order++,
      });
    }

    if (input.include_visa) {
      itemsToInsert.push({
        document_id: inserted.id,
        item_type: "service",
        description: input.visa_type?.trim() || "Saudi Tourist / Umrah Visa Processing",
        details: "Electronic visa with medical insurance",
        quantity: input.adults ?? 2,
        unit_price_aed: 0,
        discount_aed: 0,
        tax_aed: 0,
        amount_aed: 0,
        display_order: order++,
      });
    }

    if (input.include_ziyarat) {
      itemsToInsert.push({
        document_id: inserted.id,
        item_type: "private_trip",
        description: "Historical Ziyarat in Makkah & Madinah",
        details: "Guided historical sites tour with private chauffeur",
        quantity: 1,
        unit_price_aed: 0,
        discount_aed: 0,
        tax_aed: 0,
        amount_aed: 0,
        display_order: order++,
      });
    }

    if (input.include_vip) {
      itemsToInsert.push({
        document_id: inserted.id,
        item_type: "service",
        description: "VIP Meet & Assist at Airport",
        details: "Dedicated airport terminal coordinator and fast-track assistance",
        quantity: 1,
        unit_price_aed: 0,
        discount_aed: 0,
        tax_aed: 0,
        amount_aed: 0,
        display_order: order++,
      });
    }

    if (input.include_assistance) {
      itemsToInsert.push({
        document_id: inserted.id,
        item_type: "service",
        description: "24/7 Dedicated On-Ground Travel Assistance",
        details: "Round-the-clock concierge and operational support throughout the journey",
        quantity: 1,
        unit_price_aed: 0,
        discount_aed: 0,
        tax_aed: 0,
        amount_aed: 0,
        display_order: order++,
      });
    }

    if (input.custom_addons?.trim()) {
      itemsToInsert.push({
        document_id: inserted.id,
        item_type: "custom",
        description: input.custom_addons.trim(),
        details: "Special confirmed add-on service",
        quantity: 1,
        unit_price_aed: 0,
        discount_aed: 0,
        tax_aed: 0,
        amount_aed: 0,
        display_order: order++,
      });
    }

    if (itemsToInsert.length > 0) {
      await supabase.from("document_items").insert(itemsToInsert);
    }

    return { success: true, id: inserted.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create booking voucher." };
  }
}

export async function createDocumentFromSourceCore(sourceId: string, toType: DocumentType): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await getDocumentDbClient();

    const [{ data: source }, { data: items }] = await Promise.all([
      supabase.from("documents").select("*").eq("id", sourceId).single<DocumentRow>(),
      supabase.from("document_items").select("*").eq("document_id", sourceId).order("display_order", { ascending: true }),
    ]);
    if (!source) return { success: false, error: "Source document not found." };

    const { data: numberResult, error: numberError } = await supabase.rpc("generate_document_number", { p_document_type: toType });
    if (numberError || !numberResult) return { success: false, error: numberError?.message ?? "Failed to generate document number." };

    const { data: template } = await supabase.from("document_templates").select("id").eq("document_type", toType).eq("is_default", true).maybeSingle();

    const { data: inserted, error } = await supabase
      .from("documents")
      .insert({
        document_type: toType,
        document_number: numberResult as string,
        status: "draft",
        client_name: source.client_name,
        client_email: source.client_email,
        client_phone: source.client_phone,
        client_country: source.client_country,
        journey_type: source.journey_type,
        travel_date: source.travel_date,
        return_date: source.return_date,
        adults: source.adults,
        children: source.children,
        infants: source.infants,
        origin: source.origin,
        destination: source.destination,
        special_requirements: source.special_requirements,
        source_document_id: source.id,
        subtotal_aed: source.subtotal_aed ?? 0,
        discount_aed: source.discount_aed ?? 0,
        tax_aed: source.tax_aed ?? 0,
        total_aed: source.total_aed ?? 0,
        amount_paid_aed: 0,
        notes: source.notes,
        terms: source.terms,
        template_id: template?.id ?? null,
        booking_reference: toType === "booking_voucher" ? `MH-BKG-${(numberResult as string).split("-").pop()}` : null,
      })
      .select("id")
      .single();
    if (error || !inserted) return { success: false, error: error?.message ?? "Failed to create document." };

    if (items && items.length > 0) {
      const copies = (items as DocumentItemRow[]).map(({ id: _itemId, document_id: _docId, created_at: _createdAt, ...rest }) => ({
        ...rest,
        document_id: inserted.id,
      }));
      await supabase.from("document_items").insert(copies);
    }

    return { success: true, id: inserted.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create document." };
  }
}

export async function deleteDocumentCore(documentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getDocumentDbClient();
    const { error } = await supabase.from("documents").delete().eq("id", documentId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete document." };
  }
}

export async function deleteDocumentsCore(documentIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    if (documentIds.length === 0) return { success: true };
    const supabase = await getDocumentDbClient();
    const { error } = await supabase.from("documents").delete().in("id", documentIds);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete documents." };
  }
}
