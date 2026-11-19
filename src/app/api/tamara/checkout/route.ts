import { NextRequest, NextResponse } from "next/server";
import {
  createTamaraCheckoutSession,
  isTamaraCheckoutEnabled,
  convertUsdToTamaraCurrency,
  type TamaraCheckoutParams,
  type TamaraSupportedCurrency,
} from "@/lib/tamara";
import { getSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/**
 * Universal Tamara Checkout Session API
 *
 * Validates request payload server-side and creates an official Tamara Checkout session.
 */
export async function POST(request: NextRequest) {
  if (!isTamaraCheckoutEnabled()) {
    return NextResponse.json(
      { error: "Tamara Buy Now, Pay Later is currently unavailable. Please choose card payment." },
      { status: 400 }
    );
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    orderReferenceId,
    amount,
    currency = "AED",
    description,
    countryCode = "AE",
    consumer,
    items,
    successUrl,
    failureUrl,
    cancelUrl,
  } = body;

  if (!orderReferenceId || typeof orderReferenceId !== "string") {
    return NextResponse.json({ error: "Missing required orderReferenceId" }, { status: 400 });
  }

  const numAmount = typeof amount === "number" ? amount : Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
  }

  const upperCurrency = String(currency).toUpperCase() as TamaraSupportedCurrency;
  if (upperCurrency !== "AED" && upperCurrency !== "SAR") {
    return NextResponse.json({ error: "Tamara only supports AED and SAR currencies" }, { status: 400 });
  }

  if (!consumer || !consumer.email || !consumer.phone_number) {
    return NextResponse.json({ error: "Missing required consumer email and phone number" }, { status: 400 });
  }

  const siteOrigin = getSiteOrigin();
  const defaultNotificationUrl = `${siteOrigin}/api/tamara/webhook`;

  try {
    const params: TamaraCheckoutParams = {
      orderReferenceId,
      amount: numAmount,
      currency: upperCurrency,
      description: description || `Masaar Holidays Booking ${orderReferenceId}`,
      countryCode: countryCode === "SA" ? "SA" : "AE",
      consumer: {
        first_name: consumer.first_name || "Guest",
        last_name: consumer.last_name || "Pilgrim",
        email: consumer.email.toLowerCase().trim(),
        phone_number: consumer.phone_number,
      },
      items: Array.isArray(items) && items.length > 0 ? items : [
        {
          reference_id: "item-1",
          type: "digital",
          name: description || "Masaar Pilgrimage Service",
          sku: orderReferenceId,
          quantity: 1,
          unit_price: { amount: numAmount, currency: upperCurrency },
          total_amount: { amount: numAmount, currency: upperCurrency },
        },
      ],
      successUrl: successUrl || `${siteOrigin}/api/tamara/status?orderReferenceId=${encodeURIComponent(orderReferenceId)}&status=success`,
      failureUrl: failureUrl || `${siteOrigin}/api/tamara/status?orderReferenceId=${encodeURIComponent(orderReferenceId)}&status=failure`,
      cancelUrl: cancelUrl || `${siteOrigin}/api/tamara/status?orderReferenceId=${encodeURIComponent(orderReferenceId)}&status=cancel`,
      notificationUrl: defaultNotificationUrl,
    };

    const session = await createTamaraCheckoutSession(params);
    return NextResponse.json(session, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to initialize Tamara checkout session";
    console.error("[tamara-checkout-route] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
