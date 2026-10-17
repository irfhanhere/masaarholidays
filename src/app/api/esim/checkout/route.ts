import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { getSiteOrigin } from "@/lib/site-url";
import { isEsimVatEnabled, getEsimVatPct, getVatTrn, calculateVatMinor } from "@/lib/vat";
import { verifyEsimAccess, ESIM_PREVIEW_COOKIE_NAME } from "@/lib/esim-launch-server";
import {
  calculateEsimCharge,
  normalizeChargeCurrency,
  type AllowedChargeCurrency,
} from "@/lib/esim-fx";

export const dynamic = "force-dynamic";

// In-memory sliding rate limiter: max 10 requests per 10 minutes per IP
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Periodically clean up entries
  if (ipRateLimitMap.size > 500) {
    for (const [k, v] of ipRateLimitMap.entries()) {
      if (now > v.resetAt) ipRateLimitMap.delete(k);
    }
  }

  const entry = ipRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  entry.count += 1;
  return true;
}

/**
 * Generates partner_ref = 'MH-' + 10 random uppercase alphanumerics
 */
function generatePartnerRef(): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(10);
  let ref = "MH-";
  for (let i = 0; i < 10; i++) {
    ref += alphabet[bytes[i] % alphabet.length];
  }
  return ref;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  // 1. Launch flag access gate: block API when launch mode is off unless preview cookie is set
  const previewCookie = request.cookies.get(ESIM_PREVIEW_COOKIE_NAME)?.value;
  const hasAccess = await verifyEsimAccess({ cookieValue: previewCookie });
  if (!hasAccess) {
    return NextResponse.json(
      { error: "eSIM checkout is currently unavailable." },
      { status: 404 }
    );
  }

  // 2. Rate limiting per IP
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  // 3. Parse and validate body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  // Honeypot check: bot protection
  const honeypot = body.website || body.company || body.hp;
  if (honeypot && typeof honeypot === "string" && honeypot.trim().length > 0) {
    // Return standard success to drop bots without action
    return NextResponse.json({ url: "/esim" }, { status: 200 });
  }

  const planId = typeof body.planId === "string" ? body.planId.trim() : "";
  const quantity = typeof body.quantity === "number" ? Math.floor(body.quantity) : 1;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const confirmEmail =
    typeof body.confirmEmail === "string" ? body.confirmEmail.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  // Validate charge currency against allow-list (fallback AED)
  const chargeCurrency: AllowedChargeCurrency = normalizeChargeCurrency(
    typeof body.currency === "string" ? body.currency : null
  );

  const termsAccepted = Boolean(body.termsAccepted);
  const deviceUnlockedAccepted = Boolean(body.deviceUnlockedAccepted);
  const refundDataOnlyAccepted = Boolean(body.refundDataOnlyAccepted);

  if (!planId) {
    return NextResponse.json({ error: "Please select an eSIM plan." }, { status: 400 });
  }

  if (quantity < 1 || quantity > 5) {
    return NextResponse.json({ error: "Quantity must be between 1 and 5." }, { status: 400 });
  }

  if (!fullName || fullName.length < 2 || fullName.length > 100) {
    return NextResponse.json(
      { error: "Please enter your full name (between 2 and 100 characters)." },
      { status: 400 }
    );
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  if (email !== confirmEmail) {
    return NextResponse.json({ error: "Email addresses do not match." }, { status: 400 });
  }

  if (!termsAccepted || !deviceUnlockedAccepted || !refundDataOnlyAccepted) {
    return NextResponse.json(
      {
        error:
          "You must confirm eSIM device compatibility, data-only terms, and accept the Terms & Privacy Policy.",
      },
      { status: 400 }
    );
  }

  // 4. Re-read plan from DB server-side (NEVER trust client prices)
  const supabase = createAdminClient();

  const { data: plan, error: planError } = await supabase
    .from("esim_plans")
    .select(
      "plan_id, name, sale_price_usd, data_gb, validity_days, is_unlimited, is_active, plan_kind"
    )
    .eq("plan_id", planId)
    .maybeSingle();

  if (planError || !plan) {
    return NextResponse.json(
      { error: "The selected eSIM plan could not be found or is unavailable." },
      { status: 404 }
    );
  }

  if (!plan.is_active || plan.plan_kind !== "data") {
    return NextResponse.json(
      { error: "The selected eSIM plan is currently inactive." },
      { status: 400 }
    );
  }

  // 5. Calculate charge amount using dedicated eSIM FX module
  // Applies pegged rates for AED/SAR/USD, live market rates with 2% buffer for EUR/GBP/INR,
  // and enforces the 3-day staleness guard.
  let chargeCalc;
  try {
    chargeCalc = await calculateEsimCharge(
      Number(plan.sale_price_usd),
      quantity,
      chargeCurrency
    );
  } catch (fxErr: unknown) {
    const msg = fxErr instanceof Error ? fxErr.message : "Exchange rate calculation failed.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const expectedAmountMinor = chargeCalc.expectedAmountMinor;
  const unitAmountMinor = Math.round(expectedAmountMinor / quantity);
  const fxRate = chargeCalc.fxRate;
  const fxRateAt = chargeCalc.fxRateAt;
  const amountUsd = chargeCalc.totalUsd;

  // VAT calculations (price is VAT-inclusive when enabled)
  const vatEnabled = isEsimVatEnabled();
  const vatPct = getEsimVatPct();
  const vatTrn = getVatTrn();
  const { vatMinor } = vatEnabled ? calculateVatMinor(expectedAmountMinor, vatPct) : { vatMinor: 0 };

  // 6. Generate unique partner_ref and reference ID for error tracking
  const partnerRef = generatePartnerRef();
  const nowIso = new Date().toISOString();
  const errorRefId = `ERR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  const orderPayload = {
    partner_ref: partnerRef,
    customer_name: fullName,
    customer_email: email,
    customer_phone: phone || null,
    plan_id: plan.plan_id,
    quantity,
    amount_usd: amountUsd,
    currency: chargeCurrency,
    charge_currency: chargeCurrency.toLowerCase(),
    expected_amount_minor: expectedAmountMinor,
    fx_rate: fxRate,
    fx_rate_at: fxRateAt,
    payment_provider: "stripe",
    payment_status: "pending" as const,
    fulfilment_status: "pending" as const,
    terms_accepted_at: nowIso,
    vat_amount_minor: vatMinor,
    vat_rate_pct: vatEnabled ? vatPct : 5.0,
    vat_trn: vatEnabled ? vatTrn : null,
  };

  let { data: order, error: orderErr } = await supabase
    .from("esim_orders")
    .insert(orderPayload)
    .select("id, public_token, partner_ref")
    .single();

  if (orderErr) {
    // Log the real Supabase error server-side (message, code, details, hint; never secrets or card data)
    console.error(`[esim-checkout][ref:${errorRefId}] Supabase insert failed:`, {
      code: orderErr.code,
      message: orderErr.message,
      details: orderErr.details,
      hint: orderErr.hint,
    });

    // If PostgREST schema cache error (PGRST204), attempt defensive fallback with core columns
    if (orderErr.code === "PGRST204") {
      console.warn(
        `[esim-checkout][ref:${errorRefId}] Retrying insert with core columns due to schema cache mismatch (migration 0086 pending).`
      );
      const corePayload = {
        partner_ref: partnerRef,
        customer_name: fullName,
        customer_email: email,
        customer_phone: phone || null,
        plan_id: plan.plan_id,
        quantity,
        amount_usd: amountUsd,
        currency: chargeCurrency,
        charge_currency: chargeCurrency.toLowerCase(),
        expected_amount_minor: expectedAmountMinor,
        payment_provider: "stripe",
        payment_status: "pending" as const,
        fulfilment_status: "pending" as const,
        terms_accepted_at: nowIso,
      };

      const retryRes = await supabase
        .from("esim_orders")
        .insert(corePayload)
        .select("id, public_token, partner_ref")
        .single();

      if (!retryRes.error && retryRes.data) {
        order = retryRes.data;
        orderErr = null;
      } else {
        console.error(`[esim-checkout][ref:${errorRefId}] Core retry insert also failed:`, {
          code: retryRes.error?.code,
          message: retryRes.error?.message,
          details: retryRes.error?.details,
        });
      }
    }
  }

  if (orderErr || !order) {
    return NextResponse.json(
      {
        error: "Failed to initialize order record. Please try again.",
        referenceId: errorRefId,
      },
      { status: 500 }
    );
  }

  // 7. Create Stripe Checkout Session in the selected charge currency
  let stripe;
  try {
    stripe = getStripe();
  } catch (stripeInitErr) {
    const msg = stripeInitErr instanceof Error ? stripeInitErr.message : "Stripe not configured";
    console.error("Stripe initialization error:", msg);
    return NextResponse.json(
      { error: "Stripe payment integration is not configured on this server." },
      { status: 503 }
    );
  }

  const siteOrigin = getSiteOrigin();
  const successUrl = `${siteOrigin}/esim/order/${order.public_token}`;
  const cancelUrl = `${siteOrigin}/esim/checkout/${encodeURIComponent(plan.plan_id)}`;

  const planDataLabel = plan.is_unlimited ? "Unlimited Data" : `${plan.data_gb} GB`;
  const lineItemDescription = `${planDataLabel} · ${plan.validity_days} Days · High-Speed Prepaid eSIM`;
  const stripeCurrency = chargeCurrency.toLowerCase();

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        currency: stripeCurrency,
        // Disable Stripe adaptive pricing so Stripe does not convert a second time
        adaptive_pricing: { enabled: false },
        customer_email: email,
        client_reference_id: order.id,
        metadata: {
          order_id: order.id,
          partner_ref: order.partner_ref,
          plan_id: plan.plan_id,
          charge_currency: stripeCurrency,
        },
        line_items: [
          {
            price_data: {
              currency: stripeCurrency,
              unit_amount: unitAmountMinor,
              product_data: {
                name: plan.name,
                description: lineItemDescription,
              },
            },
            quantity,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
      {
        idempotencyKey: `order_${order.id}`,
      }
    );

    // Save stripe_session_id in DB
    await supabase
      .from("esim_orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    if (!session.url) {
      throw new Error("Stripe did not return a checkout session URL.");
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (stripeErr: unknown) {
    const errorMsg = stripeErr instanceof Error ? stripeErr.message : "Stripe checkout session failed";
    console.error("Stripe Checkout Session creation failed:", errorMsg);

    // Mark order failed
    await supabase
      .from("esim_orders")
      .update({
        payment_status: "failed",
        error: errorMsg,
      })
      .eq("id", order.id);

    return NextResponse.json(
      { error: "Unable to initiate payment session. Please check payment settings and try again." },
      { status: 502 }
    );
  }
}

