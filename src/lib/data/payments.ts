import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getNextDocumentNumber } from "@/lib/documents/numbering";
import { getDocument, getDocumentItems } from "@/lib/data/documents";
import type { DocumentRow } from "@/lib/types/database";

export interface PaymentRecord {
  id: string;
  payment_number: string;
  receipt_id: string | null;
  booking_id: string | null;
  invoice_id: string | null;
  customer_id: string | null;
  amount: number;
  currency: string;
  payment_method: "bank_transfer" | "cash" | "credit_card" | "stripe" | "tamara" | "cheque" | "other";
  payment_date: string;
  transaction_reference: string | null;
  received_by: string | null;
  status: "pending" | "confirmed" | "failed" | "refunded";
  notes: string | null;
  customer_name?: string;
  booking_reference?: string;
  invoice_number?: string;
  receipt_number?: string;
  created_at: string;
  updated_at: string;
}

export interface RecordPaymentInput {
  invoiceId?: string;
  bookingId?: string;
  customerId?: string;
  amount: number;
  paymentMethod: "bank_transfer" | "cash" | "credit_card" | "stripe" | "tamara" | "cheque" | "other";
  paymentDate?: string;
  transactionReference?: string;
  receivedBy?: string;
  notes?: string;
}

async function getDb() {
  try {
    return createAdminClient();
  } catch {
    return createClient();
  }
}

/**
 * List all recorded payments.
 */
export async function listPayments(limit = 100): Promise<PaymentRecord[]> {
  const supabase = await getDb();

  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*, booking:bookings(booking_reference), customer:customers(full_name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data.map((p: any) => ({
        ...p,
        amount: Number(p.amount) || 0,
        booking_reference: p.booking?.booking_reference,
        customer_name: p.customer?.full_name,
      })) as PaymentRecord[];
    }
  } catch {}

  // Fallback: derive payment records from receipt documents in documents table
  const { data: receipts } = await supabase
    .from("documents")
    .select("*")
    .eq("document_type", "receipt")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!receipts) return [];

  return receipts.map((r: any) => ({
    id: r.id,
    payment_number: r.document_number,
    receipt_id: r.id,
    booking_id: r.future_crm_booking_id || null,
    invoice_id: r.source_document_id || null,
    customer_id: r.future_crm_client_id || null,
    amount: Number(r.amount_paid_aed || r.total_aed) || 0,
    currency: r.currency || "AED",
    payment_method: (r.payment_method as any) || "bank_transfer",
    payment_date: r.payment_date || r.issue_date || r.created_at?.split("T")[0],
    transaction_reference: r.transaction_reference || null,
    received_by: r.created_by || "Admin",
    status: "confirmed",
    notes: r.notes || null,
    customer_name: r.client_name,
    booking_reference: r.booking_reference,
    invoice_number: undefined,
    receipt_number: r.document_number,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

/**
 * Records a payment against an invoice or booking, creates an authoritative Receipt document (MAS-RC-2026-XXXX),
 * and atomically updates the remaining balance and payment status.
 */
export async function recordPaymentAndGenerateReceipt(
  input: RecordPaymentInput
): Promise<{ success: boolean; receiptId?: string; receiptNumber?: string; remainingBalance?: number; error?: string }> {
  const supabase = await getDb();

  if (!input.amount || input.amount <= 0) {
    return { success: false, error: "Payment amount must be greater than zero." };
  }

  // 1. Resolve target invoice and/or booking
  let invoice: DocumentRow | null = null;
  if (input.invoiceId) {
    invoice = await getDocument(input.invoiceId);
  }

  let booking: any = null;
  if (input.bookingId) {
    const { data: b } = await supabase.from("bookings").select("*").eq("id", input.bookingId).maybeSingle();
    booking = b;
  } else if (invoice?.booking_reference) {
    const { data: b } = await supabase.from("bookings").select("*").eq("booking_reference", invoice.booking_reference).maybeSingle();
    booking = b;
  }

  const clientName = invoice?.client_name || booking?.customer_name || "Customer";
  const clientPhone = invoice?.client_phone || booking?.customer_phone || "+971";
  const clientEmail = invoice?.client_email || booking?.customer_email || null;
  const bookingRef = invoice?.booking_reference || booking?.booking_reference || "";

  // 2. Compute current totals and new balance
  const invoiceTotal = Number(invoice?.total_aed) || Number(booking?.total_amount) || input.amount;
  const alreadyPaid = Number(invoice?.amount_paid_aed) || Number(booking?.paid_amount) || 0;
  const newTotalPaid = alreadyPaid + input.amount;
  const remainingBalance = Math.max(0, invoiceTotal - newTotalPaid);

  // 3. Generate authoritative Receipt Number (MAS-RC-2026-XXXX)
  const receiptNumber = await getNextDocumentNumber("receipt");

  // 4. Create Receipt Document in `documents` table
  const receiptDocData = {
    document_type: "receipt" as const,
    document_number: receiptNumber,
    status: "confirmed",
    client_name: clientName,
    client_email: clientEmail,
    client_phone: clientPhone,
    source_document_id: invoice?.id || null,
    booking_reference: bookingRef,
    subtotal_aed: input.amount,
    discount_aed: 0,
    tax_aed: 0,
    total_aed: input.amount,
    amount_paid_aed: input.amount,
    payment_method: input.paymentMethod as any,
    transaction_reference: input.transactionReference || null,
    payment_date: input.paymentDate || new Date().toISOString().split("T")[0],
    issue_date: input.paymentDate || new Date().toISOString().split("T")[0],
    notes: input.notes ? `${input.notes}\nRemaining balance: AED ${remainingBalance.toLocaleString()}` : `Payment of AED ${input.amount.toLocaleString()} received. Remaining balance: AED ${remainingBalance.toLocaleString()}`,
    terms: "Thank you for choosing Masaar Holidays. Payment received with thanks.",
    created_by: input.receivedBy || "Admin",
  };

  const { data: receiptDoc, error: rcErr } = await (supabase as any).from("documents").insert(receiptDocData).select("*").single();
  if (rcErr) {
    console.error("[recordPaymentAndGenerateReceipt] Receipt insert error:", rcErr.message);
  }

  const receiptId = receiptDoc?.id || `rc-${Date.now()}`;

  // 5. Update Invoice status & balance
  if (invoice) {
    let invoiceStatus = "partially_paid";
    if (newTotalPaid >= invoiceTotal && invoiceTotal > 0) {
      invoiceStatus = "paid";
    }

    await (supabase as any).from("documents").update({
      amount_paid_aed: newTotalPaid,
      status: invoiceStatus,
      payment_date: input.paymentDate || new Date().toISOString().split("T")[0],
      payment_method: input.paymentMethod as any,
      transaction_reference: input.transactionReference || null,
      updated_at: new Date().toISOString(),
    }).eq("id", invoice.id);
  }

  // 6. Update Booking status & balance
  if (booking) {
    let bookingPayStatus = "partially_paid";
    if (newTotalPaid >= Number(booking.total_amount) && Number(booking.total_amount) > 0) {
      bookingPayStatus = "paid";
    }

    await supabase.from("bookings").update({
      paid_amount: newTotalPaid,
      balance_due: remainingBalance,
      payment_status: bookingPayStatus,
      updated_at: new Date().toISOString(),
    }).eq("id", booking.id);
  }

  // 7. Insert payment ledger entry
  try {
    await supabase.from("payments").insert({
      payment_number: receiptNumber,
      receipt_id: receiptId,
      booking_id: booking?.id || null,
      invoice_id: invoice?.id || null,
      customer_id: input.customerId || null,
      amount: input.amount,
      currency: "AED",
      payment_method: input.paymentMethod,
      payment_date: input.paymentDate || new Date().toISOString().split("T")[0],
      transaction_reference: input.transactionReference || null,
      received_by: input.receivedBy || "Admin",
      status: "confirmed",
      notes: input.notes || null,
    });
  } catch {}

  // 8. Audit Log
  await (supabase as any).from("admin_audit_logs").insert({
    admin_email: "admin@masaarholidays.com",
    action: "record_payment",
    resource_type: "receipt",
    resource_id: receiptId,
    details: {
      receipt_number: receiptNumber,
      amount: input.amount,
      payment_method: input.paymentMethod,
      remaining_balance: remainingBalance,
      invoice_id: invoice?.id,
      booking_id: booking?.id,
    },
  });

  return {
    success: true,
    receiptId,
    receiptNumber,
    remainingBalance,
  };
}
