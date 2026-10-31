import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTabbyPayment, captureTabbyPayment } from "@/lib/tabby";
import { sendVisaPaymentAndSubmissionEmails } from "@/lib/email/service";

export const dynamic = "force-dynamic";

/**
 * Tabby Return URL Server-Side Payment Verification
 *
 * Requirements:
 * - Never mark an application paid merely because the customer reached the return URL.
 * - Always query Tabby API to verify the genuine payment state.
 * - Capture authorized payments immediately upon return.
 * - Prevent duplicate captures or double ledger entries.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const paymentId = typeof body.paymentId === "string" ? body.paymentId.trim() : "";
  const trackingToken = (
    typeof body.trackingToken === "string" && body.trackingToken.trim()
      ? body.trackingToken.trim()
      : typeof body.token === "string" && body.token.trim()
      ? body.token.trim()
      : ""
  );

  if (!paymentId || !trackingToken) {
    return NextResponse.json({ error: "Missing paymentId or trackingToken" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Locate application
  const { data: application, error: appErr } = await supabase
    .from("visa_applications")
    .select("*")
    .eq("tracking_token", trackingToken)
    .maybeSingle();

  if (appErr || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // If application is already verified and marked paid, return success immediately
  if (application.payment_status === "paid") {
    return NextResponse.json({
      success: true,
      status: "paid",
      referenceNo: application.reference_no,
      alreadyVerified: true,
    });
  }

  // 2. Query Tabby API directly to verify true payment state
  let tabbyPayment;
  try {
    tabbyPayment = await getTabbyPayment(paymentId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Tabby verification failed";
    console.error(`[verify-payment] Error contacting Tabby for payment ${paymentId}:`, msg);
    return NextResponse.json({ error: `Verification failed: ${msg}` }, { status: 502 });
  }

  let status = (tabbyPayment.status || "").toUpperCase();
  const paymentAmount = parseFloat(tabbyPayment.amount || String(application.charged_amount || application.total_amount));
  const paymentCurrency = tabbyPayment.currency || application.charged_currency || "AED";

  // 3. Process according to verified status
  if (status === "AUTHORIZED") {
    // Capture the payment to finalize the transaction
    let captureResult;
    try {
      captureResult = await captureTabbyPayment(paymentId, paymentAmount, application.reference_no);
    } catch (captureErr: unknown) {
      const msg = captureErr instanceof Error ? captureErr.message : "Capture failed";
      console.warn(`[verify-payment] Capture notice for ${paymentId}: ${msg}. Checking if already closed...`);
      // If payment was captured concurrently by webhook, recheck status
      try {
        const recheck = await getTabbyPayment(paymentId);
        if ((recheck.status || "").toUpperCase() === "CLOSED") {
          status = "CLOSED";
        } else {
          return NextResponse.json({ error: `Capture failed: ${msg}` }, { status: 500 });
        }
      } catch {
        return NextResponse.json({ error: `Capture failed: ${msg}` }, { status: 500 });
      }
    }

    if (status === "AUTHORIZED") {
      const existingTimeline = Array.isArray(application.status_timeline) ? application.status_timeline : [];
      const updatedTimeline = existingTimeline.map((item: any) => {
        if (item.step === "payment_received") {
          return { ...item, status: "completed" as const, timestamp: new Date().toISOString() };
        }
        if (item.step === "application_under_review") {
          return { ...item, status: "in_progress" as const, timestamp: new Date().toISOString() };
        }
        return item;
      });

      await supabase
        .from("visa_applications")
        .update({
          payment_status: "paid",
          application_status: "submitted",
          tabby_payment_id: paymentId,
          payment_gateway: "tabby",
          payment_method: "Tabby Pay in 4",
          status_timeline: updatedTimeline,
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      // Record ledger entry
      try {
        await supabase.from("visa_payments").insert({
          application_id: application.id,
          transaction_reference: paymentId,
          gateway: "tabby",
          gateway_payment_id: paymentId,
          tabby_payment_id: paymentId,
          tabby_capture_id: captureResult?.id || null,
          amount: paymentAmount,
          currency: paymentCurrency,
          payment_method: "Tabby (4 Installments)",
          payment_status: "paid",
          idempotency_key: `tabby_pay_${paymentId}`,
        });
      } catch (ledgerErr) {
        console.warn("[verify-payment] Ledger record note:", ledgerErr);
      }

      // Dispatch emails asynchronously
      after(async () => {
        try {
          await sendVisaPaymentAndSubmissionEmails(application.id);
        } catch (emailErr) {
          console.error("[verify-payment] Error sending confirmation emails:", emailErr);
        }
      });

      return NextResponse.json({
        success: true,
        status: "paid",
        referenceNo: application.reference_no,
        amount: paymentAmount,
        currency: paymentCurrency,
      });
    }
  }

  if (status === "CLOSED") {
    // Already captured and closed
    await supabase
      .from("visa_applications")
      .update({
        payment_status: "paid",
        tabby_payment_id: paymentId,
        payment_gateway: "tabby",
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    return NextResponse.json({
      success: true,
      status: "paid",
      referenceNo: application.reference_no,
    });
  } else if (status === "REJECTED" || status === "EXPIRED") {
    await supabase
      .from("visa_applications")
      .update({
        payment_status: "failed",
        internal_notes: `Tabby payment verification returned ${status}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    return NextResponse.json({
      success: false,
      status: "failed",
      reason: `Payment was ${status.toLowerCase()} by provider.`,
    });
  }

  return NextResponse.json({
    success: false,
    status: status.toLowerCase(),
    message: "Payment is pending authorization.",
  });
}
