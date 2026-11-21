import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getNextDocumentNumber } from "@/lib/documents/numbering";
import { getDocument, getDocumentItems } from "@/lib/data/documents";
import { getOrCreateCustomer } from "@/lib/data/customers";
import type { DocumentRow } from "@/lib/types/database";

export interface BookingRow {
  id: string;
  booking_reference: string;
  customer_id: string | null;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  quotation_id: string | null;
  package_id: string | null;
  package_name: string;
  room_category: string | null;
  travel_date: string | null;
  return_date: string | null;
  adults: number;
  children: number;
  infants: number;
  total_travellers: number;
  departure_city: string;
  destination: string;
  booking_status:
    | "enquiry"
    | "quotation_sent"
    | "awaiting_confirmation"
    | "confirmed"
    | "in_progress"
    | "documents_pending"
    | "completed"
    | "cancelled";
  payment_status: "unpaid" | "partially_paid" | "paid" | "refunded" | "partially_refunded";
  fulfilment_status: "pending" | "in_progress" | "completed" | "cancelled";
  currency: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  assigned_staff: string | null;
  internal_notes: string | null;
  hotel_arrangements: any[];
  flight_arrangements: any[];
  transfer_arrangements: any[];
  visa_arrangements: any[];
  esim_arrangements: any[];
  package_snapshot: any;
  created_at: string;
  updated_at: string;
}

export interface BookingDetail {
  booking: BookingRow;
  customer: any | null;
  travellers: any[];
  quotation: DocumentRow | null;
  invoices: DocumentRow[];
  receipts: DocumentRow[];
  vouchers: DocumentRow[];
  supplierCosts: any[];
  activityLogs: any[];
}

async function getDb() {
  try {
    return createAdminClient();
  } catch {
    return createClient();
  }
}

/**
 * List all bookings with optional status filters and query.
 */
export async function listBookings(params?: {
  status?: string;
  paymentStatus?: string;
  query?: string;
  limit?: number;
}): Promise<BookingRow[]> {
  const supabase = await getDb();
  const limit = params?.limit ?? 100;

  try {
    let q = supabase
      .from("bookings")
      .select("*, customer:customers(full_name, phone, email)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (params?.status && params.status !== "all") {
      q = q.eq("booking_status", params.status);
    }
    if (params?.paymentStatus && params.paymentStatus !== "all") {
      q = q.eq("payment_status", params.paymentStatus);
    }
    if (params?.query && params.query.trim()) {
      const term = `%${params.query.trim()}%`;
      q = q.or(`booking_reference.ilike.${term},package_name.ilike.${term}`);
    }

    const { data, error } = await q;
    if (!error && data && data.length > 0) {
      return data.map((b: any) => ({
        ...b,
        customer_name: b.customer?.full_name,
        customer_phone: b.customer?.phone,
        customer_email: b.customer?.email,
      })) as BookingRow[];
    }
  } catch {}

  // Fallback: derive bookings from confirmed documents (booking vouchers)
  return deriveBookingsFromDocuments(supabase, params?.query);
}

async function deriveBookingsFromDocuments(supabase: any, query?: string): Promise<BookingRow[]> {
  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .in("document_type", ["booking_voucher", "quotation"])
    .order("created_at", { ascending: false });

  if (!docs || docs.length === 0) return [];

  const bookings: BookingRow[] = [];
  for (const d of docs) {
    if (d.document_type === "quotation" && d.status !== "accepted" && d.status !== "confirmed") continue;

    const bkgRef = d.booking_reference || `MAS-BKG-${d.document_number?.split("-").slice(-1)[0] || "0001"}`;
    const total = Number(d.total_aed) || 0;
    const paid = Number(d.amount_paid_aed) || 0;
    const balance = Math.max(0, total - paid);

    let payStatus: BookingRow["payment_status"] = "unpaid";
    if (paid >= total && total > 0) payStatus = "paid";
    else if (paid > 0) payStatus = "partially_paid";

    const row: BookingRow = {
      id: d.id,
      booking_reference: bkgRef,
      customer_id: d.future_crm_client_id || null,
      customer_name: d.client_name,
      customer_phone: d.client_phone,
      customer_email: d.client_email,
      quotation_id: d.document_type === "quotation" ? d.id : d.source_document_id || null,
      package_id: null,
      package_name: d.destination ? `Umrah Journey – ${d.destination}` : "Masaar Umrah Journey",
      room_category: "Standard Room",
      travel_date: d.travel_date || null,
      return_date: d.return_date || null,
      adults: d.adults || 2,
      children: d.children || 0,
      infants: d.infants || 0,
      total_travellers: (d.adults || 2) + (d.children || 0),
      departure_city: d.origin || "Dubai",
      destination: d.destination || "Makkah & Madinah",
      booking_status: "confirmed",
      payment_status: payStatus,
      fulfilment_status: "in_progress",
      currency: "AED",
      total_amount: total,
      paid_amount: paid,
      balance_due: balance,
      assigned_staff: "Operations Team",
      internal_notes: d.notes || null,
      hotel_arrangements: [],
      flight_arrangements: [],
      transfer_arrangements: [],
      visa_arrangements: [],
      esim_arrangements: [],
      package_snapshot: {},
      created_at: d.created_at || new Date().toISOString(),
      updated_at: d.updated_at || new Date().toISOString(),
    };

    if (!query || row.booking_reference.toLowerCase().includes(query.toLowerCase()) || row.customer_name?.toLowerCase().includes(query.toLowerCase())) {
      bookings.push(row);
    }
  }

  return bookings;
}

/**
 * Get detailed booking record with linked documents, travellers, and supplier costs.
 */
export async function getBookingById(id: string): Promise<BookingDetail | null> {
  const supabase = await getDb();

  let booking: BookingRow | null = null;
  try {
    const { data: b } = await (supabase as any)
      .from("bookings")
      .select("*, customer:customers(*)")
      .eq("id", id)
      .maybeSingle();

    if (b) {
      booking = {
        ...b,
        customer_name: b.customer?.full_name,
        customer_phone: b.customer?.phone,
        customer_email: b.customer?.email,
      } as BookingRow;
    }
  } catch {}

  if (!booking) {
    const list = await listBookings();
    booking = list.find((b) => b.id === id || b.booking_reference === id) || null;
  }

  if (!booking) return null;

  // Retrieve customer details
  let customer: any = null;
  if (booking.customer_id) {
    try {
      const { data: c } = await supabase.from("customers").select("*").eq("id", booking.customer_id).maybeSingle();
      customer = c;
    } catch {}
  }
  if (!customer && booking.customer_name) {
    customer = {
      full_name: booking.customer_name,
      phone: booking.customer_phone,
      email: booking.customer_email,
    };
  }

  // Retrieve travellers
  let travellers: any[] = [];
  try {
    if (booking.customer_id) {
      const { data: travs } = await supabase.from("travellers").select("*").eq("customer_id", booking.customer_id);
      if (travs) travellers = travs;
    }
  } catch {}

  // Retrieve linked quotation
  let quotation: DocumentRow | null = null;
  if (booking.quotation_id) {
    quotation = await getDocument(booking.quotation_id);
  }

  // Retrieve linked invoices, receipts, vouchers
  let invoices: DocumentRow[] = [];
  let receipts: DocumentRow[] = [];
  let vouchers: DocumentRow[] = [];

  try {
    const { data: docs } = await supabase
      .from("documents")
      .select("*")
      .or(`booking_reference.eq.${booking.booking_reference},source_document_id.eq.${booking.id}`);

    if (docs) {
      for (const d of docs as DocumentRow[]) {
        if (d.document_type === "invoice") invoices.push(d);
        else if (d.document_type === "receipt") receipts.push(d);
        else if (d.document_type === "booking_voucher") vouchers.push(d);
      }
    }
  } catch {}

  // Retrieve supplier costs
  let supplierCosts: any[] = [];
  try {
    const { data: costs } = await supabase
      .from("booking_supplier_costs")
      .select("*, supplier:suppliers(name, category, phone)")
      .eq("booking_id", booking.id);
    if (costs) supplierCosts = costs;
  } catch {}

  // Retrieve activity logs
  let activityLogs: any[] = [];
  try {
    const { data: logs } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .eq("resource_id", booking.id)
      .order("created_at", { ascending: false });
    if (logs) activityLogs = logs;
  } catch {}

  return {
    booking,
    customer,
    travellers,
    quotation,
    invoices,
    receipts,
    vouchers,
    supplierCosts,
    activityLogs,
  };
}

/**
 * Converts an accepted quotation into a central Booking record.
 * Copies customer, items, and package snapshot.
 */
export async function convertQuotationToBooking(quotationId: string, staffName = "Admin"): Promise<{ success: boolean; bookingId?: string; bookingReference?: string; error?: string }> {
  const supabase = await getDb();
  const quote = await getDocument(quotationId);
  if (!quote) return { success: false, error: "Quotation not found" };

  const items = await getDocumentItems(quotationId);
  const bookingRef = await getNextDocumentNumber("booking");

  // Ensure customer exists
  const customer = await getOrCreateCustomer({
    fullName: quote.client_name,
    email: quote.client_email,
    phone: quote.client_phone || "+971",
    country: quote.client_country,
  });

  // Extract package info
  const packageItem = items.find((it) => it.item_type === "umrah_package" || it.item_type === "hajj_package");
  const hotelItems = items.filter((it) => it.item_type === "hotel");
  const flightItems = items.filter((it) => it.item_type === "flight");
  const transferItems = items.filter((it) => it.item_type === "transfer");

  const total = Number(quote.total_aed) || 0;
  const paid = Number(quote.amount_paid_aed) || 0;

  const bookingData = {
    booking_reference: bookingRef,
    customer_id: customer.id,
    quotation_id: quote.id,
    package_name: packageItem?.description || "Custom Umrah Package",
    room_category: "Standard Room",
    travel_date: quote.travel_date || null,
    return_date: quote.return_date || null,
    adults: quote.adults || 1,
    children: quote.children || 0,
    infants: quote.infants || 0,
    total_travellers: (quote.adults || 1) + (quote.children || 0),
    departure_city: quote.origin || "Dubai",
    destination: quote.destination || "Makkah & Madinah",
    booking_status: "confirmed",
    payment_status: paid >= total && total > 0 ? "paid" : paid > 0 ? "partially_paid" : "unpaid",
    fulfilment_status: "in_progress",
    currency: "AED",
    total_amount: total,
    paid_amount: paid,
    balance_due: Math.max(0, total - paid),
    assigned_staff: staffName,
    internal_notes: `Converted from Quotation ${quote.document_number}`,
    hotel_arrangements: hotelItems.map((h) => ({ description: h.description, details: h.details, quantity: h.quantity })),
    flight_arrangements: flightItems.map((f) => ({ description: f.description, details: f.details, quantity: f.quantity })),
    transfer_arrangements: transferItems.map((t) => ({ description: t.description, details: t.details, quantity: t.quantity })),
    package_snapshot: {
      items: items.map((i) => ({ description: i.description, details: i.details, amount: i.amount_aed })),
      notes: quote.notes,
      terms: quote.terms,
    },
  };

  try {
    const { data: newBkg, error: bkgErr } = await supabase.from("bookings").insert(bookingData).select("*").single();
    if (bkgErr) {
      console.error("[convertQuotationToBooking] Insert error:", bkgErr.message);
    }

    // Update quotation status to converted and link booking reference
    await supabase.from("documents").update({
      status: "converted",
      booking_reference: bookingRef,
      future_crm_booking_id: newBkg?.id || quote.id,
      updated_at: new Date().toISOString(),
    }).eq("id", quote.id);

    // Log to admin_audit_logs
    await (supabase as any).from("admin_audit_logs").insert({
      admin_email: "admin@masaarholidays.com",
      action: "convert_quotation_to_booking",
      resource_type: "booking",
      resource_id: newBkg?.id || quote.id,
      details: { quotation_number: quote.document_number, booking_reference: bookingRef, staff: staffName },
    });

    return {
      success: true,
      bookingId: newBkg?.id || quote.id,
      bookingReference: bookingRef,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
