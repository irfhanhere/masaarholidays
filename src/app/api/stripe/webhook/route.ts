import { NextRequest, NextResponse, after } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { fulfilEsimOrder } from "@/lib/esim-fulfilment";
import { fulfilTransferBooking } from "@/lib/transfer-fulfilment";
import { sendVisaPaymentAndSubmissionEmails, sendRefundNotification } from "@/lib/email/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (webhookSecret) {
    if (
      (webhookSecret.startsWith('"') && webhookSecret.endsWith('"')) ||
      (webhookSecret.startsWith("'") && webhookSecret.endsWith("'"))
    ) {
      webhookSecret = webhookSecret.slice(1, -1).trim();
    }
  }

  if (!webhookSecret) {
    console.error("Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured on server" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to read request body";
    return NextResponse.json({ error: `Request body error: ${msg}` }, { status: 400 });
  }

  if (!rawBody || rawBody.length === 0) {
    return NextResponse.json({ error: "Empty request body" }, { status: 400 });
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "Stripe client configuration missing" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bad signature";
    console.warn("[stripe-webhook] Signature verification failed:", {
      message: msg,
      secretConfigured: Boolean(webhookSecret),
      secretLength: webhookSecret?.length ?? 0,
      secretPrefixValid: webhookSecret?.startsWith("whsec_") ?? false,
      bodyLength: rawBody.length,
      hasSignatureHeader: Boolean(signature),
    });
    return NextResponse.json({ error: `Invalid webhook signature: ${msg}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Insert into esim_webhook_events ledger (idempotent: return 200 on duplicate without running anything)
  const { error: insertErr } = await supabase.from("esim_webhook_events").insert({
    source: "payment",
    external_id: event.id,
    event: event.type,
    payload: event as unknown as Record<string, unknown>,
    processed: false,
  });

  if (insertErr) {
    // If unique constraint violated on (source, external_id), event was already ingested
    const isDuplicate =
      insertErr.code === "23505" ||
      insertErr.message.toLowerCase().includes("duplicate") ||
      insertErr.message.toLowerCase().includes("unique");

    if (isDuplicate) {
      console.log(`[stripe-webhook] Duplicate event ${event.id} received. Returning 200 without running actions.`);
      return NextResponse.json({ received: true, idempotent: true }, { status: 200 });
    }

    console.error("Failed to record webhook event in esim_webhook_events:", insertErr.message);
    return NextResponse.json(
      { error: "Database error recording webhook event" },
      { status: 500 }
    );
  }

  // Handle relevant Stripe event types
  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;

        // 1. Handle Private Transfer booking payment
        if (session.metadata?.type === "transfer" || session.metadata?.booking_id) {
          const bookingId = (session.metadata?.booking_id as string) || session.client_reference_id;
          let trfQuery = supabase.from("transfer_bookings").select("*");
          if (bookingId) {
            trfQuery = trfQuery.eq("id", bookingId);
          } else if (session.id) {
            trfQuery = trfQuery.eq("stripe_session_id", session.id);
          }

          const { data: booking, error: trfErr } = await trfQuery.maybeSingle();
          if (trfErr) {
            console.warn(`Error querying transfer_bookings for Stripe session ${session.id}:`, trfErr.message);
          }

          if (booking && session.payment_status === "paid") {
            const paymentIntentId =
              typeof session.payment_intent === "string" ? session.payment_intent : null;

            await supabase
              .from("transfer_bookings")
              .update({
                payment_status: "paid",
                booking_status: "confirmed",
                stripe_payment_intent: paymentIntentId,
                charged_amount_minor: session.amount_total ?? booking.charged_amount_minor,
                charge_currency: (session.currency?.toUpperCase() || booking.charge_currency),
                updated_at: new Date().toISOString(),
              })
              .eq("id", booking.id);

            after(async () => {
              try {
                await fulfilTransferBooking(booking.id);
              } catch (err: unknown) {
                console.error("[stripe-webhook] Error in transfer booking fulfillment:", err);
              }
            });
          }
          break;
        }

        // 2. Handle Visa application payment
        if (session.metadata?.type === "visa" || session.metadata?.reference_no?.startsWith("MH-")) {
          const applicationId = (session.metadata?.application_id as string) || session.client_reference_id;
          const sessionRefNo = session.metadata?.reference_no as string | undefined;

          let visaQuery = supabase.from("visa_applications").select("*");
          if (applicationId) {
            visaQuery = visaQuery.eq("id", applicationId);
          } else if (session.id) {
            visaQuery = visaQuery.eq("stripe_session_id", session.id);
          }

          const { data: application, error: appErr } = await visaQuery.maybeSingle();
          if (appErr || !application) {
            console.warn(`[stripe-webhook] Visa application not found for session ${session.id}:`, appErr?.message);
            break;
          }

          // Idempotency: Prevent duplicate processing if application was already confirmed paid
          if (application.payment_status === "paid") {
            console.log(`[stripe-webhook] Visa application ${application.reference_no} already marked paid. Suppressing duplicate.`);
            break;
          }

          const isPaymentPaid = session.payment_status === "paid";
          const expectedAmountMinor = Math.round(Number(application.total_amount) * 100);
          const isAmountMatch = session.amount_total === expectedAmountMinor;
          const isCurrencyMatch = session.currency?.toLowerCase() === (application.currency || "aed").toLowerCase();
          const isRefMatch = !sessionRefNo || sessionRefNo === application.reference_no;

          if (isPaymentPaid && isAmountMatch && isCurrencyMatch && isRefMatch) {
            const paymentIntentId =
              typeof session.payment_intent === "string" ? session.payment_intent : null;

            const existingTimeline = Array.isArray(application.status_timeline) ? application.status_timeline : [];
            const updatedTimeline: Array<{
              step: string;
              timestamp: string;
              status: "completed" | "in_progress" | "pending";
              note?: string;
            }> = existingTimeline.map((item: any) => {
              if (item.step === "payment_received") {
                return { ...item, status: "completed" as const, timestamp: new Date().toISOString() };
              }
              if (item.step === "application_under_review") {
                return { ...item, status: "in_progress" as const, timestamp: new Date().toISOString() };
              }
              const validStatus: "completed" | "in_progress" | "pending" =
                item.status === "completed" || item.status === "in_progress" ? item.status : "pending";
              return { ...item, status: validStatus };
            });

            await supabase
              .from("visa_applications")
              .update({
                payment_status: "paid",
                application_status: "submitted",
                stripe_payment_intent_id: paymentIntentId,
                payment_method: session.payment_method_types?.[0] || "card",
                charged_amount: (session.amount_total ?? 0) / 100,
                charged_currency: (session.currency?.toUpperCase() || application.currency || "AED"),
                status_timeline: updatedTimeline,
                updated_at: new Date().toISOString(),
              })
              .eq("id", application.id);

            // Record payment in visa_payments ledger with idempotency
            try {
              await supabase.from("visa_payments").upsert(
                {
                  application_id: application.id,
                  transaction_reference: paymentIntentId || session.id,
                  stripe_session_id: session.id,
                  amount: (session.amount_total ?? 0) / 100,
                  currency: (session.currency?.toUpperCase() || application.currency || "AED"),
                  payment_method: session.payment_method_types?.[0] || "card",
                  payment_status: "paid",
                  gateway: "stripe",
                  idempotency_key: `visa_pay_${application.id}_${session.id}`,
                },
                { onConflict: "idempotency_key" }
              );
            } catch (payInsertErr) {
              console.warn("[stripe-webhook] Error recording visa payment ledger:", payInsertErr);
            }

            // Dispatch transactional customer confirmation & staff alert emails asynchronously
            after(async () => {
              try {
                await sendVisaPaymentAndSubmissionEmails(application.id);
              } catch (emailErr: unknown) {
                console.error("[stripe-webhook] Error dispatching visa confirmation emails:", emailErr);
              }
            });
          } else {
            console.error(
              `[stripe-webhook] Payment verification mismatch on visa application ${application.reference_no}: ` +
                `status=${session.payment_status}, amount=${session.amount_total} (expected ${expectedAmountMinor}), ` +
                `currency=${session.currency} (expected ${application.currency}), refMatch=${isRefMatch}`
            );

            await supabase
              .from("visa_applications")
              .update({
                payment_status: "failed",
                internal_notes: `Payment verification mismatch: received ${session.amount_total} ${session.currency}, expected ${expectedAmountMinor} ${application.currency}`,
                updated_at: new Date().toISOString(),
              })
              .eq("id", application.id);
          }
          break;
        }

        // 3. Handle eSIM order payment
        const orderId = session.client_reference_id || (session.metadata?.order_id as string);

        let query = supabase.from("esim_orders").select("*");
        if (orderId) {
          query = query.eq("id", orderId);
        } else if (session.id) {
          query = query.eq("stripe_session_id", session.id);
        }

        const { data: order, error: orderErr } = await query.maybeSingle();

        if (orderErr || !order) {
          console.warn(`Order not found for Stripe session: ${session.id}`);
          break;
        }

        const isPaymentPaid = session.payment_status === "paid";
        const isAmountMatch = session.amount_total === order.expected_amount_minor;
        const isCurrencyMatch =
          session.currency?.toLowerCase() === order.charge_currency?.toLowerCase();

        // Mark paid ONLY if all three conditions match:
        // payment_status === 'paid' AND amount_total === expected_amount_minor AND session.currency === order.charge_currency
        if (isPaymentPaid && isAmountMatch && isCurrencyMatch) {
          const paymentIntentId =
            typeof session.payment_intent === "string" ? session.payment_intent : null;
          const paymentRef = paymentIntentId || session.id;

          // Adaptive Pricing: extract presentment currency and amount if customer paid in their local currency
          let presentmentCurrency: string | null = null;
          let presentmentAmountMinor: number | null = null;

          if (session.presentment_details?.presentment_currency) {
            presentmentCurrency = session.presentment_details.presentment_currency.toLowerCase();
            presentmentAmountMinor = session.presentment_details.presentment_amount;
          }

          await supabase
            .from("esim_orders")
            .update({
              payment_status: "paid",
              payment_ref: paymentRef,
              stripe_payment_intent: paymentIntentId,
              charged_amount_minor: session.amount_total,
              charge_currency: session.currency?.toLowerCase() || order.charge_currency,
              presentment_currency: presentmentCurrency,
              presentment_amount_minor: presentmentAmountMinor,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);

          // Run fulfilment asynchronously AFTER response is returned (prevents Stripe webhook timeouts)
          after(async () => {
            try {
              await fulfilEsimOrder(order.id);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error(`[stripe-webhook] Error in background fulfilment for order ${order.id}:`, msg);
            }
          });
        } else {
          // On mismatch: set payment_status 'failed', needs_attention true, stop
          console.error(
            `Payment verification mismatch on order ${order.id}: ` +
              `status=${session.payment_status}, amount=${session.amount_total} (expected ${order.expected_amount_minor}), ` +
              `currency=${session.currency} (expected ${order.charge_currency})`
          );

          await supabase
            .from("esim_orders")
            .update({
              payment_status: "failed",
              needs_attention: true,
              error: `Payment amount or currency mismatch: received ${session.amount_total} ${session.currency}, expected ${order.expected_amount_minor} ${order.charge_currency}`,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.client_reference_id || (session.metadata?.order_id as string);

        // 1. Handle Visa checkout session expiration
        if (session.metadata?.type === "visa" || session.metadata?.application_id || session.metadata?.reference_no?.startsWith("MH-")) {
          const visaAppId = (session.metadata?.application_id as string) || session.client_reference_id;
          let vQuery = supabase.from("visa_applications").select("id, payment_status");
          if (visaAppId) {
            vQuery = vQuery.eq("id", visaAppId);
          } else if (session.id) {
            vQuery = vQuery.eq("stripe_session_id", session.id);
          }

          const { data: vApp } = await vQuery.maybeSingle();
          if (vApp && vApp.payment_status === "pending") {
            await supabase
              .from("visa_applications")
              .update({
                payment_status: "failed",
                internal_notes: "Stripe checkout session expired before payment completion.",
                updated_at: new Date().toISOString(),
              })
              .eq("id", vApp.id);
          }
        }

        // 2. Handle eSIM checkout session expiration
        let query = supabase.from("esim_orders").select("id, payment_status");
        if (orderId) {
          query = query.eq("id", orderId);
        } else if (session.id) {
          query = query.eq("stripe_session_id", session.id);
        }

        const { data: order } = await query.maybeSingle();
        if (order && order.payment_status === "pending") {
          await supabase
            .from("esim_orders")
            .update({
              payment_status: "failed",
              error: "Checkout session expired before payment completion.",
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const visaAppId = (paymentIntent.metadata?.application_id as string) || (paymentIntent.metadata?.type === "visa" ? (paymentIntent.metadata?.client_reference_id as string) : null);
        const orderId = (paymentIntent.metadata?.order_id as string) || null;

        // 1. Handle Visa application payment failure
        if (visaAppId || paymentIntent.metadata?.type === "visa") {
          let vQuery = supabase.from("visa_applications").select("id");
          if (visaAppId) {
            vQuery = vQuery.eq("id", visaAppId);
          } else {
            vQuery = vQuery.eq("stripe_payment_intent_id", paymentIntent.id);
          }

          const { data: vApp } = await vQuery.maybeSingle();
          if (vApp) {
            await supabase
              .from("visa_applications")
              .update({
                payment_status: "failed",
                internal_notes: `Payment failed: ${paymentIntent.last_payment_error?.message || "Payment intent failed"}`,
                updated_at: new Date().toISOString(),
              })
              .eq("id", vApp.id);
          }
        }

        // 2. Handle eSIM order payment failure
        let query = supabase.from("esim_orders").select("id");
        if (orderId) {
          query = query.eq("id", orderId);
        } else {
          query = query.eq("stripe_payment_intent", paymentIntent.id);
        }

        const { data: order } = await query.maybeSingle();
        if (order) {
          await supabase
            .from("esim_orders")
            .update({
              payment_status: "failed",
              error: paymentIntent.last_payment_error?.message || "Payment intent failed.",
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
        const refundAmount = (charge.amount_refunded ?? 0) / 100;
        const currency = (charge.currency || "usd").toUpperCase();

        if (paymentIntentId) {
          // 1. Check Visa applications
          const { data: visaApp } = await supabase
            .from("visa_applications")
            .select("id, reference_no, primary_contact_name, primary_contact_email, product_title")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .maybeSingle();

          if (visaApp) {
            await supabase
              .from("visa_applications")
              .update({
                payment_status: "refunded",
                updated_at: new Date().toISOString(),
              })
              .eq("id", visaApp.id);

            after(async () => {
              try {
                await sendRefundNotification({
                  serviceType: "visa",
                  referenceNo: visaApp.reference_no,
                  customerName: visaApp.primary_contact_name,
                  customerEmail: visaApp.primary_contact_email,
                  serviceName: `${visaApp.product_title} Visa`,
                  refundAmount,
                  currency,
                });
              } catch (e) {
                console.error("[stripe-webhook] Error sending visa refund email:", e);
              }
            });
          }

          // 2. Check Transfer bookings
          const { data: trfBooking } = await supabase
            .from("transfer_bookings")
            .select("id, booking_ref, customer_name, customer_email, route_name")
            .eq("stripe_payment_intent", paymentIntentId)
            .maybeSingle();

          if (trfBooking) {
            await supabase
              .from("transfer_bookings")
              .update({
                payment_status: "refunded",
                booking_status: "cancelled",
                updated_at: new Date().toISOString(),
              })
              .eq("id", trfBooking.id);

            after(async () => {
              try {
                await sendRefundNotification({
                  serviceType: "transport",
                  referenceNo: trfBooking.booking_ref,
                  customerName: trfBooking.customer_name,
                  customerEmail: trfBooking.customer_email,
                  serviceName: trfBooking.route_name,
                  refundAmount,
                  currency,
                });
              } catch (e) {
                console.error("[stripe-webhook] Error sending transfer refund email:", e);
              }
            });
          }
        }
        break;
      }

      default:
        // Other events: acknowledged and marked processed
        break;
    }

    // Mark event processed
    await supabase
      .from("esim_webhook_events")
      .update({ processed: true })
      .eq("source", "payment")
      .eq("external_id", event.id);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error processing webhook";
    console.error("Error executing webhook handler:", errorMsg);
    // Return 200 to Stripe to avoid endless retries if our internal processing encountered an unhandled exception
    return NextResponse.json({ received: true, error: errorMsg }, { status: 200 });
  }
}
