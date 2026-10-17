import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { getSiteOrigin } from "@/lib/site-url";
import { getPublicTransferBySlug } from "@/lib/data/transfers";

export const dynamic = "force-dynamic";

// In-memory sliding rate limiter: max 10 requests per 10 minutes per IP
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
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

function generateBookingRef(): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(6);
  let ref = "MH-TRF-";
  for (let i = 0; i < 6; i++) {
    ref += alphabet[bytes[i] % alphabet.length];
  }
  return ref;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_CHARGE_CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "INR"] as const;

export async function POST(request: NextRequest) {
  // 1. Rate limiting per IP
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  // 2. Parse and validate body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const routeSlug = typeof body.routeSlug === "string" ? body.routeSlug.trim() : "";
  const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId.trim() : "";
  const travelDate = typeof body.travelDate === "string" ? body.travelDate.trim() : "";
  const pickupTime = typeof body.pickupTime === "string" ? body.pickupTime.trim() : "";
  const passengers = typeof body.passengers === "number" ? Math.floor(body.passengers) : 1;
  const luggage = typeof body.luggage === "string" ? body.luggage.trim() : "0";
  const flightNumber = typeof body.flightNumber === "string" ? body.flightNumber.trim() : "";
  const pickupLocation = typeof body.pickupLocation === "string" ? body.pickupLocation.trim() : "";
  const dropoffLocation = typeof body.dropoffLocation === "string" ? body.dropoffLocation.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  const rawCurrency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "AED";
  const chargeCurrency = (ALLOWED_CHARGE_CURRENCIES as readonly string[]).includes(rawCurrency)
    ? rawCurrency
    : "AED";

  // Validate required contact fields
  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!phone || phone.length < 6) {
    return NextResponse.json({ error: "Please enter a valid phone or WhatsApp number for driver coordination." }, { status: 400 });
  }

  if (!routeSlug || !vehicleId || !travelDate || !pickupTime) {
    return NextResponse.json({ error: "Please complete all required journey details." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 3. Verify Route and Vehicle using canonical enriched catalog
  const route = await getPublicTransferBySlug(routeSlug);
  if (!route || !route.is_active) {
    return NextResponse.json({ error: "Transfer route not found or currently inactive." }, { status: 404 });
  }

  const selectedVehicle = route.availableVehicles.find(
    (v) => (v.vehicleId === vehicleId || v.vehicleSlug === vehicleId) && v.isActive && v.priceAed > 0
  );

  if (!selectedVehicle) {
    return NextResponse.json({ error: "Selected vehicle not found or currently unavailable for this route." }, { status: 404 });
  }

  // Check passenger capacity
  if (passengers > selectedVehicle.passengerCapacity) {
    return NextResponse.json(
      { error: `The selected ${selectedVehicle.vehicleName} accommodates up to ${selectedVehicle.passengerCapacity} passengers.` },
      { status: 400 }
    );
  }

  const priceAed = selectedVehicle.priceAed;

  // 4. Currency conversion to charge currency
  let fxRate = 1.0;
  if (chargeCurrency !== "AED") {
    try {
      const { data: ratesData } = await supabase
        .from("currency_rates")
        .select("currency_code, rate_to_aed");

      const rateMap: Record<string, number> = {};
      for (const row of ratesData || []) {
        if (row.currency_code && row.rate_to_aed != null) {
          rateMap[row.currency_code.toUpperCase()] = Number(row.rate_to_aed);
        }
      }

      // In currency_rates, rate_to_aed is relative to 1 AED (e.g. USD is ~0.2723, SAR is ~1.02)
      // 1 AED = rate_to_aed of target currency
      if (rateMap[chargeCurrency] && rateMap[chargeCurrency] > 0) {
        fxRate = rateMap[chargeCurrency];
      } else if (chargeCurrency === "USD") {
        fxRate = 1 / 3.6725;
      } else if (chargeCurrency === "SAR") {
        fxRate = 3.75 / 3.6725;
      }
    } catch {
      if (chargeCurrency === "USD") fxRate = 1 / 3.6725;
      else if (chargeCurrency === "SAR") fxRate = 1.0;
    }
  }

  // Calculate charged amount in target currency
  const targetPrice = Math.round(priceAed * fxRate * 100) / 100;
  const chargedAmountMinor = Math.round(targetPrice * 100);

  const bookingRef = generateBookingRef();
  const siteOrigin = getSiteOrigin();

  // 5. Create Transfer Booking Record in Database
  const { data: booking, error: insertErr } = await supabase
    .from("transfer_bookings")
    .insert({
      booking_ref: bookingRef,
      customer_name: fullName,
      customer_email: email,
      customer_phone: phone,
      route_slug: route.slug,
      route_name: route.route_name,
      transfer_type: route.transfer_type || "airport",
      pickup_location: pickupLocation || route.pickupLocation || "Airport / Hotel",
      dropoff_location: dropoffLocation || route.dropoffLocation || "Hotel / Airport",
      duration_text: route.durationText,
      vehicle_id: selectedVehicle.vehicleId,
      vehicle_name: selectedVehicle.vehicleName,
      model_year: selectedVehicle.modelYear,
      travel_date: travelDate,
      pickup_time: pickupTime,
      passengers,
      suitcases: luggage,
      flight_number: flightNumber || null,
      special_requests: notes || null,
      price_aed: priceAed,
      charged_amount_minor: chargedAmountMinor,
      charge_currency: chargeCurrency,
      fx_rate: fxRate,
      payment_status: "pending",
      booking_status: "pending",
    })
    .select("id, public_token")
    .single();

  if (insertErr || !booking) {
    console.error("Failed to insert transfer booking record:", insertErr?.message);
    return NextResponse.json({ error: "Failed to initialize booking record." }, { status: 500 });
  }

  // 6. Create Stripe Checkout Session
  let stripe;
  try {
    stripe = getStripe();
  } catch (stripeErr) {
    console.error("Stripe initialization error:", stripeErr);
    return NextResponse.json({ error: "Payment gateway is currently unavailable." }, { status: 500 });
  }

  const successUrl = `${siteOrigin}/transfers/booking/success?token=${booking.public_token}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${siteOrigin}/transfers/${encodeURIComponent(route.slug)}`;
  const lineItemDescription = `${selectedVehicle.vehicleName} (${selectedVehicle.modelYear}) · ${travelDate} at ${pickupTime} · ${passengers} Passenger${passengers > 1 ? "s" : ""}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: chargeCurrency.toLowerCase(),
      adaptive_pricing: { enabled: false },
      customer_email: email,
      client_reference_id: booking.id,
      metadata: {
        type: "transfer",
        booking_id: booking.id,
        booking_ref: bookingRef,
        route_slug: route.slug,
        charge_currency: chargeCurrency.toLowerCase(),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: chargeCurrency.toLowerCase(),
            unit_amount: chargedAmountMinor,
            product_data: {
              name: `Private Transfer: ${route.route_name}`,
              description: lineItemDescription,
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // Save session ID on booking record
    await supabase
      .from("transfer_bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", booking.id);

    return NextResponse.json({
      url: session.url,
      bookingRef,
      token: booking.public_token,
    });
  } catch (stripeErr: unknown) {
    const msg = stripeErr instanceof Error ? stripeErr.message : "Stripe checkout session failed";
    console.error("Stripe session creation failed for transfer booking:", msg);
    return NextResponse.json({ error: `Payment gateway error: ${msg}` }, { status: 500 });
  }
}
