import { NextRequest, NextResponse } from "next/server";
import {
  createTabbyCheckoutSession,
  getTabbyConfig,
  TabbyRejectionError,
} from "@/lib/tabby";
import { getSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/**
 * Controlled Sandbox QA Test Endpoint for AED 25,000 Limit Testing
 * Strictly restricted to sandbox environment. Never processes live payments or real orders.
 */
export async function POST(req: NextRequest) {
  const config = getTabbyConfig();

  // Strict sandbox protection
  if (config.environment !== "sandbox") {
    return NextResponse.json(
      { error: "Forbidden: This test route is only available in sandbox environment." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const siteOrigin = getSiteOrigin();
    const testAmount = 25000.0;
    const testReferenceId = `QA-LIMIT-TEST-${Date.now()}`;

    const buyerName = body.name?.trim() || "Tabby QA Tester";
    const buyerEmail = body.email?.trim() || "qa-limit-test@tabby.ai";
    const buyerPhone = body.phone?.trim() || "+971500000001";

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
