import { NextRequest, NextResponse, after } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { fulfilEsimOrder } from "@/lib/esim-fulfilment";
import { fulfilTransferBooking } from "@/lib/transfer-fulfilment";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
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
    console.warn("Stripe webhook signature verification failed:", msg);
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

        // 2. Handle eSIM order payment
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
        const orderId = (paymentIntent.metadata?.order_id as string) || null;

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
