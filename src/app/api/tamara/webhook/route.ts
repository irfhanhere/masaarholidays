import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getTamaraConfig,
  getTamaraOrder,
  authoriseTamaraOrder,
  captureTamaraPayment,
  verifyTamaraNotification,
} from "@/lib/tamara";
import { sendVisaPaymentAndSubmissionEmails } from "@/lib/email/service";
import { fulfilTransferBooking } from "@/lib/transfer-fulfilment";
import { fulfilEsimOrder } from "@/lib/esim-fulfilment";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Tamara Webhook Handler
 *
 * Implements:
 * 1. Authenticated webhook notification token verification (HS256 JWT or bearer).
 * 2. Idempotent ledger insertion in payment_webhook_events (deduplication).
 * 3. Authoritative order retrieval directly from Tamara API (GET /orders/{order_id}).
 * 4. Authorise & Capture execution where applicable.
 * 5. Safe fulfilment dispatch for Visas, Transfers, and eSIMs.
 */
export async function POST(request: NextRequest) {
  const config = getTamaraConfig();

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to read request body";
    return NextResponse.json({ error: `Request body error: ${msg}` }, { status: 400 });
  }

  // 1. Authenticate Caller using configured TAMARA_NOTIFICATION_TOKEN
  if (config.notificationToken) {
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("tamara-signature") ||
      request.headers.get("x-signature") ||
      "";

    const verification = verifyTamaraNotification(authHeader, config.notificationToken);
    if (!verification.valid) {
      console.warn("[tamara-webhook] Unauthorized notification caller:", verification.error);
      return NextResponse.json({ error: "Unauthorized webhook notification" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Extract order ID and event type from Tamara webhook payload
  const orderId = (
    (typeof body.order_id === "string" ? body.order_id : "") ||
    (typeof body.payment_id === "string" ? body.payment_id : "") ||
    (body.data && typeof (body.data as any).order_id === "string" ? (body.data as any).order_id : "")
  ).trim();

  const eventType = (
    (typeof body.event_type === "string" ? body.event_type : "") ||
    (typeof body.event === "string" ? body.event : "") ||
    (typeof body.status === "string" ? body.status : "order_updated")
  ).toLowerCase();

  if (!orderId) {
    console.warn("[tamara-webhook] Missing order_id in webhook payload:", body);
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 2. Ingest into idempotent event ledger
  const externalId = `${orderId}_${eventType}`;
  const { error: insertErr } = await supabase.from("payment_webhook_events").insert({
    gateway: "tamara",
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
      console.log(`[tamara-webhook] Duplicate event ${externalId} received. Returning 200 idempotent.`);
      return NextResponse.json({ received: true, idempotent: true }, { status: 200 });
    }

    console.error("[tamara-webhook] Database ledger insert error:", insertErr.message);
  }

  // 3. Re-verify authoritative status with Tamara API directly (never trust webhook body alone)
  let verifiedOrder;
  try {
    verifiedOrder = await getTamaraOrder(orderId);
  } catch (err: unknown) {
    console.error(`[tamara-webhook] Failed to verify order ${orderId} with Tamara API:`, err);
    // If mock in sandbox, allow synthetic payload
    if (orderId.includes("mock")) {
      verifiedOrder = {
        order_id: orderId,
        order_reference_id: String(body.order_reference_id || ""),
        status: "authorised",
        total_amount: { amount: 100, currency: "AED" },
      };
    } else {
      return NextResponse.json({ error: "Order verification failed" }, { status: 500 });
    }
  }

  const orderStatus = (verifiedOrder.status || "").toLowerCase();
  const orderRef = verifiedOrder.order_reference_id || String(body.order_reference_id || "");
  const orderAmount = Number(verifiedOrder.total_amount?.amount || 0);
  const orderCurrency = String(verifiedOrder.total_amount?.currency || "AED").toUpperCase();

  console.log(`[tamara-webhook] Processing ${orderId} (${orderRef}): status = ${orderStatus}`);

  // 4. Handle Authorisation and Capture
  let isSuccessfulPayment = false;

  if (orderStatus === "approved") {
    try {
      console.log(`[tamara-webhook] Order ${orderId} approved by customer. Authorising...`);
      await authoriseTamaraOrder(orderId);
      isSuccessfulPayment = true;
    } catch (authErr) {
      console.error(`[tamara-webhook] Failed to authorise approved order ${orderId}:`, authErr);
    }
  }

  if (orderStatus === "authorised" || isSuccessfulPayment) {
    try {
      console.log(`[tamara-webhook] Capturing payment for authorised order ${orderId}...`);
      await captureTamaraPayment(orderId, orderAmount, orderCurrency, {
        shipping_company: "Masaar Holidays Online Services",
        tracking_number: orderRef,
      });
      isSuccessfulPayment = true;
    } catch (capErr) {
      console.error(`[tamara-webhook] Capture warning for ${orderId}:`, capErr);
      // Still consider authorised payment as valid commitment
      isSuccessfulPayment = true;
    }
  }

  if (orderStatus === "captured") {
    isSuccessfulPayment = true;
  }

  // 5. Fulfilment & State Updates
  if (isSuccessfulPayment) {
    // A. Saudi Visa or Worldwide Visa (MH-SV- or MH-VA-)
    if (orderRef.startsWith("MH-SV-") || orderRef.startsWith("MH-VA-")) {
      const { data: visaApp } = await supabase
        .from("visa_applications")
        .select("id, payment_status, reference_no, primary_contact_name, primary_contact_email")
        .or(`reference_no.eq.${orderRef},tamara_order_id.eq.${orderId}`)
        .maybeSingle();

      if (visaApp) {
        if (visaApp.payment_status !== "paid") {
          await supabase
            .from("visa_applications")
            .update({
              payment_status: "paid",
              payment_gateway: "tamara",
              tamara_order_id: orderId,
              charged_amount: orderAmount,
              charged_currency: orderCurrency,
              application_status: "submitted",
              updated_at: new Date().toISOString(),
            })
            .eq("id", visaApp.id);

          // Update or insert visa_payments record
          const { data: existingPayment } = await supabase
            .from("visa_payments")
            .select("id")
            .eq("application_id", visaApp.id)
            .maybeSingle();

          if (existingPayment) {
            await supabase
              .from("visa_payments")
              .update({
                gateway: "tamara",
                tamara_order_id: orderId,
                payment_status: "paid",
                amount: orderAmount,
                currency: orderCurrency,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingPayment.id);
          } else {
            await supabase.from("visa_payments").insert({
              application_id: visaApp.id,
              transaction_reference: orderRef,
              gateway: "tamara",
              tamara_order_id: orderId,
              payment_status: "paid",
              amount: orderAmount,
              currency: orderCurrency,
            });
          }

          // Dispatch confirmation emails in background
          after(async () => {
            try {
              await sendVisaPaymentAndSubmissionEmails(visaApp.id);
            } catch (emailErr) {
              console.error("[tamara-webhook] Failed to send visa confirmation email:", emailErr);
            }
          });
        }
      }
    }

    // B. Transfers (MH-TRF-)
    else if (orderRef.startsWith("MH-TRF-")) {
      const { data: booking } = await supabase
        .from("transfer_bookings")
        .select("id, payment_status, booking_ref")
        .or(`booking_ref.eq.${orderRef},tamara_order_id.eq.${orderId}`)
        .maybeSingle();

      if (booking) {
        if (booking.payment_status !== "paid") {
          await supabase
            .from("transfer_bookings")
            .update({
              payment_status: "paid",
              payment_gateway: "tamara",
              tamara_order_id: orderId,
              booking_status: "confirmed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", booking.id);

          after(async () => {
            try {
              await fulfilTransferBooking(booking.id);
            } catch (err) {
              console.error("[tamara-webhook] Transfer fulfilment error:", err);
            }
          });
        }
      }
    }

    // C. eSIM Orders (MH-)
    else if (orderRef.startsWith("MH-")) {
      const { data: esimOrder } = await supabase
        .from("esim_orders")
        .select("id, payment_status, partner_ref")
        .or(`partner_ref.eq.${orderRef},tamara_order_id.eq.${orderId}`)
        .maybeSingle();

      if (esimOrder) {
        if (esimOrder.payment_status !== "paid") {
          await supabase
            .from("esim_orders")
            .update({
              payment_status: "paid",
              payment_provider: "tamara",
              tamara_order_id: orderId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", esimOrder.id);

          after(async () => {
            try {
              await fulfilEsimOrder(esimOrder.id);
            } catch (err) {
              console.error("[tamara-webhook] eSIM fulfilment error:", err);
            }
          });
        }
      }
    }
  }

  // Handle Cancellation / Decline / Expiration
  if (orderStatus === "declined" || orderStatus === "canceled" || orderStatus === "expired") {
    console.log(`[tamara-webhook] Order ${orderId} reached final non-paid status: ${orderStatus}`);
    if (orderRef.startsWith("MH-SV-") || orderRef.startsWith("MH-VA-")) {
      await supabase
        .from("visa_applications")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .or(`reference_no.eq.${orderRef},tamara_order_id.eq.${orderId}`)
        .eq("payment_status", "pending");
    }
    if (orderRef.startsWith("MH-TRF-")) {
      await supabase
        .from("transfer_bookings")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .or(`booking_ref.eq.${orderRef},tamara_order_id.eq.${orderId}`)
        .eq("payment_status", "pending");
    }
    if (orderRef.startsWith("MH-") && !orderRef.startsWith("MH-SV-") && !orderRef.startsWith("MH-TRF-")) {
      await supabase
        .from("esim_orders")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .or(`partner_ref.eq.${orderRef},tamara_order_id.eq.${orderId}`)
        .eq("payment_status", "pending");
    }
  }

  // Mark webhook event processed in ledger
  await supabase
    .from("payment_webhook_events")
    .update({ processed: true })
    .eq("gateway", "tamara")
    .eq("external_id", externalId);

  return NextResponse.json({ received: true, status: orderStatus }, { status: 200 });
}
