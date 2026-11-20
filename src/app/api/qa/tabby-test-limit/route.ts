import { NextRequest, NextResponse } from "next/server";
import {
  createTabbyCheckoutSession,
  getTabbyConfig,
  TabbyRejectionError,
} from "@/lib/tabby";
import { getSiteOrigin } from "@/lib/site-url";
import { isAuthorizedQaRequest } from "@/lib/tabby-qa-auth";

export const dynamic = "force-dynamic";

/**
 * Controlled Sandbox QA Test Endpoint for AED 25,000 Limit Testing.
 * Protected by dual-layer security:
 * 1. Strictly restricted to sandbox environment (returns 403 in production).
 * 2. Requires QA authentication (valid passkey via header, cookie, body, or query param; returns 401 if unauthorized).
 * Never processes live payments, never charges real money, and prevents unauthorized visitors from creating sessions.
 */

export async function GET(req: NextRequest) {
  const config = getTabbyConfig();

  if (config.environment !== "sandbox") {
    return NextResponse.json(
      { success: false, error: "Forbidden: This test route is only available in sandbox environment." },
      { status: 403 }
    );
  }

  const authorized = isAuthorizedQaRequest(req);
  if (!authorized) {
    return NextResponse.json(
      {
        success: false,
        authorized: false,
        error: "Unauthorized: QA access passkey is required to access this endpoint.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    authorized: true,
    environment: config.environment,
    merchantCode: config.merchantCode,
    currency: "AED",
    limitAmount: 25000.0,
  });
}

export async function POST(req: NextRequest) {
  const config = getTabbyConfig();

  // 1. Strict sandbox environment protection
  if (config.environment !== "sandbox") {
    return NextResponse.json(
      { success: false, error: "Forbidden: This test route is only available in sandbox environment." },
      { status: 403 }
    );
  }

  // 2. Parse request payload
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // 3. QA Authentication Check
  const authorized = isAuthorizedQaRequest(req, body);
  if (!authorized) {
    return NextResponse.json(
      {
        success: false,
        authorized: false,
        error: "Unauthorized: Valid QA access credentials are required.",
        isAuthRequired: true,
      },
      { status: 401 }
    );
  }

  // 4. Handle Passkey Verification action (sets secure session cookie)
  if (body.action === "verify" || body.action === "auth") {
    const response = NextResponse.json({
      success: true,
      authorized: true,
      message: "QA authentication verified successfully.",
    });

    const keyToStore =
      (typeof body.qaKey === "string" ? body.qaKey : "") ||
      (typeof body.key === "string" ? body.key : "") ||
      (typeof body.passkey === "string" ? body.passkey : "") ||
      req.headers.get("x-qa-key") ||
      "";

    if (keyToStore) {
      response.cookies.set("tabby_qa_auth", keyToStore, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
    }

    return response;
  }

  // 5. Handle Logout / Lock action
  if (body.action === "logout" || body.action === "lock") {
    const response = NextResponse.json({
      success: true,
      authorized: false,
      message: "QA session locked.",
    });
    response.cookies.set("tabby_qa_auth", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return response;
  }

  // 6. Authorized QA Limit Session Creation
  try {
    const siteOrigin = getSiteOrigin();
    const testAmount = 25000.0;
    const testReferenceId = `QA-LIMIT-TEST-${Date.now()}`;

    const buyerName = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Tabby QA Tester";
    const buyerEmail = typeof body.email === "string" && body.email.trim() ? body.email.trim() : "qa-limit-test@tabby.ai";
    const buyerPhone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : "+971500000001";

    const session = await createTabbyCheckoutSession({
      amount: testAmount,
      currency: "AED",
      description: "Tabby QA Sandbox Test Product (AED 25,000)",
      referenceId: testReferenceId,
      buyer: {
        name: buyerName,
        email: buyerEmail,
        phone: buyerPhone,
      },
      items: [
        {
          title: "Tabby Sandbox Limit Test Product",
          description: "Controlled QA test item to verify Tabby pre-scoring limit response (AED 25,000)",
          quantity: 1,
          unitPrice: testAmount,
          category: "QA Test",
          referenceId: testReferenceId,
        },
      ],
      successUrl: `${siteOrigin}/qa/tabby-test-limit?success=1`,
      cancelUrl: `${siteOrigin}/qa/tabby-test-limit?cancelled=1`,
      failureUrl: `${siteOrigin}/qa/tabby-test-limit?failed=1`,
    });

    return NextResponse.json({
      success: true,
      status: "approved",
      webUrl: session.webUrl,
      sessionId: session.sessionId,
      amount: testAmount,
      currency: "AED",
    });
  } catch (err: unknown) {
    if (err instanceof TabbyRejectionError) {
      return NextResponse.json({
        success: false,
        status: "rejected",
        rejectionCode: err.rejectionCode,
        approvedMessage: err.approvedMessage,
        isTabbyRejection: true,
      });
    }

    const msg = err instanceof Error ? err.message : "Tabby request failed";
    return NextResponse.json({
      success: false,
      status: "error",
      error: msg,
      approvedMessage: "Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method.",
      isTabbyRejection: true,
    });
  }
}
