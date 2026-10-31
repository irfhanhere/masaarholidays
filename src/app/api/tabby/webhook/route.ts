import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTabbyConfig, getTabbyPayment, captureTabbyPayment } from "@/lib/tabby";
import { sendVisaPaymentAndSubmissionEmails } from "@/lib/email/service";
import { fulfilTransferBooking } from "@/lib/transfer-fulfilment";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Tabby Webhook Handler
 *
 * Requirements:
 * - Authenticated / verified payload processing.
 * - Idempotent event ledger recording in payment_webhook_events.
 * - Re-verify payment status directly with Tabby GET /api/v2/payments/{id}.
 * - Capture authorized payments to finalize state to CLOSED.
 * - Prevent duplicate orders or double fulfillment.
 */
export async function POST(request: NextRequest) {
  const config = getTabbyConfig();

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to read request body";
    return NextResponse.json({ error: `Request body error: ${msg}` }, { status: 400 });
  }

  // Verify webhook signature or custom auth header if configured & provided
  if (config.webhookSecret) {
    const authHeader =
      request.headers.get("x-webhook-signature") ||
      request.headers.get("authorization") ||
      request.headers.get("x-signature") ||
      request.headers.get("x-tabby-signature") ||
      "";
    const cleanHeader = authHeader.replace(/^Bearer\s+/i, "").trim();
    // If a signature or authorization header is present on request, validate it against webhookSecret
    if (cleanHeader && cleanHeader !== config.webhookSecret && !authHeader.includes(config.webhookSecret)) {
      console.warn("[tabby-webhook] Webhook signature/token mismatch. Rejecting unauthorized caller.");
      return NextResponse.json({ error: "Unauthorized webhook caller" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Extract payment ID from Tabby webhook payload
  // Format may be { id: "pay_...", status: "authorized", ... } or nested { payment: { id: "pay_..." } } or event { data: ... }
  const payloadPayment = (body.payment as Record<string, unknown>) || body;
  const paymentId = (typeof payloadPayment.id === "string" ? payloadPayment.id : (typeof body.id === "string" ? body.id : "")).trim();
  const eventType = (typeof body.event === "string" ? body.event : (typeof payloadPayment.status === "string" ? payloadPayment.status : "payment.updated")).toLowerCase();

  if (!paymentId) {
    console.warn("[tabby-webhook] Missing payment ID in webhook payload:", body);
    return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Ingest event ledger for deduplication
  const externalId = `${paymentId}_${eventType}`;
  const { error: insertErr } = await supabase.from("payment_webhook_events").insert({
    gateway: "tabby",
    external_id: externalId,
    event_type: eventType,
    payload: body,
    processed: false,
  });

  if (insertErr) {
    const isDuplicate =
      insertErr.code === "23505" ||
      insertErr.message?.toLowerCase().includes("duplicate") ||
      insertErr.message?.toLowerCase().includes("unique");

    if (isDuplicate) {
      console.log(`[tabby-webhook] Duplicate event ${externalId} received. Returning 200 idempotent.`);
      return NextResponse.json({ received: true, idempotent: true }, { status: 200 });
    }

    console.error("[tabby-webhook] Database ledger insert error:", insertErr.message);
  }

  // 2. Query Tabby payment directly to obtain verified status
  let verifiedPayment;
  try {
    verifiedPayment = await getTabbyPayment(paymentId);
  } catch (err: unknown) {
    console.error(`[tabby-webhook] Failed to verify payment ${paymentId} with Tabby:`, err);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }

  const paymentStatus = (verifiedPayment.status || "").toUpperCase();
  const paymentAmount = parseFloat(verifiedPayment.amount || "0");
  const paymentCurrency = verifiedPayment.currency || "AED";
  const orderRef = verifiedPayment.order?.reference_id || "";

  // 3. Check if this is a Private Transfer booking
  const isTransfer = orderRef.startsWith("MH-TRF-");

  if (isTransfer) {
    let trfQuery = supabase.from("transfer_bookings").select("*").eq("booking_ref", orderRef);
    let { data: booking, error: trfErr } = await trfQuery.maybeSingle();

    if (!booking) {
      // Also try matching by stripe_session_id (which stores the Tabby session ID)
      const { data: bSession } = await supabase
        .from("transfer_bookings")
        .select("*")
        .eq("stripe_session_id", paymentId)
        .maybeSingle();
      booking = bSession;
    }

    if (trfErr || !booking) {
      console.warn(`[tabby-webhook] Transfer booking not found for payment ${paymentId} (orderRef: ${orderRef})`);
      return NextResponse.json({ received: true, note: "Transfer booking record not found yet" }, { status: 200 });
    }

    // Deduplication check: if transfer booking is already paid, acknowledge without double capture or duplicate emails
    if (booking.payment_status === "paid") {
      console.log(`[tabby-webhook] Transfer booking ${booking.booking_ref} is already paid. Returning 200 idempotent.`);
      await supabase
        .from("payment_webhook_events")
        .update({ processed: true })
        .eq("gateway", "tabby")
        .eq("external_id", externalId);
      return NextResponse.json({ received: true, idempotent: true, note: "Transfer booking already paid" }, { status: 200 });
    }

    // Handle Status Transitions for Transfer
    if (paymentStatus === "AUTHORIZED") {
      let captureResult;
      try {
        captureResult = await captureTabbyPayment(paymentId, paymentAmount, booking.booking_ref);
      } catch (captureErr: unknown) {
        const msg = captureErr instanceof Error ? captureErr.message : "Capture failed";
        console.warn(`[tabby-webhook] Capture notice for transfer ${paymentId}: ${msg}. Re-checking status...`);
        try {
          const recheck = await getTabbyPayment(paymentId);
          if ((recheck.status || "").toUpperCase() === "CLOSED") {
            captureResult = { id: `cap_concurrent_${paymentId}`, amount: paymentAmount, status: "CLOSED" };
          } else {
            return NextResponse.json({ error: "Capture failed" }, { status: 500 });
          }
        } catch {
          return NextResponse.json({ error: "Capture failed" }, { status: 500 });
        }
      }

      await supabase
        .from("transfer_bookings")
        .update({
          payment_status: "paid",
          booking_status: "confirmed",
          stripe_payment_intent: paymentId,
          charged_amount_minor: Math.round(paymentAmount * 100),
          charge_currency: paymentCurrency.toUpperCase(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      after(async () => {
        try {
          await fulfilTransferBooking(booking.id);
        } catch (fulfilErr) {
          console.error("[tabby-webhook] Error fulfilling transfer booking:", fulfilErr);
        }
      });

      await supabase
        .from("payment_webhook_events")
        .update({ processed: true })
        .eq("gateway", "tabby")
        .eq("external_id", externalId);

      return NextResponse.json({ received: true, status: "captured", type: "transfer" }, { status: 200 });
    } else if (paymentStatus === "CLOSED") {
      await supabase
        .from("transfer_bookings")
        .update({
          payment_status: "paid",
          booking_status: "confirmed",
          stripe_payment_intent: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      after(async () => {
        try {
          await fulfilTransferBooking(booking.id);
        } catch (fulfilErr) {
          console.error("[tabby-webhook] Error fulfilling transfer booking:", fulfilErr);
        }
      });

      await supabase
        .from("payment_webhook_events")
        .update({ processed: true })
        .eq("gateway", "tabby")
        .eq("external_id", externalId);

      return NextResponse.json({ received: true, status: "closed", type: "transfer" }, { status: 200 });
    } else if (paymentStatus === "REJECTED" || paymentStatus === "EXPIRED") {
      await supabase
        .from("transfer_bookings")
        .update({
          payment_status: "failed",
          special_requests: `${booking.special_requests || ""}\n[Tabby payment marked ${paymentStatus}]`.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      return NextResponse.json({ received: true, status: paymentStatus.toLowerCase(), type: "transfer" }, { status: 200 });
    }

    return NextResponse.json({ received: true, status: paymentStatus.toLowerCase(), type: "transfer" }, { status: 200 });
  }

  // 4. Locate matching Visa application
  let appQuery = supabase.from("visa_applications").select("*");
  if (orderRef) {
    appQuery = appQuery.eq("reference_no", orderRef);
  } else {
    appQuery = appQuery.eq("tabby_payment_id", paymentId);
  }

  const { data: application, error: appErr } = await appQuery.maybeSingle();

  if (appErr || !application) {
    console.warn(`[tabby-webhook] Application not found for payment ${paymentId} (orderRef: ${orderRef})`);
    return NextResponse.json({ received: true, note: "Application record not found yet" }, { status: 200 });
  }

  // Deduplication check: if application is already paid, acknowledge without double capture or duplicate emails
  if (application.payment_status === "paid") {
    console.log(`[tabby-webhook] Application ${application.reference_no} is already paid. Returning 200 idempotent.`);
    await supabase
      .from("payment_webhook_events")
      .update({ processed: true })
      .eq("gateway", "tabby")
      .eq("external_id", externalId);
    return NextResponse.json({ received: true, idempotent: true, note: "Application already paid" }, { status: 200 });
  }

  // 4. Handle Status Transitions
  if (paymentStatus === "AUTHORIZED") {
    // Payment is authorized by Tabby — capture it to finalize transaction to CLOSED
    let captureResult;
    try {
      captureResult = await captureTabbyPayment(paymentId, paymentAmount, application.reference_no);
    } catch (captureErr: unknown) {
      const msg = captureErr instanceof Error ? captureErr.message : "Capture failed";
      console.warn(`[tabby-webhook] Capture notice for ${paymentId}: ${msg}. Re-checking status...`);
      try {
        const recheck = await getTabbyPayment(paymentId);
        if ((recheck.status || "").toUpperCase() === "CLOSED") {
          captureResult = { id: `cap_concurrent_${paymentId}`, amount: paymentAmount, status: "CLOSED" };
        } else {
          return NextResponse.json({ error: "Capture failed" }, { status: 500 });
        }
      } catch {
        return NextResponse.json({ error: "Capture failed" }, { status: 500 });
      }
    }

    // Update Application to Paid
    const existingTimeline = Array.isArray(application.status_timeline) ? application.status_timeline : [];
    const updatedTimeline = existingTimeline.map((item: any) => {
      if (item.step === "payment_received") {
        return { ...item, status: "completed" as const, timestamp: new Date().toISOString() };
      }
      if (item.step === "application_under_review") {
        return { ...item, status: "in_progress" as const, timestamp: new Date().toISOString() };
      }
      return item;
    });

    await supabase
      .from("visa_applications")
      .update({
        payment_status: "paid",
        application_status: "submitted",
        tabby_payment_id: paymentId,
        payment_gateway: "tabby",
        payment_method: "Tabby Pay in 4",
        status_timeline: updatedTimeline,
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    // Record ledger entry in visa_payments
    try {
      await supabase.from("visa_payments").insert({
        application_id: application.id,
        transaction_reference: paymentId,
        gateway: "tabby",
        gateway_payment_id: paymentId,
        tabby_payment_id: paymentId,
        tabby_capture_id: captureResult?.id || null,
        amount: paymentAmount,
        currency: paymentCurrency,
        payment_method: "Tabby (4 Installments)",
        payment_status: "paid",
        idempotency_key: `tabby_pay_${paymentId}`,
      });
    } catch (payInsertErr) {
      console.warn("[tabby-webhook] Ledger record insert notice:", payInsertErr);
    }

    // Dispatch confirmation email
    after(async () => {
      try {
        await sendVisaPaymentAndSubmissionEmails(application.id);
      } catch (emailErr) {
        console.error("[tabby-webhook] Error sending confirmation email:", emailErr);
      }
    });

    // Mark webhook event processed
    await supabase
      .from("payment_webhook_events")
      .update({ processed: true })
      .eq("gateway", "tabby")
      .eq("external_id", externalId);

    return NextResponse.json({ received: true, status: "captured" }, { status: 200 });
  } else if (paymentStatus === "CLOSED") {
    // Payment already captured and closed on provider side
    await supabase
      .from("visa_applications")
      .update({
        payment_status: "paid",
        tabby_payment_id: paymentId,
        payment_gateway: "tabby",
        payment_method: "Tabby Pay in 4",
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);
    return NextResponse.json({ received: true, status: "closed" }, { status: 200 });
  } else if (paymentStatus === "REJECTED" || paymentStatus === "EXPIRED") {
    await supabase
      .from("visa_applications")
      .update({
        payment_status: "failed",
        internal_notes: `Tabby payment marked ${paymentStatus}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    return NextResponse.json({ received: true, status: paymentStatus.toLowerCase() }, { status: 200 });
  }

  return NextResponse.json({ received: true, status: paymentStatus.toLowerCase() }, { status: 200 });
}
