import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import {
  createTabbyCheckoutSession,
  isTabbyCheckoutEnabled,
} from "@/lib/tabby";
import { getSiteOrigin } from "@/lib/site-url";
import {
  calculateSaudiVisaPricing,
  isNationalityApproved,
  validateApplicantEligibility,
  DEFAULT_SAUDI_VISA_SETTINGS,
} from "@/lib/data/saudi-visa-settings";
import { getSaudiVisaSettings } from "@/lib/data/saudi-visa-settings-server";

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

function generateReferenceNo(): string {
  const alphabet = "0123456789";
  const bytes = crypto.randomBytes(6);
  let num = "";
  for (let i = 0; i < 6; i++) {
    num += alphabet[bytes[i] % alphabet.length];
  }
  const year = new Date().getFullYear();
  return `MH-SV-${year}-${num}`;
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

  const applicationType = body.applicationType === "family" ? "family" : "individual";
  const paymentGateway =
    typeof body.paymentGateway === "string" && body.paymentGateway.trim().toLowerCase() === "tabby"
      ? "tabby"
      : "stripe";

  const rawApplicants = Array.isArray(body.applicants) ? body.applicants : [];
  if (rawApplicants.length === 0) {
    return NextResponse.json({ error: "At least one applicant is required." }, { status: 400 });
  }

  if (applicationType === "individual" && rawApplicants.length > 1) {
    return NextResponse.json(
      { error: "Individual applications can only have 1 applicant." },
      { status: 400 }
    );
  }

  // 1. Primary Contact Validation
  const primaryContact = (body.primaryContact as Record<string, string>) || {};
  const email = (primaryContact.email || "").trim().toLowerCase();
  const phone = (primaryContact.phone || "").trim();

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "A valid contact email address is required." }, { status: 400 });
  }
  if (!phone || phone.length < 7) {
    return NextResponse.json({ error: "A valid contact phone number is required." }, { status: 400 });
  }

  // 2. Strict Server-Side Pricing Calculation
  const settings = await getSaudiVisaSettings();
  const pricing = calculateSaudiVisaPricing(rawApplicants.length, applicationType, settings);

  // 3. Validate Each Applicant Independently
  const manualReviewNationalities: string[] = [];
  for (let i = 0; i < rawApplicants.length; i++) {
    const a = rawApplicants[i] as Record<string, unknown>;
    const applicantIndex = i + 1;
    const fullName = typeof a.fullName === "string" ? a.fullName.trim() : "";
    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { error: `Applicant #${applicantIndex}: Full name is required (as shown on passport).` },
        { status: 400 }
      );
    }

    const nationality = typeof a.nationality === "string" ? a.nationality.trim() : "";
    if (!nationality) {
      return NextResponse.json(
        { error: `Applicant #${applicantIndex}: Passport nationality is required.` },
        { status: 400 }
      );
    }

    const passportNumber = typeof a.passportNumber === "string" ? a.passportNumber.trim() : "";
    if (!passportNumber || passportNumber.length < 5) {
      return NextResponse.json(
        { error: `Applicant #${applicantIndex}: Valid passport number is required.` },
        { status: 400 }
      );
    }

    const validation = validateApplicantEligibility(
      {
        fullName,
        nationality,
        passportNumber,
        passportExpiryDate: typeof a.passportExpiryDate === "string" ? a.passportExpiryDate.trim() : "",
        residenceExpiryDate: typeof a.residenceExpiryDate === "string" ? a.residenceExpiryDate.trim() : "",
        emiratesIdExpiryDate: typeof a.emiratesIdExpiryDate === "string" ? a.emiratesIdExpiryDate.trim() : "",
        emiratesIdNumber: typeof a.emiratesIdNumber === "string" ? a.emiratesIdNumber.trim() : "",
      },
      settings
    );

    if (validation.manualReviewRequired) {
      manualReviewNationalities.push(`Applicant #${applicantIndex} (${nationality})`);
    }

    if (!validation.eligible) {
      return NextResponse.json(
        { error: `Applicant #${applicantIndex}: ${validation.issues.join("; ")}` },
        { status: 400 }
      );
    }
  }

  // 4. Terms Acceptance Verification
  if (!body.termsAccepted) {
    return NextResponse.json(
      { error: "You must accept the terms, conditions and refund policy to proceed." },
      { status: 400 }
    );
  }

  const primaryApplicantName = typeof rawApplicants[0]?.fullName === "string" ? rawApplicants[0].fullName.trim() : "Primary Applicant";
  const referenceNo = generateReferenceNo();
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
      note: "Official visa filing with Saudi immigration authorities",
    },
    {
      step: "visa_approval",
      timestamp: new Date().toISOString(),
      status: "pending" as const,
      note: "Saudi government visa decision and grant notice",
    },
    {
      step: "visa_delivered",
      timestamp: new Date().toISOString(),
      status: "pending" as const,
      note: "Electronic visa delivery to applicant email & WhatsApp",
    },
  ];

  // 5. Insert Parent Application
  let applicationId: `${string}-${string}-${string}-${string}-${string}` = crypto.randomUUID();
  try {
    const { data: appRow, error: appErr } = await supabase
      .from("visa_applications")
      .insert({
        id: applicationId,
        reference_no: referenceNo,
        tracking_token: trackingToken,
        visa_type_slug: "saudi-tourist",
        product_id: null,
        product_title: `Saudi 1-Year Multiple Entry Tourist Visa (${applicationType === "family" ? "Family Application" : "Individual"})`,
        applicant_count: rawApplicants.length,
        primary_contact_name: primaryApplicantName,
        primary_contact_email: email,
        primary_contact_phone: phone,
        nationality: (rawApplicants[0]?.nationality as string) || "Not Specified",
        country_of_residence: "United Arab Emirates",
        travel_date: (typeof body.travelDate === "string" ? body.travelDate.trim() : null) || null,
        purpose_of_visit: (typeof body.travelPurpose === "string" ? body.travelPurpose.trim() : "Umrah / Tourism"),
        duration_of_stay: "1 Year Multiple Entry",
        residential_address: { country: "United Arab Emirates" },
        fee_breakdown: {
          application_type: applicationType,
          base_price: pricing.pricePerApplicant,
          applicant_count: pricing.applicantCount,
          original_total: pricing.originalTotal,
          family_discount_percentage: pricing.familyDiscountPercentage,
          family_discount_amount: pricing.familyDiscountAmount,
          final_payable_amount: pricing.finalPayableAmount,
          currency: pricing.currency,
          is_family_discount_applied: pricing.isFamilyDiscountApplied,
        },
        total_amount: pricing.finalPayableAmount,
        currency: "AED",
        payment_gateway: paymentGateway,
        charged_currency: "AED",
        charged_amount: pricing.finalPayableAmount,
        payment_status: "pending",
        application_status: "draft",
        internal_notes: manualReviewNationalities.length > 0 ? `Manual verification requested: ${manualReviewNationalities.join("; ")}` : null,
        status_timeline: initialTimeline,
      })
      .select("id")
      .single();

    if (appErr) {
      console.warn("[saudi-visa-checkout] Error inserting visa_applications:", appErr.message);
    } else if (appRow?.id) {
      applicationId = appRow.id as `${string}-${string}-${string}-${string}-${string}`;
    }
  } catch (err) {
    console.warn("[saudi-visa-checkout] Error writing application:", err);
  }

  // 6. Insert Individual Applicants
  try {
    const applicantRows = rawApplicants.map((a: Record<string, unknown>, idx: number) => ({
      application_id: applicationId,
      applicant_number: idx + 1,
      full_name: typeof a.fullName === "string" ? a.fullName.trim() : `Applicant ${idx + 1}`,
      date_of_birth: typeof a.dateOfBirth === "string" && a.dateOfBirth.trim() ? a.dateOfBirth.trim() : "1990-01-01",
      gender: typeof a.gender === "string" && a.gender.trim() ? a.gender.trim() : "Other",
      nationality: typeof a.nationality === "string" ? a.nationality.trim() : "India",
      country_of_residence: "United Arab Emirates",
      passport_number: typeof a.passportNumber === "string" ? a.passportNumber.trim() : "PENDING",
      passport_issue_date: typeof a.passportIssueDate === "string" && a.passportIssueDate.trim() ? a.passportIssueDate.trim() : "N/A",
      passport_expiry_date: typeof a.passportExpiryDate === "string" && a.passportExpiryDate.trim() ? a.passportExpiryDate.trim() : "2030-01-01",
      place_of_issue: typeof a.placeOfIssue === "string" && a.placeOfIssue.trim() ? a.placeOfIssue.trim() : "N/A",
    }));

    await supabase.from("visa_applicants").insert(applicantRows);
  } catch (err) {
    console.warn("[saudi-visa-checkout] Error inserting visa_applicants:", err);
  }

  // 7. Insert Uploaded Documents (Secure Storage Paths)
  const uploadedDocs = Array.isArray(body.uploadedDocuments) ? body.uploadedDocuments : [];
  if (uploadedDocs.length > 0) {
    try {
      const docRows = uploadedDocs.map((d: Record<string, unknown>) => ({
        application_id: applicationId,
        document_type: typeof d.documentType === "string" ? d.documentType : "document",
        file_path: typeof d.filePath === "string" ? d.filePath : "unknown",
        file_name: typeof d.fileName === "string" ? d.fileName : "document.pdf",
        file_size: typeof d.fileSize === "number" ? d.fileSize : 0,
        mime_type: typeof d.mimeType === "string" ? d.mimeType : "application/pdf",
        verification_status: "pending" as const,
      }));

      await supabase.from("visa_application_documents").insert(docRows);
    } catch (err) {
      console.warn("[saudi-visa-checkout] Error inserting visa_application_documents:", err);
    }
  }

  const discountNote =
    pricing.familyDiscountAmount > 0
      ? ` · Includes 5% Family Discount (-AED ${pricing.familyDiscountAmount.toFixed(2)})`
      : "";
  const itemDescription = `Saudi 1-Year Multiple Entry Tourist Visa · Reference: ${referenceNo} (${pricing.applicantCount} Applicant${pricing.applicantCount > 1 ? "s" : ""})${discountNote}`;

  // 8. Handle Tabby Pay in 4 Branch
  if (paymentGateway === "tabby") {
    if (!isTabbyCheckoutEnabled()) {
      return NextResponse.json(
        { error: "Tabby Pay in 4 is currently unavailable. Please select card payment." },
        { status: 400 }
      );
    }

    const successUrl = `${siteOrigin}/saudi-visa/confirmation?ref=${referenceNo}&token=${trackingToken}&tabby=1&payment_id={payment_id}`;
    const cancelUrl = `${siteOrigin}/saudi-visa?cancelled=1#apply`;
    const failureUrl = `${siteOrigin}/saudi-visa?failed=1#apply`;

    try {
      const tabbySession = await createTabbyCheckoutSession({
        amount: pricing.finalPayableAmount,
        currency: "AED",
        description: `Masaar Holidays: Saudi Visa (${referenceNo})`,
        referenceId: referenceNo,
        buyer: {
          name: primaryApplicantName,
          email,
          phone,
          dob: typeof rawApplicants[0]?.dateOfBirth === "string" ? rawApplicants[0].dateOfBirth : undefined,
        },
        items: [
          {
            title: `Saudi 1-Year Tourist Visa (${applicationType === "family" ? "Family Application" : "Individual"})`,
            description: itemDescription,
            quantity: 1,
            unitPrice: pricing.finalPayableAmount,
            category: "Visa Services",
            referenceId: `saudi-visa-${applicationType}`,
          },
        ],
        successUrl,
        cancelUrl,
        failureUrl,
        shippingAddress: {
          city: "Dubai",
          address: "United Arab Emirates",
          zip: "00000",
        },
      });

      try {
        await supabase
          .from("visa_applications")
          .update({
            tabby_session_id: tabbySession.sessionId,
            tabby_payment_id: tabbySession.paymentId,
          })
          .eq("id", applicationId);
      } catch (saveErr) {
        console.warn("[saudi-visa-checkout] Error saving tabby session id:", saveErr);
      }

      return NextResponse.json({
        url: tabbySession.webUrl,
        referenceNo,
        trackingToken,
        paymentGateway: "tabby",
        chargedAmount: pricing.finalPayableAmount,
        chargedCurrency: "AED",
        installmentAmount: Math.round((pricing.finalPayableAmount / 4) * 100) / 100,
      });
    } catch (tabbyErr: unknown) {
      const msg = tabbyErr instanceof Error ? tabbyErr.message : "Tabby checkout error";
      console.error("[saudi-visa-checkout] Tabby checkout failed:", msg);
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  // 9. Handle Stripe Card Checkout Branch
  let stripe;
  try {
    stripe = getStripe();
  } catch (stripeErr) {
    console.error("Stripe initialization error:", stripeErr);
    return NextResponse.json({ error: "Payment gateway is currently unavailable." }, { status: 500 });
  }

  const stripeSuccessUrl = `${siteOrigin}/saudi-visa/confirmation?ref=${referenceNo}&token=${trackingToken}&session_id={CHECKOUT_SESSION_ID}&paid=1`;
  const stripeCancelUrl = `${siteOrigin}/saudi-visa?cancelled=1#apply`;
  const chargedAmountMinor = Math.round(pricing.finalPayableAmount * 100);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "aed",
      customer_email: email,
      client_reference_id: applicationId,
      metadata: {
        type: "visa",
        application_id: applicationId,
        reference_no: referenceNo,
        tracking_token: trackingToken,
        visa_slug: "saudi-tourist",
        application_type: applicationType,
        applicant_count: String(pricing.applicantCount),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "aed",
            unit_amount: chargedAmountMinor,
            product_data: {
              name: `Masaar Holidays: Saudi 1-Year Multiple Entry Tourist Visa`,
              description: itemDescription,
            },
          },
        },
      ],
      success_url: stripeSuccessUrl,
      cancel_url: stripeCancelUrl,
    });

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
      chargedAmount: pricing.finalPayableAmount,
      chargedCurrency: "AED",
    });
  } catch (stripeSessionErr: unknown) {
    const msg = stripeSessionErr instanceof Error ? stripeSessionErr.message : "Stripe session creation failed";
    console.error("[saudi-visa-checkout] Stripe checkout error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
