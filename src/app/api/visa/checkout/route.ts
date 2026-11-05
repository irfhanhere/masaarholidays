import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import {
  createTabbyCheckoutSession,
  convertUsdToTabbyCurrency,
  isTabbyCheckoutEnabled,
  getTabbyConfig,
} from "@/lib/tabby";
import { getSiteOrigin } from "@/lib/site-url";
import { getVisaProductById, calculateVisaPricing } from "@/lib/data/visa";

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

function generateReferenceNo(visaSlug: string): string {
  const alphabet = "0123456789";
  const bytes = crypto.randomBytes(6);
  let num = "";
  for (let i = 0; i < 6; i++) {
    num += alphabet[bytes[i] % alphabet.length];
  }
  const year = new Date().getFullYear();
  if (visaSlug === "uae") return `MH-UV-${year}-${num}`;
  if (visaSlug === "saudi-tourist") return `MH-SV-${year}-${num}`;
  if (visaSlug === "us") return `MH-US-${year}-${num}`;
  return `MH-VSA-${year}-${num}`;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: "Too many application attempts. Please try again shortly." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const visaSlug = typeof body.visaSlug === "string" ? body.visaSlug.trim().toLowerCase() : "uae";
  const productId = typeof body.productId === "string" ? body.productId.trim() : "";
  const paymentGateway = typeof body.paymentGateway === "string" && body.paymentGateway.trim().toLowerCase() === "tabby" ? "tabby" : "stripe";
  const nationality = typeof body.nationality === "string" ? body.nationality.trim() : "";
  const countryOfResidence = typeof body.countryOfResidence === "string" ? body.countryOfResidence.trim() : "";
  const travelDate = typeof body.travelDate === "string" ? body.travelDate.trim() : "";
  const purposeOfVisit = typeof body.purposeOfVisit === "string" ? body.purposeOfVisit.trim() : "Tourism / Visit";
  const durationOfStay = typeof body.durationOfStay === "string" ? body.durationOfStay.trim() : "";

  const primaryContact = (body.primaryContact as Record<string, string>) || {};
  const email = (primaryContact.email || "").trim().toLowerCase();
  const phone = (primaryContact.phone || "").trim();

  const residentialAddress = (body.residentialAddress as Record<string, string>) || {};

  const rawApplicants = Array.isArray(body.applicants) ? body.applicants : [];
  if (rawApplicants.length === 0) {
    return NextResponse.json({ error: "At least one traveller is required." }, { status: 400 });
  }

  const primaryApplicantName = typeof rawApplicants[0]?.fullName === "string" ? rawApplicants[0].fullName.trim() : "";
  if (!primaryApplicantName || primaryApplicantName.length < 2) {
    return NextResponse.json({ error: "Please provide the traveller's full name." }, { status: 400 });
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  if (!phone || phone.length < 6) {
    return NextResponse.json({ error: "Please provide a valid phone or WhatsApp number." }, { status: 400 });
  }

  // 1. Eligibility validation for Saudi Tourist Visa (if nationality explicitly provided)
  if (visaSlug === "saudi-tourist") {
    for (let i = 0; i < rawApplicants.length; i++) {
      const app = rawApplicants[i];
      const appNat = (typeof app?.nationality === "string" ? app.nationality : nationality).trim().toLowerCase();

      if (appNat && appNat !== "not specified" && appNat !== "uae resident" && appNat !== "other") {
        const isIndianOrPakistani = appNat === "india" || appNat === "pakistan" || appNat === "indian" || appNat === "pakistani";
        if (!isIndianOrPakistani) {
          return NextResponse.json(
            {
              error:
                "Currently, online checkout for this Saudi Visa service is available to eligible UAE residents. Please contact our team on WhatsApp for other nationalities.",
            },
            { status: 400 }
          );
        }
      }
    }
  }

  // 2. Server-side product price retrieval & single product enforcement
  let product = await getVisaProductById(productId);
  if (visaSlug === "saudi-tourist") {
    // Strictly enforce the single approved Saudi Tourist Visa product
    if (!product || !product.is_active || product.visa_type_slug !== "saudi-tourist") {
      product = await getVisaProductById("c7f1a920-5a0d-4001-8b01-750000000001");
    }
  }
  if (!product || !product.is_active) {
    return NextResponse.json({ error: "Selected visa package is unavailable." }, { status: 404 });
  }

  // 3. Strict Server-Side Price Calculation
  const pricing = calculateVisaPricing(product, rawApplicants.length);
  const isSaudi = visaSlug === "saudi-tourist" || product.currency === "AED";
  const checkoutCurrency = isSaudi ? "AED" : "USD";
  const chargedAmountMinor = Math.round(pricing.totalAmount * 100);

  // Tabby uses UAE merchant account mhae (AED only; never send SAR)
  const tabbyTargetCurrency: "AED" = "AED";
  const tabbyConverted = isSaudi
    ? {
        amount: pricing.totalAmount, // AED 750 * applicants
        currency: "AED" as const,
        rate: 1,
        installmentAmount: Math.round((pricing.totalAmount / 4) * 100) / 100,
      }
    : convertUsdToTabbyCurrency(pricing.totalAmount, "AED");

  const referenceNo = generateReferenceNo(visaSlug);
  const trackingToken = crypto.randomBytes(24).toString("hex");
  const siteOrigin = getSiteOrigin();

  const supabase = createAdminClient();

  const initialTimeline = [
    {
      step: "payment_received",
      timestamp: new Date().toISOString(),
      status: "pending" as const,
      note: "Awaiting secure checkout payment confirmation",
    },
    {
      step: "application_under_review",
      timestamp: new Date().toISOString(),
      status: "pending" as const,
      note: "Specialist review of applicant documents and eligibility",
    },
    {
      step: "submitted_to_authorities",
      timestamp: new Date().toISOString(),
      status: "pending" as const,
      note: "Official visa filing with destination immigration department",
    },
    {
      step: "visa_approval",
      timestamp: new Date().toISOString(),
      status: "pending" as const,
      note: "Government visa decision and grant notice",
    },
    {
      step: "visa_delivered",
      timestamp: new Date().toISOString(),
      status: "pending" as const,
      note: "Electronic visa delivery to applicant email & WhatsApp",
    },
  ];

  // 3. Create Visa Application Record in Supabase
  let applicationId: string = crypto.randomUUID();
  try {
    const { data: appRow, error: appErr } = await supabase
      .from("visa_applications")
      .insert({
        id: applicationId,
        reference_no: referenceNo,
        tracking_token: trackingToken,
        visa_type_slug: visaSlug,
        product_id: product.id.startsWith("uae-") || product.id.startsWith("saudi-") || product.id.startsWith("us-") ? null : product.id,
        product_title: product.title,
        applicant_count: rawApplicants.length,
        primary_contact_name: primaryApplicantName,
        primary_contact_email: email,
        primary_contact_phone: phone,
        nationality: nationality || (rawApplicants[0]?.nationality as string) || "Not Specified",
        country_of_residence: countryOfResidence || (rawApplicants[0]?.countryOfResidence as string) || "Not Specified",
        travel_date: travelDate || null,
        purpose_of_visit: purposeOfVisit || null,
        duration_of_stay: durationOfStay || product.duration,
        residential_address: residentialAddress,
        fee_breakdown: {
          visa_fee: pricing.visaFeeTotal,
          service_fee: pricing.serviceFeeTotal,
          processing_fee: pricing.processingFeeTotal,
          subtotal: pricing.subtotalAmount,
          discount_amount: pricing.discountAmount,
          discount_percent: pricing.discountPercent,
          total: pricing.totalAmount,
          currency: pricing.currency,
        },
        total_amount: pricing.totalAmount,
        currency: pricing.currency,
        payment_gateway: paymentGateway,
        charged_currency: paymentGateway === "tabby" ? "AED" : checkoutCurrency,
        charged_amount: paymentGateway === "tabby" ? tabbyConverted.amount : pricing.totalAmount,
        payment_status: "pending",
        application_status: "draft",
        status_timeline: initialTimeline,
      })
      .select("id")
      .single();

    if (appErr) {
      console.warn("[visa-checkout] Error inserting application row, using generated id:", appErr.message);
    } else if (appRow?.id) {
      applicationId = appRow.id;
    }
  } catch (err) {
    console.warn("[visa-checkout] Insert visa_applications error:", err);
  }

  // 4. Insert applicants
  try {
    const applicantRows = rawApplicants.map((a: Record<string, unknown>, idx: number) => ({
      application_id: applicationId,
      applicant_number: idx + 1,
      full_name: (typeof a.fullName === "string" ? a.fullName.trim() : `Applicant ${idx + 1}`),
      date_of_birth: (typeof a.dateOfBirth === "string" ? a.dateOfBirth.trim() : "1990-01-01"),
      gender: (typeof a.gender === "string" ? a.gender.trim() : "Other"),
      nationality: (typeof a.nationality === "string" && a.nationality.trim() ? a.nationality.trim() : nationality || "UAE Resident"),
      country_of_residence: (typeof a.countryOfResidence === "string" && a.countryOfResidence.trim() ? a.countryOfResidence.trim() : countryOfResidence || "United Arab Emirates"),
      passport_number: (typeof a.passportNumber === "string" && a.passportNumber.trim() ? a.passportNumber.trim() : "SEE_ATTACHED_DOC"),
      passport_issue_date: (typeof a.passportIssueDate === "string" && a.passportIssueDate.trim() ? a.passportIssueDate.trim() : "N/A"),
      passport_expiry_date: (typeof a.passportExpiryDate === "string" && a.passportExpiryDate.trim() ? a.passportExpiryDate.trim() : "2030-01-01"),
      place_of_issue: (typeof a.placeOfIssue === "string" && a.placeOfIssue.trim() ? a.placeOfIssue.trim() : "N/A"),
    }));

    await supabase.from("visa_applicants").insert(applicantRows);
  } catch (err) {
    console.warn("[visa-checkout] Insert visa_applicants error:", err);
  }

  // 5. Insert uploaded documents
  const uploadedDocs = Array.isArray(body.uploadedDocuments) ? body.uploadedDocuments : [];
  if (uploadedDocs.length > 0) {
    try {
      const docRows = uploadedDocs.map((d: Record<string, unknown>) => ({
        application_id: applicationId,
        document_type: (typeof d.documentType === "string" ? d.documentType : "document"),
        file_path: (typeof d.filePath === "string" ? d.filePath : "unknown"),
        file_name: (typeof d.fileName === "string" ? d.fileName : "document.pdf"),
        file_size: (typeof d.fileSize === "number" ? d.fileSize : 0),
        mime_type: (typeof d.mimeType === "string" ? d.mimeType : "application/pdf"),
        verification_status: "pending" as const,
      }));

      await supabase.from("visa_application_documents").insert(docRows);
    } catch (err) {
      console.warn("[visa-checkout] Insert visa_application_documents error:", err);
    }
  }

  // 6. Create Payment Checkout Session (Tabby or Stripe)
  const discountNote = pricing.discountAmount > 0 ? ` · Includes 5% Online Discount (-$${pricing.discountAmount.toFixed(2)})` : "";
  const itemDescription = `${product.subtitle || visaSlug.toUpperCase() + " Visa"} · Reference: ${referenceNo}${discountNote}`;

  // Tabby Payment Gateway Branch
  if (paymentGateway === "tabby") {
    if (!isTabbyCheckoutEnabled()) {
      return NextResponse.json(
        { error: "Tabby Pay in 4 is currently unavailable. Please select card payment to complete your checkout." },
        { status: 400 }
      );
    }

    const successUrl = `${siteOrigin}/visa/application/${trackingToken}?payment_id={payment_id}&tabby=1`;
    const cancelUrl = `${siteOrigin}/visa/${encodeURIComponent(visaSlug)}/apply?product=${product.id}&cancelled=1`;
    const failureUrl = `${siteOrigin}/visa/${encodeURIComponent(visaSlug)}/apply?product=${product.id}&failed=1`;

    try {
      const tabbySession = await createTabbyCheckoutSession({
        amount: tabbyConverted.amount,
        currency: tabbyTargetCurrency,
        description: `Masaar Holidays: ${product.title} (${referenceNo})`,
        referenceId: referenceNo,
        buyer: {
          name: primaryApplicantName,
          email,
          phone,
          dob: typeof rawApplicants[0]?.dateOfBirth === "string" ? rawApplicants[0].dateOfBirth : undefined,
        },
        items: [
          {
            title: `${product.title} (${visaSlug.toUpperCase()})`,
            description: itemDescription,
            quantity: 1,
            unitPrice: tabbyConverted.amount,
            category: "Visa Services",
            referenceId: product.id,
          },
        ],
        successUrl,
        cancelUrl,
        failureUrl,
        shippingAddress: {
          city: residentialAddress.city || "Dubai",
          address: residentialAddress.street || "Customer Residence",
          zip: residentialAddress.postalCode || "00000",
        },
      });

      // Update application with Tabby session & payment IDs
      try {
        await supabase
          .from("visa_applications")
          .update({
            tabby_session_id: tabbySession.sessionId,
            tabby_payment_id: tabbySession.paymentId,
          })
          .eq("id", applicationId);
      } catch (saveErr) {
        console.warn("[visa-checkout] Error saving tabby session id:", saveErr);
      }

      return NextResponse.json({
        url: tabbySession.webUrl,
        referenceNo,
        trackingToken,
        paymentGateway: "tabby",
        chargedAmount: tabbyConverted.amount,
        chargedCurrency: tabbyTargetCurrency,
        installmentAmount: tabbyConverted.installmentAmount,
      });
    } catch (tabbyErr: unknown) {
      const msg = tabbyErr instanceof Error ? tabbyErr.message : "Tabby checkout initialization failed";
      console.error("[visa-checkout] Tabby session creation failed:", msg);
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  // 6b. Preserved Stripe Checkout Session Branch
  let stripe;
  try {
    stripe = getStripe();
  } catch (stripeErr) {
    console.error("Stripe initialization error:", stripeErr);
    return NextResponse.json({ error: "Payment gateway is currently unavailable." }, { status: 500 });
  }

  const stripeSuccessUrl = `${siteOrigin}/visa/application/${trackingToken}?session_id={CHECKOUT_SESSION_ID}&paid=1`;
  const stripeCancelUrl = `${siteOrigin}/visa/${encodeURIComponent(visaSlug)}/apply?product=${product.id}&cancelled=1`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: checkoutCurrency.toLowerCase(),
      customer_email: email,
      client_reference_id: applicationId,
      metadata: {
        type: "visa",
        application_id: applicationId,
        reference_no: referenceNo,
        tracking_token: trackingToken,
        visa_slug: visaSlug,
        applicant_count: String(pricing.applicantCount),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: checkoutCurrency.toLowerCase(),
            unit_amount: chargedAmountMinor,
            product_data: {
              name: `Masaar Holidays: ${product.title}`,
              description: itemDescription,
            },
          },
        },
      ],
      success_url: stripeSuccessUrl,
      cancel_url: stripeCancelUrl,
    });

    // Save session ID on application
    try {
      await supabase
        .from("visa_applications")
        .update({ stripe_session_id: session.id })
        .eq("id", applicationId);
    } catch {
      // non-fatal
    }

    return NextResponse.json({
      url: session.url,
      referenceNo,
      trackingToken,
      paymentGateway: "stripe",
      chargedAmount: pricing.totalAmount,
      chargedCurrency: checkoutCurrency,
    });
  } catch (stripeErr: unknown) {
    const msg = stripeErr instanceof Error ? stripeErr.message : "Stripe checkout session failed";
    console.error("[visa-checkout] Stripe session creation failed:", msg);
    return NextResponse.json({ error: `Payment gateway error: ${msg}` }, { status: 500 });
  }
}
